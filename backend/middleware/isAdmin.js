// Middleware: ensure the authenticated user is an admin
// MUST be used AFTER authenticateToken (needs req.user)

function isAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
}

module.exports = isAdmin;