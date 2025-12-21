const L910Framework = require('./framework');

const app = new L910Framework();

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
});

app.get('/', (req, res) => {
    res.json({
        message: 'Банковский фреймворк v1.0',
        version: '1.0.0',
        endpoints: [
            { method: 'GET', path: '/test', description: 'Тестовый маршрут' },
            { method: 'GET', path: '/demo/clients', description: 'Демо клиенты' },
            { method: 'GET', path: '/demo/accounts', description: 'Демо счета' },
            { method: 'POST', path: '/demo/data', description: 'Демо POST запрос' }
        ],
    });
});

app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Банковский фреймворк работает!',
        timestamp: new Date().toISOString()
    });
});

app.get('/demo/clients', (req, res) => {
    res.json([
        { id: 'C1', fullName: 'Иванов Иван Иванович', type: 'individual' },
        { id: 'C2', fullName: 'Петрова Анна Сергеевна', type: 'vip' }
    ]);
});

app.get('/demo/accounts', (req, res) => {
    res.json([
        { id: 'A1', accountNumber: '40702810123456789012', balance: 100000 },
        { id: 'A2', accountNumber: '40817810234567890123', balance: 50000 }
    ]);
});

app.post('/demo/data', async (req, res) => {
    try {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const parsedBody = body ? JSON.parse(body) : {};
                res.status(201).json({
                    success: true,
                    received: parsedBody,
                    message: 'Данные получены в банковской системе'
                });
            } catch {
                res.status(400).json({ error: 'Invalid JSON' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/demo/clients/:id', (req, res) => {
    res.json({
        clientId: req.params.id,
        query: req.query,
        message: `Демо клиент ${req.params.id}`,
        data: {
            id: req.params.id,
            fullName: 'Тестовый Клиент',
            clientType: 'individual'
        }
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('БАНКОВСКИЙ ФРЕЙМВОРК v1.0');
    console.log('='.repeat(50));
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log(`Документация: http://localhost:${PORT}/`);
    console.log(`Тест API: http://localhost:${PORT}/test`);
    console.log('='.repeat(50));
});