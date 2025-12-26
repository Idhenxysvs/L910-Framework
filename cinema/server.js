const http = require('http');
const url = require('url');
const { EventEmitter } = require('events');

class Request {
    constructor(req) {
        this.req = req;
        this.url = req.url;
        this.method = req.method;
        this.headers = req.headers;
        this._body = null;
        this._query = null;
        this._params = {};
    }

    get query() {
        if (!this._query) {
            const parsedUrl = url.parse(this.url, true);
            this._query = parsedUrl.query;
        }
        return this._query;
    }

    get params() {
        return this._params;
    }

    set params(value) {
        this._params = value;
    }

    async body() {
        if (this._body) return this._body;
        
        return new Promise((resolve, reject) => {
            let data = '';
            this.req.on('data', chunk => {
                data += chunk;
            });
            this.req.on('end', () => {
                try {
                    this._body = data ? JSON.parse(data) : {};
                    resolve(this._body);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }
}

class Response {
    constructor(res) {
        this.res = res;
        this.statusCode = 200;
        this.headers = {};
    }

    status(code) {
        this.statusCode = code;
        return this;
    }

    json(data) {
        this.res.writeHead(this.statusCode, {
            'Content-Type': 'application/json',
            ...this.headers
        });
        this.res.end(JSON.stringify(data));
    }

    send(data) {
        if (typeof data === 'object') {
            return this.json(data);
        }
        
        this.res.writeHead(this.statusCode, {
            'Content-Type': 'text/plain',
            ...this.headers
        });
        this.res.end(data);
    }
}

class Router {
    constructor() {
        this.routes = {
            GET: [],
            POST: [],
            PUT: [],
            PATCH: [],
            DELETE: []
        };
        this.middlewares = [];
    }

    matchRoute(method, url) {
        const routes = this.routes[method];
        
        for (const route of routes) {
            const pattern = route.path
                .replace(/:\w+/g, '([^/]+)')
                .replace(/\//g, '\\/');
            
            const regex = new RegExp(`^${pattern}$`);
            const match = url.match(regex);
            
            if (match) {
                const params = {};
                const paramNames = route.path.match(/:\w+/g) || [];
                
                paramNames.forEach((name, index) => {
                    params[name.slice(1)] = match[index + 1];
                });
                
                return { handler: route.handler, params };
            }
        }
        
        return null;
    }

    get(path, handler) {
        this.routes.GET.push({ path, handler });
    }

    post(path, handler) {
        this.routes.POST.push({ path, handler });
    }

    put(path, handler) {
        this.routes.PUT.push({ path, handler });
    }

    patch(path, handler) {
        this.routes.PATCH.push({ path, handler });
    }

    delete(path, handler) {
        this.routes.DELETE.push({ path, handler });
    }

    use(middleware) {
        this.middlewares.push(middleware);
    }

    async handleRequest(req, res) {
        const request = new Request(req);
        const response = new Response(res);
        
        try {
            for (const middleware of this.middlewares) {
                await middleware(request, response);
            }
            
            const matched = this.matchRoute(request.method, request.url);
            
            if (matched) {
                request.params = matched.params;
                await matched.handler(request, response);
            } else {
                response.status(404).send('Not Found');
            }
        } catch (error) {
            console.error('Error:', error);
            response.status(500).send('Internal Server Error');
        }
    }
}

class App extends EventEmitter {
    constructor() {
        super();
        this.router = new Router();
        this.server = null;
    }

    use(middleware) {
        this.router.use(middleware);
    }

    get(path, handler) {
        this.router.get(path, handler);
    }

    post(path, handler) {
        this.router.post(path, handler);
    }

    put(path, handler) {
        this.router.put(path, handler);
    }

    patch(path, handler) {
        this.router.patch(path, handler);
    }

    delete(path, handler) {
        this.router.delete(path, handler);
    }

    listen(port, callback) {
        this.server = http.createServer((req, res) => {
            this.router.handleRequest(req, res);
        });
        
        this.server.listen(port, () => {
            console.log(`Server running on port ${port}`);
            if (callback) callback();
        });
    }
}

const app = new App();

app.use(async (req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'Фреймворк работает!', 
        version: '1.0.0',
        availableMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    });
});

app.get('/api/test', (req, res) => {
    res.json({ test: 'ok', query: req.query });
});

app.post('/api/test', async (req, res) => {
    const body = await req.body();
    res.status(201).json({ 
        message: 'POST запрос получен',
        body: body 
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Фреймворк запущен на http://localhost:${PORT}`);
    console.log('Доступные методы:');
    console.log('  GET  /         - информация о фреймворке');
    console.log('  GET  /api/test - тестовый GET с query-параметрами');
    console.log('  POST /api/test - тестовый POST с body');
});