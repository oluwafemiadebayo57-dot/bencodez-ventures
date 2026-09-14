const rateLimit = require('express-rate-limit');

// General limiter: applies to ALL routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 100,                    // 100 requests per window per IP
    message: {
        error: 'Too many requests from this IP. Please try again after 15 minutes.'
    },
    standardHeaders: true,       // Return rate limit info in headers
    legacyHeaders: false,        // Disable old X-RateLimit-* headers
});

// Auth limiter: stricter, applies to login and register
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 10,                     // Only 10 login/register attempts per window
    message: {
        error: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter };