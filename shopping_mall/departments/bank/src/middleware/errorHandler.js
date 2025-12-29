function errorHandler(err, req, res, next) {
    console.error('Server Error:', err);
    
    const statusCode = err.status || 500;
    const response = {
        error: 'Server Error',
        message: err.message || 'Something went wrong'
    };
    
    res.status(statusCode).json(response);
}

module.exports = errorHandler;