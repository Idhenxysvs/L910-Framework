const http = require('http');
const url = require('url');
const querystring = require('querystring');

class GymFramework {
    constructor() {
        this.routes = {
            GET: {},
            POST: {},
            PUT: {},
            DELETE: {},
            PATCH: {}
        };
        this.middlewares = [];
        this.errorHandler = null;
    }

    // Запуск сервера
    listen(port, callback) {
        const server = http.createServer(async (req, res) => {
            try {
                await this.handleRequest(req, res);
            } catch (error) {
                this.handleError(error, req, res);
            }
        });

        server.listen(port, callback);
        console.log(`🏋️ Сервер тренажерного зала запущен на порту ${port}`);
        return server;
    }

    // Обработка запроса
    async handleRequest(req, res) {
        // Инициализируем объекты
        this.initRequest(req);
        this.initResponse(res);

        // Выполняем middleware
        for (const middleware of this.middlewares) {
            await new Promise((resolve, reject) => {
                middleware(req, res, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        // Парсим URL
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();

        // Ищем маршрут
        const routeHandler = this.findRoute(method, pathname, req);

        if (routeHandler) {
            await routeHandler(req, res);
        } else {
            res.statusCode = 404;
            res.json({ error: 'Маршрут не найден' });
        }
    }

    // Поиск маршрута
    findRoute(method, pathname, req) {
        const routes = this.routes[method];
        
        // Прямое совпадение
        if (routes[pathname]) {
            return routes[pathname];
        }

        // Поиск с параметрами (:id)
        for (const routePath in routes) {
            if (routePath.includes(':')) {
                const routeRegex = this.convertToRegex(routePath);
                const match = pathname.match(routeRegex);
                
                if (match) {
                    req.params = this.extractParams(routePath, match);
                    return routes[routePath];
                }
            }
        }

        return null;
    }

    // Конвертация пути в regex
    convertToRegex(path) {
        return new RegExp('^' + path.replace(/:\w+/g, '([^/]+)') + '$');
    }

    // Извлечение параметров
    extractParams(routePath, match) {
        const params = {};
        const paramNames = [];
        const pathParts = routePath.split('/');
        
        pathParts.forEach((part, index) => {
            if (part.startsWith(':')) {
                paramNames.push(part.slice(1));
            }
        });

        paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
        });

        return params;
    }

    // Инициализация Request
    initRequest(req) {
        const parsedUrl = url.parse(req.url, true);
        
        req.query = parsedUrl.query || {};
        req.params = {};
        req.body = {};
        req.path = parsedUrl.pathname;

        // Метод для получения тела запроса
        req.getBody = () => {
            return new Promise((resolve, reject) => {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    try {
                        req.body = body ? JSON.parse(body) : {};
                        resolve(req.body);
                    } catch (error) {
                        reject(new Error('Неверный JSON формат'));
                    }
                });
                req.on('error', reject);
            });
        };
    }

    // Инициализация Response
    initResponse(res) {
        res.send = (data) => {
            res.setHeader('Content-Type', 'text/plain');
            res.end(data.toString());
        };

        res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data, null, 2));
        };

        res.status = (code) => {
            res.statusCode = code;
            return res;
        };

        res.setHeader('Content-Type', 'application/json');
    }

    // Регистрация middleware
    use(middleware) {
        if (typeof middleware === 'function') {
            this.middlewares.push(middleware);
        }
    }

    // Регистрация обработчика ошибок
    useErrorHandler(handler) {
        this.errorHandler = handler;
    }

    // Обработка ошибок
    handleError(error, req, res) {
        if (this.errorHandler) {
            this.errorHandler(error, req, res);
        } else {
            res.statusCode = 500;
            res.json({ 
                error: 'Внутренняя ошибка сервера',
                message: error.message 
            });
        }
    }

    // Методы для регистрации маршрутов
    get(path, handler) {
        this.routes.GET[path] = handler;
    }

    post(path, handler) {
        this.routes.POST[path] = handler;
    }

    put(path, handler) {
        this.routes.PUT[path] = handler;
    }

    patch(path, handler) {
        this.routes.PATCH[path] = handler;
    }

    delete(path, handler) {
        this.routes.DELETE[path] = handler;
    }
}

module.exports = GymFramework;