require('dotenv').config();
const { App } = require('@slack/bolt');
const { OpenAI } = require('openai');
const Database = require('./database-enhanced');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const NodeCache = require('node-cache');
const cron = require('node-cron');

// Initialize Cache (TTL: 5 minutes)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Initialize Database
const database = new Database();

// Initialize OpenAI with better model
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

// Enhanced query understanding with intent detection
function detectQueryIntent(query) {
  const lowQuery = query.toLowerCase();
  
  const intents = {
    summary: /summarize|summary|recap|overview|brief/i.test(query),
    userStats: /who.*talked|message.*count|most active|top.*user/i.test(query),
    search: /find|search|look for|where.*said|mentioned/i.test(query),
    timeQuery: /when|what time|last.*message|recent/i.test(query),
    sentiment: /mood|sentiment|feeling|tone|vibe/i.test(query),
    help: /help|what can you do|commands|how to/i.test(query),
    report: /report|analytics|statistics|metrics/i.test(query),
    thread: /thread|conversation|discussion about/i.test(query)
  };
  
  return Object.entries(intents)
    .filter(([_, matches]) => matches)
    .map(([intent, _]) => intent);
}

// Extract time range from query
function extractTimeRange(query) {
  const patterns = {
    'last hour': 1,
    'past hour': 1,
    'last 2 hours': 2,
    'last 3 hours': 3,
    'last 6 hours': 6,
    'last 12 hours': 12,
    'last day': 24,
    'last 24 hours': 24,
    'last week': 168,
    'last 7 days': 168,
    'today': new Date().getHours(),
    'yesterday': 24
  };
  
  const lowQuery = query.toLowerCase();
  for (const [pattern, hours] of Object.entries(patterns)) {
    if (lowQuery.includes(pattern)) {
      return hours;
    }
  }
  
  // Check for custom patterns like "last X hours/days"
  const customHours = lowQuery.match(/last (\d+) hours?/);
  if (customHours) return parseInt(customHours[1]);
  
  const customDays = lowQuery.match(/last (\d+) days?/);
  if (customDays) return parseInt(customDays[1]) * 24;
  
  return 24; // Default to 24 hours
}

// Enhanced context builder with intelligent filtering
async function getEnhancedContext(query, channelId = null, intents = []) {
  const cacheKey = `context_${query}_${channelId}_${intents.join('_')}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  try {
    let context = '';
    const timeRange = extractTimeRange(query);
    
    // Build context based on detected intents
    if (intents.includes('userStats')) {
      const userCounts = await database.getUserMessageCounts(timeRange);
      if (userCounts.length > 0) {
        context += ' User Activity Statistics:\n';
        userCounts.forEach((user, index) => {
          const position = index === 0 ? '#1' : index === 1 ? '#2' : index === 2 ? '#3' : '-';
          context += `${position} ${user.user_display}: ${user.message_count} messages\n`;
        });
        context += '\n';
      }
    }
    
    if (intents.includes('summary') || intents.includes('report')) {
      const summary = await database.getEnhancedChannelSummary(channelId, timeRange);
      if (summary) {
        context += ' Channel Summary:\n';
        context += `• Total Messages: ${summary.message_count}\n`;
        context += `• Active Users: ${summary.unique_users}\n`;
        context += `• Peak Hour: ${summary.peak_hour || 'N/A'}\n`;
        context += `• Most Active User: ${summary.most_active_user || 'N/A'}\n\n`;
      }
    }
    
    if (intents.includes('sentiment')) {
      const sentimentData = await database.getMessageSentiment(channelId, timeRange);
      if (sentimentData) {
        context += '😊 Sentiment Analysis:\n';
        context += `• Positive: ${sentimentData.positive}%\n`;
        context += `• Neutral: ${sentimentData.neutral}%\n`;
        context += `• Negative: ${sentimentData.negative}%\n\n`;
      }
    }
    
    // Get relevant messages based on query
    const relevantMessages = await database.smartSearchMessages(query, timeRange);
    if (relevantMessages.length > 0) {
      context += '💬 Relevant Messages:\n';
      relevantMessages.slice(0, 10).forEach(msg => {
        const time = new Date(msg.timestamp * 1000).toLocaleString();
        const channelName = msg.channel_name || 'DM';
        const userName = msg.user_name || msg.display_name || 'Unknown';
        context += `[${time}] #${channelName} @${userName}: ${msg.text}\n`;
      });
      context += '\n';
    }
    
    // Get thread context if applicable
    if (intents.includes('thread')) {
      const threads = await database.getThreadMessages(query, timeRange);
      if (threads.length > 0) {
        context += '🧵 Related Threads:\n';
        threads.slice(0, 5).forEach(thread => {
          context += `• ${thread.thread_summary}\n`;
        });
        context += '\n';
      }
    }
    
    cache.set(cacheKey, context);
    return context;
  } catch (error) {
    console.error('Error getting enhanced context:', error);
    return '';
  }
}

// Format response with better Slack formatting
function formatSlackResponse(text, type = 'default') {
  const formats = {
    summary: {
      prefix: ' *Summary Report*\n',
      style: 'section'
    },
    search: {
      prefix: ' *Search Results*\n',
      style: 'list'
    },
    help: {
      prefix: '*Help & Commands*\n',
      style: 'code'
    },
    error: {
      prefix: '⚠️ *Error*\n',
      style: 'warning'
    },
    default: {
      prefix: '',
      style: 'plain'
    }
  };
  
  const format = formats[type] || formats.default;
  return `${format.prefix}${text}`;
}

// Slash command: /ai-summary
app.command('/ai-summary', async ({ command, ack, respond }) => {
  await ack();
  
  try {
    const hours = parseInt(command.text) || 24;
    const summary = await database.getEnhancedChannelSummary(command.channel_id, hours);
    const topMessages = await database.getTopMessages(command.channel_id, hours, 5);
    
    let response = formatSlackResponse(
      `Channel activity for the last ${hours} hours:\n` +
      `• Total messages: ${summary.message_count}\n` +
      `• Active users: ${summary.unique_users}\n` +
      `• Peak activity: ${summary.peak_hour || 'N/A'}\n\n` +
      `*Top Messages:*\n` +
      topMessages.map((msg, i) => `${i+1}. "${msg.text.substring(0, 100)}..." - @${msg.user_name}`).join('\n'),
      'summary'
    );
    
    await respond(response);
  } catch (error) {
    await respond(formatSlackResponse(`Error generating summary: ${error.message}`, 'error'));
  }
});

// Slash command: /ai-search
app.command('/ai-search', async ({ command, ack, respond }) => {
  await ack();
  
  try {
    const results = await database.smartSearchMessages(command.text, 168); // Search last week
    
    if (results.length === 0) {
      await respond('No messages found matching your search.');
      return;
    }
    
    const formatted = results.slice(0, 10).map(msg => {
      const time = new Date(msg.timestamp * 1000).toLocaleString();
      return `• [${time}] @${msg.user_name || 'Unknown'}: ${msg.text.substring(0, 100)}...`;
    }).join('\n');
    
    await respond(formatSlackResponse(
      `Found ${results.length} messages:\n${formatted}`,
      'search'
    ));
  } catch (error) {
    await respond(formatSlackResponse(`Search error: ${error.message}`, 'error'));
  }
});

// Slash command: /ai-report
app.command('/ai-report', async ({ command, ack, respond }) => {
  await ack();
  
  try {
    const report = await generateChannelReport(command.channel_id, command.text);
    await respond({
      blocks: report.blocks,
      text: report.text
    });
  } catch (error) {
    await respond(formatSlackResponse(`Report generation error: ${error.message}`, 'error'));
  }
});

// Slash command: /ai-help
app.command('/ai-help', async ({ command, ack, respond }) => {
  await ack();
  
  const helpText = `
*Available Commands:*
\`/ai-summary [hours]\` - Get channel summary
\`/ai-search <query>\` - Search messages
\`/ai-report [type]\` - Generate detailed report
\`/ai-help\` - Show this help message

*Mention Features:*
• Ask questions about recent conversations
• Get user activity statistics
• Search for specific topics
• Generate summaries
• Analyze sentiment and mood

*Examples:*
• "Who talked the most today?"
• "Summarize the last 3 hours"
• "Find messages about the project deadline"
• "What's the mood in the channel?"
  `;
  
  await respond(formatSlackResponse(helpText, 'help'));
});

// Generate detailed channel report
async function generateChannelReport(channelId, reportType = 'daily') {
  const hours = reportType === 'weekly' ? 168 : 24;
  const summary = await database.getEnhancedChannelSummary(channelId, hours);
  const userStats = await database.getUserMessageCounts(hours);
  const topMessages = await database.getTopMessages(channelId, hours, 5);
  const sentiment = await database.getMessageSentiment(channelId, hours);
  
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: ` ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Channel Report`,
        emoji: true
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Total Messages:*\n${summary.message_count}`
        },
        {
          type: "mrkdwn",
          text: `*Active Users:*\n${summary.unique_users}`
        },
        {
          type: "mrkdwn",
          text: `*Peak Hour:*\n${summary.peak_hour || 'N/A'}`
        },
        {
          type: "mrkdwn",
          text: `*Sentiment:*\n😊 ${sentiment.positive}% Positive`
        }
      ]
    },
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Top Contributors:*\n" + userStats.slice(0, 5).map((u, i) => 
          `${i+1}. ${u.user_display}: ${u.message_count} messages`
        ).join('\n')
      }
    }
  ];
  
  return {
    blocks,
    text: `Channel report generated for the last ${hours} hours`
  };
}

// Enhanced message storage with metadata
async function storeMessage(event, channelInfo = null, userInfo = null) {
  try {
    // Extract mentions, links, and other metadata
    const mentions = (event.text.match(/<@[A-Z0-9]+>/g) || []).length;
    const links = (event.text.match(/https?:\/\/[^\s]+/g) || []).length;
    const hasAttachment = event.files ? event.files.length : 0;
    
    await database.insertEnhancedMessage({
      id: event.ts,
      channel_id: event.channel,
      channel_name: channelInfo?.name || null,
      user_id: event.user,
      user_name: userInfo?.name || null,
      text: event.text,
      timestamp: parseFloat(event.ts),
      thread_ts: event.thread_ts || null,
      message_type: event.subtype || 'message',
      mentions_count: mentions,
      links_count: links,
      attachments_count: hasAttachment,
      word_count: event.text.split(/\s+/).length
    });
  } catch (error) {
    console.error('Error storing message:', error);
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
    
    // Store the message with enhanced metadata
    await storeMessage(message, channelInfo, userInfo);
    
  } catch (error) {
    console.error('Error processing message for storage:', error);
  }
});

// Admin command handler
async function handleAdminCommand(command, event, client, say) {
  const parts = command.trim().split(' ');
  const action = parts[0];

  try {
    switch (action) {
      case 'join-all':
        await joinAllChannels(client, say);
        break;
      case 'list-channels':
        await listAllChannels(client, say);
        break;
      case 'my-channels':
        await listBotChannels(client, say);
        break;
      case 'leave':
        const channelToLeave = parts[1];
        if (channelToLeave) {
          await leaveChannel(client, say, channelToLeave);
        } else {
          await say('Please specify a channel: admin leave #channel-name');
        }
        break;
      default:
        await say(`Admin commands:
• \`admin join-all\` - Join all public channels
• \`admin list-channels\` - List all workspace channels  
• \`admin my-channels\` - List channels I'm in
• \`admin leave #channel\` - Leave specific channel`);
    }
  } catch (error) {
    console.error('Admin command error:', error);
    await say('⚠️ Admin command failed: ' + error.message);
  }
}

// Join all available channels
async function joinAllChannels(client, say) {
  try {
    const channels = await client.conversations.list({
      exclude_archived: true,
      types: 'public_channel'
    });
    
    const joinPromises = channels.channels.map(async (channel) => {
      try {
        await client.conversations.join({ channel: channel.id });
        return { name: channel.name, success: true };
      } catch (error) {
        return { name: channel.name, success: false, error: error.message };
      }
    });
    
    const results = await Promise.all(joinPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    let message = `Joined ${successful.length} channels successfully.`;
    if (failed.length > 0) {
      message += `\nFailed to join ${failed.length} channels: ${failed.map(f => f.name).join(', ')}`;
    }
    
    await say(message);
  } catch (error) {
    await say('⚠️ Failed to join channels: ' + error.message);
  }
}

// List all channels in workspace
async function listAllChannels(client, say) {
  try {
    const channels = await client.conversations.list({
      exclude_archived: true,
      types: 'public_channel,private_channel'
    });
    
    const channelList = channels.channels
      .map(ch => `• #${ch.name} (${ch.is_private ? 'private' : 'public'})`)
      .join('\n');
    
    await say(`All channels in workspace:\n${channelList}`);
  } catch (error) {
    await say('⚠️ Failed to list channels: ' + error.message);
  }
}

// List channels bot is currently in
async function listBotChannels(client, say) {
  try {
    const channels = await client.conversations.list({
      exclude_archived: true,
      types: 'public_channel,private_channel'
    });
    
    const botChannels = [];
    for (const channel of channels.channels) {
      try {
        const members = await client.conversations.members({ channel: channel.id });
        const botInfo = await client.auth.test();
        if (members.members.includes(botInfo.user_id)) {
          botChannels.push(channel);
        }
      } catch (error) {
        // Skip channels we can't access
      }
    }
    
    const channelList = botChannels
      .map(ch => `• #${ch.name}`)
      .join('\n');
    
    await say(`I'm currently in these channels:\n${channelList}`);
  } catch (error) {
    await say('⚠️ Failed to list bot channels: ' + error.message);
  }
}

// Leave a specific channel
async function leaveChannel(client, say, channelName) {
  try {
    // Remove # if present
    channelName = channelName.replace('#', '');
    
    const channels = await client.conversations.list();
    const channel = channels.channels.find(ch => ch.name === channelName);
    
    if (!channel) {
      await say(`Channel #${channelName} not found.`);
      return;
    }
    
    await client.conversations.leave({ channel: channel.id });
    await say(`Left #${channelName} successfully.`);
  } catch (error) {
    await say(`⚠️ Failed to leave #${channelName}: ${error.message}`);
  }
}

// Enhanced app mention handler
app.event('app_mention', async ({ event, context, client, say }) => {
  try {
    // Restrict bot to specific user only (your user ID)
    const AUTHORIZED_USER = 'U09AXJ251CN'; // Your user ID
    if (event.user !== AUTHORIZED_USER) {
      await say('This bot is currently private and only available to authorized users.');
      return;
    }

    // Store the mention message first
    await storeMessage(event);
    
    // Remove the bot mention from the message
    const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
    
    // Check for admin commands first
    if (text.startsWith('admin ')) {
      await handleAdminCommand(text.slice(6), event, client, say);
      return;
    }

    // Detect query intent
    const intents = detectQueryIntent(text);
    
    // Show typing indicator
    const typingMessage = await client.chat.postMessage({
      channel: event.channel,
      text: '🤔 Processing your request...',
      thread_ts: event.thread_ts || event.ts
    });
    
    // Get enhanced context based on intent
    const enhancedContext = await getEnhancedContext(text, event.channel, intents);
    
    // Build system prompt based on intents
    const currentDate = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dateStr = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: timeZone
    });
    const timeStr = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timeZone
    });
    
    let systemPrompt = `You are a highly capable AI co-worker with full access to team conversations, files, and system capabilities.

CURRENT: ${dateStr} at ${timeStr} (${timeZone})

CORE ABILITIES:
• Instant access to all Slack history and analytics
• Can read, analyze, and summarize any content
• Take actions on behalf of team members
• Provide quick, accurate answers without fluff

RESPONSE STYLE:
• Be direct and concise - speed matters
• Lead with the answer, then context if needed
• Use bullet points for clarity
• NO EMOJIS except warning symbol ⚠️ for alerts only
• Default to brief responses unless detail is specifically requested

AUTHORITY: Act as a trusted team member who can access anything needed to help.`;
    
    // Create enhanced prompt with context
    const enhancedPrompt = enhancedContext ? 
      `Context from Slack workspace:\n${enhancedContext}\n\nUser question: ${text}` : 
      text;
    
    // Call OpenAI API optimized for speed and efficiency
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini", // Faster, cheaper model
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      max_tokens: 800, // Reduced for faster responses
      temperature: 0.3, // Lower for more consistent, focused answers
      top_p: 0.8, // Faster than using penalties
      stream: false // Ensure non-streaming for reliability
    });
    
    // Delete typing indicator
    await client.chat.delete({
      channel: event.channel,
      ts: typingMessage.ts
    });
    
    // Format and send the response
    const responseText = completion.choices[0].message.content;
    const responseType = intents[0] || 'default';
    
    await say({
      text: formatSlackResponse(responseText, responseType),
      thread_ts: event.thread_ts || event.ts
    });
    
    // Log query for analytics
    await database.logQuery({
      user_id: event.user,
      query: text,
      intents: intents.join(','),
      response_length: responseText.length,
      timestamp: Date.now() / 1000
    });
    
  } catch (error) {
    console.error('Error:', error);
    await say({
      text: formatSlackResponse(`Sorry, I encountered an error: ${error.message}`, 'error'),
      thread_ts: event.thread_ts || event.ts
    });
  }
});

// Scheduled reports (daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  try {
    const channels = await database.getActiveChannels(24);
    
    for (const channel of channels) {
      const report = await generateChannelReport(channel.id, 'daily');
      
      await app.client.chat.postMessage({
        channel: channel.id,
        blocks: report.blocks,
        text: report.text
      });
    }
  } catch (error) {
    console.error('Error sending scheduled reports:', error);
  }
});

// Enhanced API Routes
apiApp.get('/api/search', async (req, res) => {
  try {
    const { query, hours = 24, limit = 50 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    // Check cache first
    const cacheKey = `search_${query}_${hours}_${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const messages = await database.smartSearchMessages(query, parseInt(hours));
    const result = { messages: messages.slice(0, limit), count: messages.length };
    
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiApp.get('/api/analytics', async (req, res) => {
  try {
    const { channel, hours = 24 } = req.query;
    
    const cacheKey = `analytics_${channel}_${hours}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const summary = await database.getEnhancedChannelSummary(channel, parseInt(hours));
    const userStats = await database.getUserMessageCounts(parseInt(hours));
    const sentiment = await database.getMessageSentiment(channel, parseInt(hours));
    const peakHours = await database.getPeakActivityHours(channel, parseInt(hours));
    
    const analytics = {
      summary,
      userStats,
      sentiment,
      peakHours
    };
    
    cache.set(cacheKey, analytics);
    res.json(analytics);
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiApp.get('/api/threads', async (req, res) => {
  try {
    const { query, hours = 24 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const threads = await database.getThreadMessages(query, parseInt(hours));
    res.json({ threads, count: threads.length });
  } catch (error) {
    console.error('Threads API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

apiApp.get('/api/export', async (req, res) => {
  try {
    const { channel, hours = 24, format = 'json' } = req.query;
    
    const messages = await database.getRecentMessages(channel, parseInt(hours), 1000);
    
    if (format === 'csv') {
      const csv = messages.map(m => 
        `"${m.timestamp}","${m.channel_name}","${m.user_name}","${m.text.replace(/"/g, '""')}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=slack_export.csv');
      res.send('Timestamp,Channel,User,Message\n' + csv);
    } else {
      res.json({ messages, count: messages.length });
    }
  } catch (error) {
    console.error('Export API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check with enhanced metrics
apiApp.get('/api/health', async (req, res) => {
  const stats = await database.getSystemStats();
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: stats,
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    }
  });
});

// Start the app
(async () => {
  try {
    // Initialize database
    await database.init();
    console.log(' Database initialized');
    
    // Start Slack app
    await app.start();
    console.log('Enhanced Slack bot is running!');
    
    // Start API server
    const apiPort = process.env.API_PORT || 3001;
    apiApp.listen(apiPort, () => {
      console.log(` API server running on port ${apiPort}`);
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