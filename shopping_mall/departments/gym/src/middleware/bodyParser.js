function bodyParser(req, res, next) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                if (body) {
                    req.body = JSON.parse(body);
                } else {
                    req.body = {};
                }
                next();
            } catch (error) {
                res.status(400).json({ error: 'Неверный формат JSON' });
            }
        });
        
        req.on('error', (error) => {
            next(error);
        });
    } else {
        req.body = {};
        next();
    }
}

module.exports = bodyParser;