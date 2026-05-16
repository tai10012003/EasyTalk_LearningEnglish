class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code || 'INTERNAL_ERROR';
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            statusCode,
            code,
            path: req.path,
            method: req.method
        });
    }
    if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = err.message;
    }
    if (err.name === 'CastError') {
        statusCode = 400;
        code = 'INVALID_ID';
        message = 'Invalid ID format';
    }
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = process.env.NODE_ENV === 'production' 
            ? 'Database operation failed' 
            : err.message;
    }
    if (err.code === 11000) {
        statusCode = 409;
        code = 'DUPLICATE_ERROR';
        const field = Object.keys(err.keyPattern || {})[0];
        message = field ? `${field} already exists` : 'Duplicate entry';
    }
    res.status(statusCode).json({
        success: false,
        message,
        code,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

const notFound = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
    next(error);
};

module.exports = { AppError, errorHandler, asyncHandler, notFound };