// Custom error class for API errors
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;   // Marks this as a known, expected error
        Error.captureStackTrace(this, this.constructor);
    }
}

// 404 handler for undefined routes
function notFoundHandler(req, res, next) {
    const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
    next(error);   // Pass to the error handler
}

// Global error handler — MUST have 4 parameters
function errorHandler(err, req, res, next) {
    // Default values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Something went wrong';

    // Log the full error in development
    if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Error:', {
            message: err.message,
            statusCode,
            path: req.originalUrl,
            method: req.method,
            stack: err.stack
        });
    } else {
        // In production, log minimal info (or send to a logging service)
        console.error(`❌ ${statusCode} - ${message} - ${req.method} ${req.originalUrl}`);
    }

    // Send consistent error response
    res.status(statusCode).json({
        error: message,
        status: statusCode,
        path: req.originalUrl
    });
}

module.exports = {
    ApiError,
    notFoundHandler,
    errorHandler
};