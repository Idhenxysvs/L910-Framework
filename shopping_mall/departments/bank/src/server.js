const L910Framework = require('./framework');
const bodyParser = require('./middleware/bodyParser');
const errorHandler = require('./middleware/errorHandler');
const ClientsController = require('./controllers/clientsController');
const AccountsController = require('./controllers/accountsController');
const path = require('path');
const fs = require('fs').promises;

const app = new L910Framework();

app.use(bodyParser);

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

app.get('/api/clients', ClientsController.getAll);
app.get('/api/clients/:id', ClientsController.getById);
app.post('/api/clients', ClientsController.create);
app.put('/api/clients/:id', ClientsController.update);
app.patch('/api/clients/:id', ClientsController.patch);
app.delete('/api/clients/:id', ClientsController.delete);
app.get('/api/clients/active', ClientsController.getActive);
app.get('/api/clients/type/:type', ClientsController.getByType);
app.get('/api/clients/:id/edit-form', ClientsController.getEditForm);

app.get('/api/accounts', AccountsController.getAll);
app.get('/api/accounts/:id', AccountsController.getById);
app.post('/api/accounts', AccountsController.create);
app.put('/api/accounts/:id', AccountsController.update);
app.patch('/api/accounts/:id', AccountsController.patch);
app.delete('/api/accounts/:id', AccountsController.delete);
app.post('/api/accounts/:id/deposit', AccountsController.deposit);
app.post('/api/accounts/:id/withdraw', AccountsController.withdraw);
app.get('/api/accounts/client/:clientId', AccountsController.getByClient);

app.use(async (req, res, next) => {
    if (req.method === 'GET' && req.path.startsWith('/public/')) {
        try {
            const filePath = path.join(__dirname, '..', req.path);
            const data = await fs.readFile(filePath);
            const ext = path.extname(filePath);
            const mimeTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json'
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
            res.end(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({ error: 'File not found' });
            } else {
                next(error);
            }
        }
    } else if (req.method === 'GET' && (req.path === '/' || req.path === '/index.html')) {
        try {
            const filePath = path.join(__dirname, '../public/index.html');
            const data = await fs.readFile(filePath);
            res.setHeader('Content-Type', 'text/html');
            res.end(data);
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

app.useErrorHandler(errorHandler);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
    console.log(`|${'='.repeat(65)}|`);
    console.log(`|Сервер запущен: http://localhost:${PORT}                            |`);
    console.log(`|Клиенты API: http://localhost:${PORT}/api/clients                   |`);
    console.log(`|Счета API: http://localhost:${PORT}/api/accounts                    |`);
    console.log(`|${'='.repeat(65)}|`);
});