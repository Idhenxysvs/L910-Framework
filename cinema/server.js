const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

// ========== Класс Request ==========
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
            try {
                const parsedUrl = url.parse(this.url, true);
                this._query = parsedUrl.query;
            } catch (error) {
                console.error('Ошибка парсинга query:', error);
                this._query = {};
            }
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
        if (this._body !== null) return this._body;
        
        return new Promise((resolve, reject) => {
            // Если это не POST/PUT/PATCH запрос, сразу возвращаем пустой объект
            if (!['POST', 'PUT', 'PATCH'].includes(this.method)) {
                this._body = {};
                resolve(this._body);
                return;
            }
            
            let data = '';
            this.req.on('data', chunk => {
                data += chunk;
            });
            
            this.req.on('end', () => {
                try {
                    if (data) {
                        this._body = JSON.parse(data);
                    } else {
                        this._body = {};
                    }
                    resolve(this._body);
                } catch (err) {
                    console.error('Ошибка парсинга JSON:', err);
                    reject(new Error('Invalid JSON format'));
                }
            });
            
            this.req.on('error', (err) => {
                console.error('Ошибка чтения body:', err);
                reject(err);
            });
        });
    }
}

// ========== Класс Response ==========
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
            .catch((err) => {
                console.error('Ошибка чтения файла:', err);
                this.status(404).send('File not found');
            });
    }
}

// ========== Класс Router ==========
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
        // Очищаем URL от query-параметров для матчинга
        const cleanUrl = url.split('?')[0];
        const routes = this.routes[method];
        
        for (const route of routes) {
            const pattern = route.path
                .replace(/:\w+/g, '([^/]+)')
                .replace(/\//g, '\\/');
            
            const regex = new RegExp(`^${pattern}$`);
            const match = cleanUrl.match(regex);
            
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
            if (req.url === '/' || req.url.startsWith('/public/') || 
                req.url.endsWith('.css') || req.url.endsWith('.js') || 
                req.url.endsWith('.html')) {
                
                let filePath = req.url === '/' ? '/public/index.html' : req.url;
                if (filePath.startsWith('/')) {
                    filePath = filePath.substring(1);
                }
                
                const fullPath = path.join(__dirname, filePath);
                
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
            console.error('Error in handleRequest:', error);
            if (!response.res.headersSent) {
                response.status(500).send('Internal Server Error');
            }
        }
    }
}

// ========== Класс App ==========
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

// ========== Создание приложения ==========
const app = new App();

// Middleware для логирования
app.use(async (req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
});

// ========== Функции для работы с JSON файлами ==========
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

// ========== Вспомогательные функции для валидации ==========
const validateId = (id) => {
    return !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;
};

const validateFilmData = (data) => {
    const errors = [];
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
        errors.push('Title is required and must be a non-empty string');
    }
    if (data.year && (isNaN(data.year) || data.year < 1900 || data.year > new Date().getFullYear() + 5)) {
        errors.push('Year must be a valid number between 1900 and current year + 5');
    }
    if (data.duration && (isNaN(data.duration) || data.duration <= 0)) {
        errors.push('Duration must be a positive number');
    }
    return errors;
};

const validateSessionData = (data) => {
    const errors = [];
    if (!validateId(data.filmId)) {
        errors.push('filmId must be a positive integer');
    }
    if (data.hallNumber && (isNaN(data.hallNumber) || data.hallNumber < 1 || data.hallNumber > 10)) {
        errors.push('hallNumber must be a number between 1 and 10');
    }
    if (data.price && (isNaN(data.price) || data.price < 0)) {
        errors.push('price must be a non-negative number');
    }
    if (data.dateTime && isNaN(Date.parse(data.dateTime))) {
        errors.push('dateTime must be a valid date string');
    }
    return errors;
};

// ========== Маршруты для фильмов ==========

// GET /api/films - получить все фильмы
app.get('/api/films', async (req, res) => {
    try {
        const films = await readJSON('films.json');
        res.json(films);
    } catch (error) {
        console.error('Ошибка при чтении фильмов:', error);
        res.status(500).json({ error: 'Ошибка сервера при чтении фильмов' });
    }
});

// GET /api/films/:id - получить фильм по ID
app.get('/api/films/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!validateId(id)) {
            return res.status(400).json({ error: 'Invalid film ID' });
        }
        
        const films = await readJSON('films.json');
        const film = films.find(f => f.id == id);
        
        if (film) {
            res.json(film);
        } else {
            res.status(404).json({ error: 'Film not found' });
        }
    } catch (error) {
        console.error('Ошибка при чтении фильма:', error);
        res.status(500).json({ error: 'Ошибка сервера при чтении фильма' });
    }
});

// POST /api/films - создать новый фильм
app.post('/api/films', async (req, res) => {
    try {
        const body = await req.body();
        const validationErrors = validateFilmData(body);
        
        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }
        
        const films = await readJSON('films.json');
        
        const newFilm = {
            id: Date.now(),
            title: body.title,
            director: body.director || 'Unknown',
            year: body.year || new Date().getFullYear(),
            duration: body.duration || 120,
            isReleased: body.isReleased !== undefined ? body.isReleased : true,
            genres: body.genres || ['Drama'],
            releaseDate: body.releaseDate || new Date().toISOString().split('T')[0]
        };
        
        films.push(newFilm);
        await writeJSON('films.json', films);
        
        res.status(201).json(newFilm);
    } catch (error) {
        console.error('Ошибка при создании фильма:', error);
        if (error.message === 'Invalid JSON format') {
            res.status(400).json({ error: 'Invalid JSON in request body' });
        } else {
            res.status(500).json({ error: 'Ошибка сервера при создании фильма' });
        }
    }
});

// PUT /api/films/:id - полностью обновить фильм
app.put('/api/films/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!validateId(id)) {
            return res.status(400).json({ error: 'Invalid film ID' });
        }
        
        const body = await req.body();
        const validationErrors = validateFilmData(body);
        
        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }
        
        let films = await readJSON('films.json');
        const index = films.findIndex(f => f.id == id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Film not found' });
        }
        
        films[index] = { 
            ...films[index], 
            ...body, 
            id: films[index].id // Сохраняем оригинальный ID
        };
        
        await writeJSON('films.json', films);
        res.json(films[index]);
    } catch (error) {
        console.error('Ошибка при обновлении фильма:', error);
        if (error.message === 'Invalid JSON format') {
            res.status(400).json({ error: 'Invalid JSON in request body' });
        } else {
            res.status(500).json({ error: 'Ошибка сервера при обновлении фильма' });
        }
    }
});

// PATCH /api/films/:id - частично обновить фильм (неидемпотентный)
app.patch('/api/films/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!validateId(id)) {
            return res.status(400).json({ error: 'Invalid film ID' });
        }
        
        const body = await req.body();
        let films = await readJSON('films.json');
        const index = films.findIndex(f => f.id == id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Film not found' });
        }
        
        // Проверяем, что body содержит хотя бы одно поле для обновления
        if (Object.keys(body).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        // Частичное обновление + добавление случайного поля (неидемпотентность)
        const randomField = `patch_${Date.now()}`;
        films[index] = { 
            ...films[index], 
            ...body,
            [randomField]: Math.random(),
            lastPatched: new Date().toISOString()
        };
        
        await writeJSON('films.json', films);
        res.json(films[index]);
    } catch (error) {
        console.error('Ошибка при частичном обновлении фильма:', error);
        if (error.message === 'Invalid JSON format') {
            res.status(400).json({ error: 'Invalid JSON in request body' });
        } else {
            res.status(500).json({ error: 'Ошибка сервера при обновлении фильма' });
        }
    }
});

// DELETE /api/films/:id - удалить фильм
app.delete('/api/films/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!validateId(id)) {
            return res.status(400).json({ error: 'Invalid film ID' });
        }
        
        let films = await readJSON('films.json');
        const initialLength = films.length;
        
        films = films.filter(f => f.id != id);
        
        if (films.length === initialLength) {
            return res.status(404).json({ error: 'Film not found' });
        }
        
        await writeJSON('films.json', films);
        res.status(204).send(); // 204 No Content вместо 200
    } catch (error) {
        console.error('Ошибка при удалении фильма:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении фильма' });
    }
});

// ========== Маршруты для сеансов ==========

// GET /api/sessions - получить все сеансы
app.get('/api/sessions', async (req, res) => {
    try {
        const sessions = await readJSON('sessions.json');
        // Добавляем поддержку query-параметров
        const { hall, filmId, date } = req.query;
        
        let filteredSessions = sessions;
        
        if (hall && validateId(hall)) {
            filteredSessions = filteredSessions.filter(s => s.hallNumber == hall);
        }
        
        if (filmId && validateId(filmId)) {
            filteredSessions = filteredSessions.filter(s => s.filmId == filmId);
        }
        
        if (date) {
            const targetDate = new Date(date).toDateString();
            filteredSessions = filteredSessions.filter(s => {
                const sessionDate = new Date(s.dateTime).toDateString();
                return sessionDate === targetDate;
            });
        }
        
        res.json(filteredSessions);
    } catch (error) {
        console.error('Ошибка при чтении сеансов:', error);
        res.status(500).json({ error: 'Ошибка сервера при чтении сеансов' });
    }
});

// GET /api/sessions/:id - получить сеанс по ID
app.get('/api/sessions/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!validateId(id)) {
            return res.status(400).json({ error: 'Invalid session ID' });
        }
        
        const sessions = await readJSON('sessions.json');
        const session = sessions.find(s => s.id == id);
        
        if (session) {
            res.json(session);
        } else {
            res.status(404).json({ error: 'Session not found' });
        }
    } catch (error) {
        console.error('Ошибка при чтении сеанса:', error);
        res.status(500).json({ error: 'Ошибка сервера при чтении сеанса' });
    }
});

// POST /api/sessions - создать новый сеанс
app.post('/api/sessions', async (req, res) => {
    try {
        const body = await req.body();
        const validationErrors = validateSessionData(body);
        
        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }
        
        const sessions = await readJSON('sessions.json');
        
        const newSession = {
            id: Date.now(),
            filmId: body.filmId || 1,
            hallNumber: body.hallNumber || 1,
            dateTime: body.dateTime || new Date().toISOString(),
            price: body.price || 300,
            is3D: body.is3D !== undefined ? body.is3D : false,
            availableSeats: body.availableSeats || Array.from({length: 50}, (_, i) => i + 1),
            bookedSeats: body.bookedSeats || []
        };
        
        sessions.push(newSession);
        await writeJSON('sessions.json', sessions);
        
        res.status(201).json(newSession);
    } catch (error) {
        console.error('Ошибка при создании сеанса:', error);
        if (error.message === 'Invalid JSON format') {
            res.status(400).json({ error: 'Invalid JSON in request body' });
        } else {
            res.status(500).json({ error: 'Ошибка сервера при создании сеанса' });
        }
    }
});

// PUT /api/sessions/:id - полностью обновить сеанс
app.put('/api/sessions/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!validateId(id)) {
            return res.status(400).json({ error: 'Invalid session ID' });
        }
        
        const body = await req.body();
        const validationErrors = validateSessionData(body);
        
        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }
        
        let sessions = await readJSON('sessions.json');
        const index = sessions.findIndex(s => s.id == id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        sessions[index] = { 
            ...sessions[index], 
            ...body, 
            id: sessions[index].id // Сохраняем оригинальный ID
        };
        
        await writeJSON('sessions.json', sessions);
        res.json(sessions[index]);
    } catch (error) {
        console.error('Ошибка при обновлении сеанса:', error);
        if (error.message === 'Invalid JSON format') {
            res.status(400).json({ error: 'Invalid JSON in request body' });
        } else {
            res.status(500).json({ error: 'Ошибка сервера при обновлении сеанса' });
        }
    }
});

// PATCH /api/sessions/:id - частично обновить сеанс (неидемпотентный)
app.patch('/api/sessions/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!validateId(id)) {
            return res.status(400).json({ error: 'Invalid session ID' });
        }
        
        const body = await req.body();
        let sessions = await readJSON('sessions.json');
        const index = sessions.findIndex(s => s.id == id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Проверяем, что body содержит хотя бы одно поле для обновления
        if (Object.keys(body).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        const randomField = `patch_${Date.now()}`;
        sessions[index] = { 
            ...sessions[index], 
            ...body,
            [randomField]: Math.random(),
            lastPatched: new Date().toISOString()
        };
        
        await writeJSON('sessions.json', sessions);
        res.json(sessions[index]);
    } catch (error) {
        console.error('Ошибка при частичном обновлении сеанса:', error);
        if (error.message === 'Invalid JSON format') {
            res.status(400).json({ error: 'Invalid JSON in request body' });
        } else {
            res.status(500).json({ error: 'Ошибка сервера при обновлении сеанса' });
        }
    }
});

// DELETE /api/sessions/:id - удалить сеанс
app.delete('/api/sessions/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!validateId(id)) {
            return res.status(400).json({ error: 'Invalid session ID' });
        }
        
        let sessions = await readJSON('sessions.json');
        const initialLength = sessions.length;
        
        sessions = sessions.filter(s => s.id != id);
        
        if (sessions.length === initialLength) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await writeJSON('sessions.json', sessions);
        res.status(204).send(); // 204 No Content вместо 200
    } catch (error) {
        console.error('Ошибка при удалении сеанса:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении сеанса' });
    }
});

// ========== Запуск сервера ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🎬 Cinema API v4.0 is running on http://localhost:${PORT}`);
    console.log(`📺 Frontend available at http://localhost:${PORT}`);
    console.log('\nИсправления в версии 4.0:');
    console.log('  • Исправлен парсинг query-параметров');
    console.log('  • Улучшена асинхронная обработка req.body()');
    console.log('  • Добавлена валидация ID во всех роутах');
    console.log('  • Исправлены HTTP-статусы (201 для POST, 204 для DELETE)');
    console.log('  • Улучшена обработка ошибок JSON');
    console.log('\nДоступные маршруты API:');
    console.log('  GET    /api/films?[hall=1&filmId=1&date=2024-12-15]');
    console.log('  GET    /api/films/:id');
    console.log('  POST   /api/films      (201 Created)');
    console.log('  PUT    /api/films/:id');
    console.log('  PATCH  /api/films/:id  (неидемпотентный)');
    console.log('  DELETE /api/films/:id  (204 No Content)');
    console.log('\nАналогичные маршруты для /api/sessions');
});