const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');
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

    sendFile(filePath) {
        const ext = path.extname(filePath);
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json'
        };

        fs.readFile(filePath, 'utf8')
            .then(content => {
                this.res.writeHead(this.statusCode, {
                    'Content-Type': mimeTypes[ext] || 'text/plain',
                    ...this.headers
                });
                this.res.end(content);
            })
            .catch(() => {
                this.status(404).send('File not found');
            });
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
            // Middleware для статических файлов
            if (!req.url.startsWith('/api/')) {
                let filePath = req.url === '/' ? 'index.html' : req.url;
                if (filePath.startsWith('/')) {
                    filePath = filePath.substring(1);
                }
                
                const fullPath = path.join(__dirname, 'public', filePath);
                
                try {
                    await fs.access(fullPath);
                    const ext = path.extname(fullPath);
                    const mimeTypes = {
                        '.html': 'text/html',
                        '.css': 'text/css',
                        '.js': 'application/javascript',
                        '.json': 'application/json'
                    };
                    
                    const contentType = mimeTypes[ext] || 'text/plain';
                    const content = await fs.readFile(fullPath, 'utf8');
                    
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content);
                    return;
                } catch (err) {
                    // Файл не найден, продолжаем
                }
            }
            
            // Выполняем остальные middleware
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

// Создаем экземпляр приложения
const app = new App();

// Middleware для логирования
app.use(async (req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
});

// Функции для работы с данными
const readJSON = async (filename) => {
    try {
        const data = await fs.readFile(`./data/${filename}`, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const writeJSON = async (filename, data) => {
    await fs.writeFile(`./data/${filename}`, JSON.stringify(data, null, 2));
};

// Маршруты для фильмов
app.get('/api/films', async (req, res) => {
    const films = await readJSON('films.json');
    res.json(films);
});

app.get('/api/films/:id', async (req, res) => {
    const films = await readJSON('films.json');
    const film = films.find(f => f.id == req.params.id);
    
    if (film) {
        res.json(film);
    } else {
        res.status(404).json({ error: 'Film not found' });
    }
});

app.post('/api/films', async (req, res) => {
    const body = await req.body();
    const films = await readJSON('films.json');
    
    const newFilm = {
        id: Date.now(),
        title: body.title || `Film ${Date.now()}`,
        director: body.director || `Director ${Math.floor(Math.random() * 100)}`,
        year: body.year || 2024,
        duration: body.duration || 120,
        isReleased: body.isReleased !== undefined ? body.isReleased : true,
        genres: body.genres || ['Action'],
        releaseDate: body.releaseDate || new Date().toISOString().split('T')[0]
    };
    
    films.push(newFilm);
    await writeJSON('films.json', films);
    res.status(201).json(newFilm);
});

app.put('/api/films/:id', async (req, res) => {
    const body = await req.body();
    let films = await readJSON('films.json');
    const index = films.findIndex(f => f.id == req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Film not found' });
    }
    
    films[index] = { ...films[index], ...body, id: films[index].id };
    await writeJSON('films.json', films);
    res.json(films[index]);
});

app.patch('/api/films/:id', async (req, res) => {
    const body = await req.body();
    let films = await readJSON('films.json');
    const index = films.findIndex(f => f.id == req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Film not found' });
    }
    
    const randomField = `patch_${Date.now()}`;
    films[index] = { 
        ...films[index], 
        ...body,
        [randomField]: Math.random()
    };
    
    await writeJSON('films.json', films);
    res.json(films[index]);
});

app.delete('/api/films/:id', async (req, res) => {
    let films = await readJSON('films.json');
    const filtered = films.filter(f => f.id != req.params.id);
    
    if (films.length === filtered.length) {
        return res.status(404).json({ error: 'Film not found' });
    }
    
    await writeJSON('films.json', filtered);
    res.json({ message: 'Film deleted successfully' });
});

// Маршруты для сеансов
app.get('/api/sessions', async (req, res) => {
    const sessions = await readJSON('sessions.json');
    res.json(sessions);
});

app.get('/api/sessions/:id', async (req, res) => {
    const sessions = await readJSON('sessions.json');
    const session = sessions.find(s => s.id == req.params.id);
    
    if (session) {
        res.json(session);
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

app.post('/api/sessions', async (req, res) => {
    const body = await req.body();
    const sessions = await readJSON('sessions.json');
    
    const newSession = {
        id: Date.now(),
        filmId: body.filmId || 1,
        hallNumber: body.hallNumber || 1,
        dateTime: body.dateTime || new Date().toISOString(),
        price: body.price || 300,
        is3D: body.is3D !== undefined ? body.is3D : false,
        availableSeats: body.availableSeats || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        bookedSeats: body.bookedSeats || []
    };
    
    sessions.push(newSession);
    await writeJSON('sessions.json', sessions);
    res.status(201).json(newSession);
});

app.put('/api/sessions/:id', async (req, res) => {
    const body = await req.body();
    let sessions = await readJSON('sessions.json');
    const index = sessions.findIndex(s => s.id == req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    sessions[index] = { ...sessions[index], ...body, id: sessions[index].id };
    await writeJSON('sessions.json', sessions);
    res.json(sessions[index]);
});

app.patch('/api/sessions/:id', async (req, res) => {
    const body = await req.body();
    let sessions = await readJSON('sessions.json');
    const index = sessions.findIndex(s => s.id == req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const randomField = `patch_${Date.now()}`;
    sessions[index] = { 
        ...sessions[index], 
        ...body,
        [randomField]: Math.random()
    };
    
    await writeJSON('sessions.json', sessions);
    res.json(sessions[index]);
});

app.delete('/api/sessions/:id', async (req, res) => {
    let sessions = await readJSON('sessions.json');
    const filtered = sessions.filter(s => s.id != req.params.id);
    
    if (sessions.length === filtered.length) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    await writeJSON('sessions.json', filtered);
    res.json({ message: 'Session deleted successfully' });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Cinema API server is running on http://localhost:${PORT}`);
    console.log(`Frontend available at http://localhost:${PORT}`);
});