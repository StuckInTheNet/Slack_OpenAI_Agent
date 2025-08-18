require('dotenv').config();
const { App } = require('@slack/bolt');
const { OpenAI } = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

// Listen for app mentions
app.event('app_mention', async ({ event, context, client, say }) => {
  try {
    // Remove the bot mention from the message
    const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
    
    // Send typing indicator
    await client.chat.postMessage({
      channel: event.channel,
      text: '🤔 Thinking...',
      thread_ts: event.thread_ts || event.ts
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 500,
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

// Listen for direct messages
app.message(async ({ message, say }) => {
  // Only respond to messages that are not from bots
  if (message.subtype === undefined || message.subtype === 'bot_message') {
    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: message.text
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      // Send the response
      await say(completion.choices[0].message.content);

    } catch (error) {
      console.error('Error:', error);
      await say(`Sorry, I encountered an error: ${error.message}`);
    }
  }
});

// Start the app
(async () => {
  await app.start();
  console.log('⚡️ Slack bot is running!');
})();