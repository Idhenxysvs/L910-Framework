const http = require('http');
const url = require('url');
const fs = require('fs').promises;
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

const readJSON = async (filename) => {
    try {
        const data = await fs.readFile(`./data/${filename}`, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.log(`Файл ${filename} не найден, создаем пустой массив`);
        return [];
    }
};

const writeJSON = async (filename, data) => {
    await fs.writeFile(`./data/${filename}`, JSON.stringify(data, null, 2));
};

const app = new App();

app.use(async (req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
});


app.get('/api/films', async (req, res) => {
    try {
        const films = await readJSON('films.json');
        res.json(films);
    } catch (error) {
        console.error('Ошибка при чтении фильмов:', error);
        res.status(500).json({ error: 'Ошибка сервера при чтении фильмов' });
    }
});

app.get('/api/films/:id', async (req, res) => {
    try {
        const films = await readJSON('films.json');
        const film = films.find(f => f.id == req.params.id);
        
        if (film) {
            res.json(film);
        } else {
            res.status(404).json({ error: 'Фильм не найден' });
        }
    } catch (error) {
        console.error('Ошибка при чтении фильма:', error);
        res.status(500).json({ error: 'Ошибка сервера при чтении фильма' });
    }
});

app.post('/api/films', async (req, res) => {
    try {
        const body = await req.body();
        const films = await readJSON('films.json');
        
        if (!body.title) {
            return res.status(400).json({ error: 'Название фильма обязательно' });
        }
        
        const newFilm = {
            id: Date.now(),
            title: body.title,
            director: body.director || 'Неизвестный режиссер',
            year: body.year || new Date().getFullYear(),
            duration: body.duration || 120,
            isReleased: body.isReleased !== undefined ? body.isReleased : true,
            genres: body.genres || ['Драма'],
            releaseDate: body.releaseDate || new Date().toISOString().split('T')[0]
        };
        
        films.push(newFilm);
        await writeJSON('films.json', films);
        
        res.status(201).json(newFilm);
    } catch (error) {
        console.error('Ошибка при создании фильма:', error);
        res.status(500).json({ error: 'Ошибка сервера при создании фильма' });
    }
});

app.put('/api/films/:id', async (req, res) => {
    try {
        const body = await req.body();
        let films = await readJSON('films.json');
        const index = films.findIndex(f => f.id == req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Фильм не найден' });
        }
        
        films[index] = { 
            ...body, 
            id: films[index].id
        };
        
        await writeJSON('films.json', films);
        res.json(films[index]);
    } catch (error) {
        console.error('Ошибка при обновлении фильма:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении фильма' });
    }
});

app.patch('/api/films/:id', async (req, res) => {
    try {
        const body = await req.body();
        let films = await readJSON('films.json');
        const index = films.findIndex(f => f.id == req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Фильм не найден' });
        }
        
        const randomField = `patch_${Date.now()}`;
        films[index] = { 
            ...films[index], 
            ...body,
            [randomField]: Math.random()
        };
        
        await writeJSON('films.json', films);
        res.json(films[index]);
    } catch (error) {
        console.error('Ошибка при частичном обновлении фильма:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении фильма' });
    }
});

app.delete('/api/films/:id', async (req, res) => {
    try {
        let films = await readJSON('films.json');
        const initialLength = films.length;
        
        films = films.filter(f => f.id != req.params.id);
        
        if (films.length === initialLength) {
            return res.status(404).json({ error: 'Фильм не найден' });
        }
        
        await writeJSON('films.json', films);
        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении фильма:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении фильма' });
    }
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'API кинотеатра', 
        version: '2.0',
        availableEndpoints: {
            films: {
                'GET /api/films': 'Получить все фильмы',
                'GET /api/films/:id': 'Получить фильм по ID',
                'POST /api/films': 'Создать новый фильм',
                'PUT /api/films/:id': 'Полностью обновить фильм',
                'PATCH /api/films/:id': 'Частично обновить фильм',
                'DELETE /api/films/:id': 'Удалить фильм'
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🎬 API кинотеатра запущен на порту ${PORT}`);
    console.log(`📁 Данные хранятся в папке /data/`);
    console.log('\nДоступные маршруты:');
    console.log('  GET  /              - информация о API');
    console.log('  GET  /api/films     - получить все фильмы');
    console.log('  GET  /api/films/:id - получить фильм по ID');
    console.log('  POST /api/films     - создать новый фильм');
    console.log('  PUT  /api/films/:id - полностью обновить фильм');
    console.log('  PATCH /api/films/:id - частично обновить фильм');
    console.log('  DELETE /api/films/:id - удалить фильм');
});