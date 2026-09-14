const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    // 1. Get the Authorization header
    const authHeader = req.headers['authorization'];
    
    // 2. Header looks like: "Bearer eyJhbGciOi..."
    //    We need just the token part (after "Bearer ")
    const token = authHeader && authHeader.split(' ')[1];

    // 3. If no token, reject
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // 4. Verify the token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 5. Attach user info to the request
        req.user = decoded;
        
        // 6. Continue to the next function (the actual route handler)
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authenticateToken;