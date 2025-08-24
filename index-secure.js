require('dotenv').config();
const { App } = require('@slack/bolt');
const { OpenAI } = require('openai');
const Database = require('./database-fixed');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');

// Security Configuration
const API_KEY = process.env.API_SECRET_KEY || crypto.randomBytes(32).toString('hex');
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];

// Initialize Database
const database = new Database();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Express server for API with security
const apiApp = express();

// Security middleware
apiApp.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
apiApp.use(cors({
  origin: function(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

apiApp.use(express.json({ limit: '1mb' })); // Limit payload size

// Rate limiting
const rateLimits = new Map();
function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const userLimits = rateLimits.get(ip) || { count: 0, resetTime: now + windowMs };
    
    if (now > userLimits.resetTime) {
      userLimits.count = 0;
      userLimits.resetTime = now + windowMs;
    }
    
    userLimits.count++;
    
    if (userLimits.count > maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((userLimits.resetTime - now) / 1000)
      });
    }
    
    rateLimits.set(ip, userLimits);
    next();
  };
}

// API Authentication middleware
function authenticateAPI(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  if (apiKey !== API_KEY) {
    // Log failed authentication attempt
    console.warn(`Failed API authentication from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
}

// Input validation middleware
function validateInput(req, res, next) {
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        // Remove any potential SQL injection attempts
        req.query[key] = req.query[key].replace(/[;'"\\]/g, '');
      }
    }
  }
  next();
}

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

// Helper function to store message
async function storeMessage(event, channelInfo = null, userInfo = null) {
  try {
    await database.insertMessage({
      id: event.ts,
      channel_id: event.channel,
      channel_name: channelInfo?.name || null,
      user_id: event.user,
      user_name: userInfo?.name || null,
      text: event.text,
      timestamp: parseFloat(event.ts),
      thread_ts: event.thread_ts || null,
      message_type: event.subtype || 'message'
    });
  } catch (error) {
    console.error('Error storing message:', error);
  }
}

// Helper function to get enhanced context for queries
async function getEnhancedContext(query, channelId = null) {
  try {
    // Check if the query is asking about message counts or who they talked to most
    const isUserStatsQuery = query.toLowerCase().includes('talked to') || 
                           query.toLowerCase().includes('message') && (query.toLowerCase().includes('most') || query.toLowerCase().includes('who'));
    
    let context = 'Recent Slack activity:\n';
    
    if (isUserStatsQuery) {
      // Get user message counts for stats queries
      const userCounts = await database.getUserMessageCounts(24);
      if (userCounts.length > 0) {
        context += '\nMessage counts in the last 24 hours:\n';
        userCounts.forEach((user, index) => {
          context += `${index + 1}. ${user.user_display}: ${user.message_count} messages\n`;
        });
      }
    }
    
    // Search recent messages
    const recentMessages = await database.getRecentMessages(channelId, 24, 20);
    
    // Search for relevant messages based on query
    const relevantMessages = await database.searchMessages(query);
    
    if (recentMessages.length > 0) {
      context += '\nRecent messages (last 24h):\n';
      recentMessages.slice(0, 10).forEach(msg => {
        const time = new Date(msg.timestamp * 1000).toLocaleString();
        context += `[${time}] ${msg.channel_name || 'DM'} - ${msg.user_name || msg.display_name}: ${msg.text}\n`;
      });
    }
    
    if (relevantMessages.length > 0) {
      context += '\nRelevant messages:\n';
      relevantMessages.slice(0, 5).forEach(msg => {
        const time = new Date(msg.timestamp * 1000).toLocaleString();
        context += `[${time}] ${msg.channel_name || 'DM'} - ${msg.user_name || msg.display_name}: ${msg.text}\n`;
      });
    }
    
    return context;
  } catch (error) {
    console.error('Error getting enhanced context:', error);
    return '';
  }
}

// Listen for all messages to store them
app.message(async ({ message, client }) => {
  // Don't store bot messages
  if (message.subtype === 'bot_message' || message.bot_id) return;
  
  try {
    // Get channel info
    let channelInfo = null;
    try {
      const channelResult = await client.conversations.info({ channel: message.channel });
      channelInfo = channelResult.channel;
      
      // Store channel info
      await database.insertChannel({
        id: channelInfo.id,
        name: channelInfo.name,
        is_private: channelInfo.is_private
      });
    } catch (err) {
      console.log('Could not get channel info:', err.message);
    }
    
    // Get user info
    let userInfo = null;
    try {
      const userResult = await client.users.info({ user: message.user });
      userInfo = userResult.user;
      
      // Store user info
      await database.insertUser({
        id: userInfo.id,
        name: userInfo.name,
        display_name: userInfo.profile?.display_name,
        real_name: userInfo.profile?.real_name,
        email: userInfo.profile?.email
      });
    } catch (err) {
      console.log('Could not get user info:', err.message);
    }
    
    // Store the message
    await storeMessage(message, channelInfo, userInfo);
    
  } catch (error) {
    console.error('Error processing message for storage:', error);
  }
});

// Listen for app mentions
app.event('app_mention', async ({ event, context, client, say }) => {
  try {
    // Store the mention message first
    await storeMessage(event);
    
    // Remove the bot mention from the message
    const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
    
    // Send typing indicator
    await client.chat.postMessage({
      channel: event.channel,
      text: '🤔 Thinking...',
      thread_ts: event.thread_ts || event.ts
    });

    // Get enhanced context from stored messages
    const context = await getEnhancedContext(text, event.channel);
    
    // Create enhanced prompt with context
    const enhancedPrompt = context ? 
      `Context from Slack workspace:\n${context}\n\nUser question: ${text}` : 
      text;

    // Call OpenAI API with enhanced context
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful Slack assistant with access to recent conversation history. Use the provided context to give relevant, helpful responses about Slack activity and conversations."
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    // Send the response
    await say({
      text: completion.choices[0].message.content,
      thread_ts: event.thread_ts || event.ts
    });

  } catch (error) {
    console.error('Error:', error);
    await say({
      text: `Sorry, I encountered an error: ${error.message}`,
      thread_ts: event.thread_ts || event.ts
    });
  }
});

// API Routes with authentication
// Create security middleware chain
const secureAPI = [rateLimit(100, 60000), authenticateAPI, validateInput];

apiApp.get('/api/search', ...secureAPI, async (req, res) => {
  try {
    const { query, hours = 24, limit = 50 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const messages = await database.searchMessages(query);
    res.json({ messages, count: messages.length });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiApp.get('/api/recent', ...secureAPI, async (req, res) => {
  try {
    const { channel, hours = 24, limit = 100 } = req.query;
    const messages = await database.getRecentMessages(channel, parseInt(hours), parseInt(limit));
    res.json({ messages, count: messages.length });
  } catch (error) {
    console.error('Recent API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiApp.get('/api/summary', ...secureAPI, async (req, res) => {
  try {
    const { channel, hours = 24 } = req.query;
    
    if (!channel) {
      return res.status(400).json({ error: 'Channel parameter is required' });
    }
    
    const summary = await database.getChannelSummary(channel, parseInt(hours));
    const recentMessages = await database.getRecentMessages(channel, parseInt(hours), 20);
    
    res.json({ summary, recentMessages });
  } catch (error) {
    console.error('Summary API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiApp.get('/api/context', ...secureAPI, async (req, res) => {
  try {
    const { query, channel } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const context = await getEnhancedContext(query, channel);
    res.json({ context });
  } catch (error) {
    console.error('Context API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint (no auth required for monitoring)
apiApp.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start the app
(async () => {
  try {
    // Initialize database
    await database.init();
    console.log('📊 Database initialized');
    
    // Start Slack app
    await app.start();
    console.log('⚡️ Slack bot is running!');
    
    // Start API server - ONLY on localhost for security
    const apiPort = process.env.API_PORT || 3001;
    apiApp.listen(apiPort, '127.0.0.1', () => {
      console.log(`🚀 API server running on localhost:${apiPort}`);
      console.log(`🔐 API Key: ${API_KEY}`);
      if (!process.env.API_SECRET_KEY) {
        console.log('⚠️  Add this to your .env file: API_SECRET_KEY=' + API_KEY);
      }
    });
    
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await database.close();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});