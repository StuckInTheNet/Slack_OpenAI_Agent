// Security improvements for the API endpoints
const crypto = require('crypto');

// Generate a secure API key
const API_KEY = process.env.API_SECRET_KEY || crypto.randomBytes(32).toString('hex');

// Middleware to check API authentication
function authenticateAPI(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

// Rate limiting
const rateLimits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const limit = rateLimits.get(ip) || { count: 0, resetTime: now + 60000 };
  
  if (now > limit.resetTime) {
    limit.count = 0;
    limit.resetTime = now + 60000;
  }
  
  limit.count++;
  
  if (limit.count > 100) { // 100 requests per minute
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  rateLimits.set(ip, limit);
  next();
}

// Apply security middleware to all API routes
apiApp.use('/api/*', authenticateAPI);
apiApp.use('/api/*', rateLimit);

// Only listen on localhost for security
apiApp.listen(apiPort, '127.0.0.1', () => {
  console.log(`🚀 API server running on localhost:${apiPort}`);
  console.log(`🔐 API Key: ${API_KEY}`);
  console.log('⚠️  Add this to your .env file: API_SECRET_KEY=' + API_KEY);
});

module.exports = { authenticateAPI, rateLimit };