const http = require('http');
const url = require('url');

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
    }

    listen(port, callback) {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(port, callback);
        console.log(`🚀 Сервер запущен на порту ${port}`);
        return server;
    }

    async handleRequest(req, res) {
        this.initRequest(req);
        this.initResponse(res);

        try {
            await this.runMiddlewares(req, res);

            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            const method = req.method.toUpperCase();

            const routeHandler = this.findRoute(method, pathname, req);

            if (routeHandler) {
                await routeHandler(req, res);
            } else {
                res.status(404).json({ 
                    error: 'Маршрут не найден',
                    path: pathname
                });
            }
        } catch (error) {
            this.handleError(error, req, res);
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
        const regexPath = path.replace(/:\w+/g, '([^/]+)');
        return new RegExp('^' + regexPath + '$');
    }

    extractParams(routePath, match) {
        const params = {};
        const paramNames = [];
        
        const pathParts = routePath.split('/');
        pathParts.forEach(part => {
            if (part.startsWith(':')) {
                paramNames.push(part.slice(1));
            }
        });

        paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
        });

        return params;
    }

    async runMiddlewares(req, res) {
        for (const middleware of this.middlewares) {
            await new Promise((resolve, reject) => {
                middleware(req, res, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    }

    initRequest(req) {
        const parsedUrl = url.parse(req.url, true);
        
        req.query = parsedUrl.query || {};
        req.params = {};
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
                        req.body = {};
                        resolve({});
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
            return res;
        };

        res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data, null, 2));
            return res;
        };

        res.status = (code) => {
            res.statusCode = code;
            return res;
        };

        res.setHeader('Content-Type', 'application/json');
    }

    handleError(error, req, res) {
        console.error('Ошибка:', error);
        
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Ошибка сервера',
                message: error.message
            });
        }
    }

    use(middleware) {
        if (typeof middleware === 'function') {
            this.middlewares.push(middleware);
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

    delete(path, handler) {
        this.routes.DELETE[path] = handler;
    }

    patch(path, handler) {
        this.routes.PATCH[path] = handler;
    }
}

module.exports = GymFramework;