const GymFramework = require('./framework');

const app = new GymFramework();

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    next();
});

app.get('/', (req, res) => {
    res.json({
        message: 'Добро пожаловать в L910 Framework v1.0!',
        version: '1.0.0',
        endpoints: [
            { method: 'GET', path: '/test' },
            { method: 'GET', path: '/users/:id' },
            { method: 'POST', path: '/data' }
        ]
    });
});

app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Фреймворк работает!',
        timestamp: new Date().toISOString()
    });
});

app.get('/users/:id', (req, res) => {
    res.json({
        userId: req.params.id,
        query: req.query
    });
});

app.post('/data', async (req, res) => {
    const body = await req.getBody();
    res.status(201).json({
        success: true,
        received: body
    });
});

app.get('/error', (req, res) => {
    throw new Error('Тестовая ошибка');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('L910 FRAMEWORK v1.0');
    console.log(`Сервер: http://localhost:${PORT}`);
    console.log('='.repeat(50));
});