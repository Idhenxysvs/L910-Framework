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

    listen(port, callback) {
        const server = http.createServer(async (req, res) => {
            try {
                await this.handleRequest(req, res);
            } catch (error) {
                this.handleError(error, req, res);
            }
        });

        server.listen(port, callback);
        console.log(`|${'='.repeat(65)}|`);
        console.log(`|🏋️ Сервер тренажерного зала запущен на порту ${port}                 |`);
        return server;
    }

    async handleRequest(req, res) {
        this.initRequest(req);
        this.initResponse(res);

        for (const middleware of this.middlewares) {
            await new Promise((resolve, reject) => {
                middleware(req, res, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();
        const routeHandler = this.findRoute(method, pathname, req);

        if (routeHandler) {
            await routeHandler(req, res);
        } else {
            res.statusCode = 404;
            res.json({ error: 'Маршрут не найден' });
        }
    }

    findRoute(method, pathname, req) {
        const routes = this.routes[method];
        
        if (routes[pathname]) {
            return routes[pathname];
        }

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

    convertToRegex(path) {
        return new RegExp('^' + path.replace(/:\w+/g, '([^/]+)') + '$');
    }

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

    initRequest(req) {
        const parsedUrl = url.parse(req.url, true);
        
        req.query = parsedUrl.query || {};
        req.params = {};
        req.body = {};
        req.path = parsedUrl.pathname;

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

    use(middleware) {
        if (typeof middleware === 'function') {
            this.middlewares.push(middleware);
        }
    }

    useErrorHandler(handler) {
        this.errorHandler = handler;
    }

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