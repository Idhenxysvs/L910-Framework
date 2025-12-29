function errorHandler(err, req, res, next) {
    console.error('🔥 Ошибка:', err);
    
    if (res.headersSent) {
        return next(err);
    }
    
    res.status(err.status || 500).json({
        error: 'Ошибка сервера',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Что-то пошло не так'
    });
}

module.exports = errorHandler;