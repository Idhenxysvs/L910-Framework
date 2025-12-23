const L910Framework = require('./framework');
const ClientsController = require('./controllers/clientsController');
const path = require('path');
const fs = require('fs').promises;

const app = new L910Framework();

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

app.use(async (req, res, next) => {
    if (req.method === 'GET' && req.path === '/') {
        res.json({
            message: 'Банковская система API',
            note: 'API.',
            endpoints: {
                clients: '/api/clients'
            }
        });
    } else {
        next();
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('БАНКОВСКАЯ СИСТЕМА');
    console.log('='.repeat(50));
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log(`Клиенты API: http://localhost:${PORT}/api/clients`);
    console.log('='.repeat(50));
});