const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./slack_data.db', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createMessagesTable = `
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX(channel_id),
          INDEX(user_id),
          INDEX(timestamp),
          INDEX(thread_ts)
        )
      `;

      const createChannelsTable = `
        CREATE TABLE IF NOT EXISTS channels (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          is_private BOOLEAN DEFAULT FALSE,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          display_name TEXT,
          real_name TEXT,
          email TEXT,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.serialize(() => {
        this.db.run(createMessagesTable);
        this.db.run(createChannelsTable);
        this.db.run(createUsersTable, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async insertMessage(messageData) {
    return new Promise((resolve, reject) => {
      const {
        id, channel_id, channel_name, user_id, user_name,
        text, timestamp, thread_ts, message_type = 'message'
      } = messageData;

      const sql = `
        INSERT OR REPLACE INTO messages 
        (id, channel_id, channel_name, user_id, user_name, text, timestamp, thread_ts, message_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        id, channel_id, channel_name, user_id, user_name,
        text, timestamp, thread_ts, message_type
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async insertChannel(channelData) {
    return new Promise((resolve, reject) => {
      const { id, name, is_private = false } = channelData;
      
      const sql = `
        INSERT OR REPLACE INTO channels (id, name, is_private, last_updated)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [id, name, is_private], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async insertUser(userData) {
    return new Promise((resolve, reject) => {
      const { id, name, display_name, real_name, email } = userData;
      
      const sql = `
        INSERT OR REPLACE INTO users (id, name, display_name, real_name, email, last_updated)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [id, name, display_name, real_name, email], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async searchMessages(query) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.*, c.name as channel_name, u.display_name, u.real_name
        FROM messages m
        LEFT JOIN channels c ON m.channel_id = c.id
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.text LIKE ?
        ORDER BY m.timestamp DESC
        LIMIT 50
      `;

      this.db.all(sql, [`%${query}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getRecentMessages(channelId = null, hours = 24, limit = 100) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      let sql = `
        SELECT m.*, c.name as channel_name, u.display_name, u.real_name
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
        else resolve(rows);
      });
    });
  }

  async getMessagesByDateRange(startDate, endDate, channelId = null) {
    return new Promise((resolve, reject) => {
      const startTimestamp = new Date(startDate).getTime() / 1000;
      const endTimestamp = new Date(endDate).getTime() / 1000;
      
      let sql = `
        SELECT m.*, c.name as channel_name, u.display_name, u.real_name
        FROM messages m
        LEFT JOIN channels c ON m.channel_id = c.id
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.timestamp BETWEEN ? AND ?
      `;
      
      const params = [startTimestamp, endTimestamp];
      
      if (channelId) {
        sql += ' AND m.channel_id = ?';
        params.push(channelId);
      }
      
      sql += ' ORDER BY m.timestamp ASC';

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getChannelSummary(channelId, hours = 24) {
    return new Promise((resolve, reject) => {
      const timeAgo = Date.now() / 1000 - (hours * 3600);
      
      const sql = `
        SELECT 
          COUNT(*) as message_count,
          COUNT(DISTINCT user_id) as unique_users,
          MIN(timestamp) as first_message,
          MAX(timestamp) as last_message,
          c.name as channel_name
        FROM messages m
        LEFT JOIN channels c ON m.channel_id = c.id
        WHERE m.channel_id = ? AND m.timestamp > ?
      `;

      this.db.get(sql, [channelId, timeAgo], (err, row) => {
        if (err) reject(err);
        else resolve(row);
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

module.exports = Database;