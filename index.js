require('dotenv').config();
const { App } = require('@slack/bolt');
const { OpenAI } = require('openai');
const Database = require('./database');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Initialize Database
const database = new Database();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Express server for API
const apiApp = express();
apiApp.use(helmet());
apiApp.use(cors());
apiApp.use(express.json());

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
    // Search recent messages
    const recentMessages = await database.getRecentMessages(channelId, 24, 20);
    
    // Search for relevant messages based on query
    const relevantMessages = await database.searchMessages(query);
    
    let context = 'Recent Slack activity:\n';
    
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

// API Routes for OpenAI interface
apiApp.get('/api/search', async (req, res) => {
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

apiApp.get('/api/recent', async (req, res) => {
  try {
    const { channel, hours = 24, limit = 100 } = req.query;
    const messages = await database.getRecentMessages(channel, parseInt(hours), parseInt(limit));
    res.json({ messages, count: messages.length });
  } catch (error) {
    console.error('Recent API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiApp.get('/api/summary', async (req, res) => {
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

apiApp.get('/api/context', async (req, res) => {
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

// Health check endpoint
apiApp.get('/api/health', (req, res) => {
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
    
    // Start API server
    const apiPort = process.env.API_PORT || 3001;
    apiApp.listen(apiPort, () => {
      console.log(`🚀 API server running on port ${apiPort}`);
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