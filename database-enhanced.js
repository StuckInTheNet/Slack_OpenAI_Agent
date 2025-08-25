const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class EnhancedDatabase {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./slack_data.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(' Enhanced Database connected');
          // Enable WAL mode for better performance
          this.db.run('PRAGMA journal_mode = WAL');
          this.db.run('PRAGMA synchronous = NORMAL');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Enhanced messages table with more metadata
        this.db.run(`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            channel_id TEXT NOT NULL,
            channel_name TEXT,
            user_id TEXT NOT NULL,
            user_name TEXT,
            text TEXT NOT NULL,
            timestamp REAL NOT NULL,
            thread_ts TEXT,
            message_type TEXT DEFAULT 'message',
            mentions_count INTEGER DEFAULT 0,
            links_count INTEGER DEFAULT 0,
            attachments_count INTEGER DEFAULT 0,
            word_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) {
            console.error('Error creating messages table:', err);
            reject(err);
            return;
          }
        });

        // Channels table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS channels (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            is_private BOOLEAN DEFAULT FALSE,
            topic TEXT,
            purpose TEXT,
            member_count INTEGER DEFAULT 0,
            last_activity DATETIME,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) {
            console.error('Error creating channels table:', err);
            reject(err);
            return;
          }
        });

        // Users table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            display_name TEXT,
            real_name TEXT,
            email TEXT,
            status TEXT,
            timezone TEXT,
            is_bot BOOLEAN DEFAULT FALSE,
            last_seen DATETIME,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) {
            console.error('Error creating users table:', err);
            reject(err);
            return;
          }
        });

        // Query logs table for analytics
        this.db.run(`
          CREATE TABLE IF NOT EXISTS query_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            query TEXT,
            intents TEXT,
            response_length INTEGER,
            response_time_ms INTEGER,
            timestamp REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) {
            console.error('Error creating query_logs table:', err);
          }
        });

        // Thread summary table for better thread tracking
        this.db.run(`
          CREATE TABLE IF NOT EXISTS thread_summaries (
            thread_ts TEXT PRIMARY KEY,
            channel_id TEXT,
            starter_user_id TEXT,
            participant_count INTEGER,
            message_count INTEGER,
            last_reply REAL,
            summary TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) {
            console.error('Error creating thread_summaries table:', err);
          }
        });

        // Create optimized indexes
        const indexes = [
          'CREATE INDEX IF NOT EXISTS idx_messages_channel_timestamp ON messages(channel_id, timestamp DESC)',
          'CREATE INDEX IF NOT EXISTS idx_messages_user_timestamp ON messages(user_id, timestamp DESC)',
          'CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_ts)',
          'CREATE INDEX IF NOT EXISTS idx_messages_text_fts ON messages(text)',
          'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)',
          'CREATE INDEX IF NOT EXISTS idx_query_logs_user ON query_logs(user_id, timestamp DESC)',
          'CREATE INDEX IF NOT EXISTS idx_thread_summaries_channel ON thread_summaries(channel_id, last_reply DESC)'
        ];

        let indexCount = 0;
        indexes.forEach(indexSql => {
          this.db.run(indexSql, (err) => {
            if (err) {
              console.error('Error creating index:', err);
            }
            indexCount++;
            if (indexCount === indexes.length) {
              console.log(' Enhanced database tables and indexes created successfully');
              resolve();
            }
          });
        });
      });
    });
  }

  // Enhanced message insertion with metadata
  async insertEnhancedMessage(messageData) {
    return new Promise((resolve, reject) => {
      const {
        id, channel_id, channel_name, user_id, user_name,
        text, timestamp, thread_ts, message_type = 'message',
        mentions_count = 0, links_count = 0, attachments_count = 0,
        word_count = 0
      } = messageData;

      const sql = `
        INSERT OR REPLACE INTO messages 
        (id, channel_id, channel_name, user_id, user_name, text, timestamp, thread_ts, 
         message_type, mentions_count, links_count, attachments_count, word_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        id, channel_id, channel_name, user_id, user_name,
        text, timestamp, thread_ts, message_type,
        mentions_count, links_count, attachments_count, word_count
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Smart search with relevance scoring
  async smartSearchMessages(query, hours = 24) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      // Split query into words for better matching
      const queryWords = query.toLowerCase().split(/\s+/);
      const likeConditions = queryWords.map(() => 'LOWER(m.text) LIKE ?').join(' OR ');
      const likeParams = queryWords.map(word => `%${word}%`);
      
      const sql = `
        SELECT m.*, c.name as channel_name, u.display_name, u.real_name,
               (CASE 
                 WHEN LOWER(m.text) LIKE ? THEN 3
                 WHEN ${likeConditions} THEN 2
                 ELSE 1
               END) as relevance_score
        FROM messages m
        LEFT JOIN channels c ON m.channel_id = c.id
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.timestamp > ? AND (${likeConditions})
        ORDER BY relevance_score DESC, m.timestamp DESC
        LIMIT 100
      `;

      const params = [`%${query.toLowerCase()}%`, ...likeParams, timeAgo, ...likeParams];
      
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Get enhanced channel summary with more metrics
  async getEnhancedChannelSummary(channelId, hours = 24) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      const sql = `
        SELECT 
          COUNT(*) as message_count,
          COUNT(DISTINCT m.user_id) as unique_users,
          MIN(m.timestamp) as first_message,
          MAX(m.timestamp) as last_message,
          AVG(m.word_count) as avg_message_length,
          SUM(m.mentions_count) as total_mentions,
          SUM(m.links_count) as total_links,
          COUNT(DISTINCT m.thread_ts) as thread_count,
          c.name as channel_name,
          (SELECT u.display_name || ' (' || COUNT(*) || ' messages)' 
           FROM messages m2 
           LEFT JOIN users u ON m2.user_id = u.id
           WHERE m2.channel_id = ? AND m2.timestamp > ?
           GROUP BY m2.user_id 
           ORDER BY COUNT(*) DESC 
           LIMIT 1) as most_active_user,
          strftime('%H:00', datetime(m.timestamp, 'unixepoch')) as peak_hour
        FROM messages m
        LEFT JOIN channels c ON m.channel_id = c.id
        WHERE m.channel_id = ? AND m.timestamp > ?
        GROUP BY peak_hour
        ORDER BY COUNT(*) DESC
        LIMIT 1
      `;

      const params = channelId ? [channelId, timeAgo, channelId, timeAgo] : [null, timeAgo, null, timeAgo];

      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || {});
      });
    });
  }

  // Get message sentiment analysis (simplified)
  async getMessageSentiment(channelId, hours = 24) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      // Simple sentiment analysis based on keywords
      const sql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE 
            WHEN LOWER(text) LIKE '%happy%' OR LOWER(text) LIKE '%great%' OR 
                 LOWER(text) LIKE '%awesome%' OR LOWER(text) LIKE '%excellent%' OR
                 LOWER(text) LIKE '%good%' OR LOWER(text) LIKE '%thanks%' OR
                 LOWER(text) LIKE '%love%' OR text LIKE '%😊%' OR text LIKE '%😄%'
            THEN 1 ELSE 0 
          END) as positive,
          SUM(CASE 
            WHEN LOWER(text) LIKE '%bad%' OR LOWER(text) LIKE '%terrible%' OR 
                 LOWER(text) LIKE '%awful%' OR LOWER(text) LIKE '%hate%' OR
                 LOWER(text) LIKE '%angry%' OR LOWER(text) LIKE '%frustrated%' OR
                 text LIKE '%😞%' OR text LIKE '%😠%'
            THEN 1 ELSE 0 
          END) as negative
        FROM messages
        WHERE timestamp > ? ${channelId ? 'AND channel_id = ?' : ''}
      `;

      const params = channelId ? [timeAgo, channelId] : [timeAgo];

      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          const total = row.total || 1;
          const positive = Math.round((row.positive / total) * 100);
          const negative = Math.round((row.negative / total) * 100);
          const neutral = 100 - positive - negative;
          
          resolve({ positive, negative, neutral });
        }
      });
    });
  }

  // Get thread messages
  async getThreadMessages(query, hours = 24) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      const sql = `
        SELECT 
          thread_ts,
          COUNT(*) as reply_count,
          GROUP_CONCAT(DISTINCT user_name) as participants,
          MIN(text) as thread_start,
          MAX(timestamp) as last_reply
        FROM messages
        WHERE thread_ts IS NOT NULL 
          AND timestamp > ?
          AND LOWER(text) LIKE ?
        GROUP BY thread_ts
        ORDER BY last_reply DESC
        LIMIT 20
      `;

      this.db.all(sql, [timeAgo, `%${query.toLowerCase()}%`], (err, rows) => {
        if (err) reject(err);
        else {
          const threads = rows.map(row => ({
            thread_ts: row.thread_ts,
            reply_count: row.reply_count,
            participants: row.participants,
            thread_summary: `Thread with ${row.reply_count} replies: "${row.thread_start.substring(0, 100)}..."`
          }));
          resolve(threads);
        }
      });
    });
  }

  // Get top messages (most reacted/replied)
  async getTopMessages(channelId, hours = 24, limit = 10) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      const sql = `
        SELECT m.*, u.display_name, u.real_name,
               (SELECT COUNT(*) FROM messages WHERE thread_ts = m.id) as reply_count
        FROM messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.timestamp > ? ${channelId ? 'AND m.channel_id = ?' : ''}
          AND m.thread_ts IS NULL
        ORDER BY reply_count DESC, m.word_count DESC
        LIMIT ?
      `;

      const params = channelId ? [timeAgo, channelId, limit] : [timeAgo, limit];

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Get peak activity hours
  async getPeakActivityHours(channelId, hours = 24) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      const sql = `
        SELECT 
          strftime('%H', datetime(timestamp, 'unixepoch')) as hour,
          COUNT(*) as message_count
        FROM messages
        WHERE timestamp > ? ${channelId ? 'AND channel_id = ?' : ''}
        GROUP BY hour
        ORDER BY hour
      `;

      const params = channelId ? [timeAgo, channelId] : [timeAgo];

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Get active channels
  async getActiveChannels(hours = 24) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      const sql = `
        SELECT DISTINCT c.*
        FROM channels c
        INNER JOIN messages m ON c.id = m.channel_id
        WHERE m.timestamp > ?
        ORDER BY c.name
      `;

      this.db.all(sql, [timeAgo], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Log queries for analytics
  async logQuery(queryData) {
    return new Promise((resolve, reject) => {
      const { user_id, query, intents, response_length, response_time_ms, timestamp } = queryData;
      
      const sql = `
        INSERT INTO query_logs (user_id, query, intents, response_length, response_time_ms, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [user_id, query, intents, response_length, response_time_ms, timestamp], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Get system statistics
  async getSystemStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM messages) as total_messages,
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM channels) as total_channels,
          (SELECT COUNT(*) FROM query_logs) as total_queries,
          (SELECT COUNT(*) FROM messages WHERE timestamp > ?) as messages_24h
      `;

      const timeAgo = Date.now() / 1000 - (24 * 3600);

      this.db.get(sql, [timeAgo], (err, row) => {
        if (err) reject(err);
        else resolve(row || {});
      });
    });
  }

  // Original methods for backward compatibility
  async insertMessage(messageData) {
    return this.insertEnhancedMessage(messageData);
  }

  async insertChannel(channelData) {
    return new Promise((resolve, reject) => {
      const { id, name, is_private = false, topic, purpose, member_count } = channelData;
      
      const sql = `
        INSERT OR REPLACE INTO channels (id, name, is_private, topic, purpose, member_count, last_activity, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [id, name, is_private, topic, purpose, member_count], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async insertUser(userData) {
    return new Promise((resolve, reject) => {
      const { id, name, display_name, real_name, email, status, timezone, is_bot } = userData;
      
      const sql = `
        INSERT OR REPLACE INTO users (id, name, display_name, real_name, email, status, timezone, is_bot, last_seen, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [id, name, display_name, real_name, email, status, timezone, is_bot], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async searchMessages(query) {
    return this.smartSearchMessages(query, 24);
  }

  async getRecentMessages(channelId = null, hours = 24, limit = 100) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      let sql = `
        SELECT m.*, c.name as channel_name_from_table, u.display_name, u.real_name
        FROM messages m
        LEFT JOIN channels c ON m.channel_id = c.id
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.timestamp > ?
      `;
      
      const params = [timeAgo];
      
      if (channelId) {
        sql += ' AND m.channel_id = ?';
        params.push(channelId);
      }
      
      sql += ' ORDER BY m.timestamp DESC LIMIT ?';
      params.push(limit);

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getChannelSummary(channelId, hours = 24) {
    return this.getEnhancedChannelSummary(channelId, hours);
  }

  async getUserMessageCounts(hours = 24) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      const sql = `
        SELECT 
          COALESCE(u.display_name, u.name, m.user_name, 'Unknown User') as user_display,
          m.user_id,
          COUNT(*) as message_count,
          AVG(m.word_count) as avg_message_length,
          SUM(m.mentions_count) as total_mentions
        FROM messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.timestamp > ?
        GROUP BY m.user_id
        ORDER BY message_count DESC
        LIMIT 20
      `;

      this.db.all(sql, [timeAgo], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          else console.log('Database connection closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = EnhancedDatabase;