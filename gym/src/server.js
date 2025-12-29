const GymFramework = require('./framework');
const bodyParser = require('./middleware/bodyParser');
const errorHandler = require('./middleware/errorHandler');
const MembersController = require('./controllers/membersController');
const TrainersController = require('./controllers/trainersController');
const AppointmentsController = require('./controllers/appointmentsController');
const ReviewsController = require('./controllers/reviewsController');
const path = require('path');
const fs = require('fs').promises;
const app = new GymFramework();
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
app.get('/api/members', MembersController.getAll);
app.get('/api/members/:id', MembersController.getById);
app.post('/api/members', MembersController.create);
app.put('/api/members/:id', MembersController.update);
app.patch('/api/members/:id', MembersController.patch);
app.delete('/api/members/:id', MembersController.delete);
app.get('/api/members/active', MembersController.getActive);
app.get('/api/members/type/:type', MembersController.getByMembershipType);
app.get('/api/trainers', TrainersController.getAll);
app.get('/api/trainers/:id', TrainersController.getById);
app.post('/api/trainers', TrainersController.create);
app.put('/api/trainers/:id', TrainersController.update);
app.patch('/api/trainers/:id', TrainersController.patch);
app.delete('/api/trainers/:id', TrainersController.delete);
app.get('/api/trainers/available', TrainersController.getAvailable);
app.get('/api/trainers/specialization/:spec', TrainersController.getBySpecialization);
app.get('/api/trainers/top-rated', TrainersController.getTopRated);
app.get('/api/appointments', AppointmentsController.getAll);
app.get('/api/appointments/:id', AppointmentsController.getById);
app.post('/api/appointments', AppointmentsController.create);
app.put('/api/appointments/:id', AppointmentsController.update);
app.patch('/api/appointments/:id', AppointmentsController.patch);
app.delete('/api/appointments/:id', AppointmentsController.delete);
app.get('/api/appointments/member/:memberId', AppointmentsController.getByMember);
app.get('/api/appointments/trainer/:trainerId', AppointmentsController.getByTrainer);
app.get('/api/appointments/date/:date', AppointmentsController.getByDate);
app.get('/api/appointments/upcoming', AppointmentsController.getUpcoming);
app.get('/api/reviews', ReviewsController.getAll);
app.get('/api/reviews/:id', ReviewsController.getById);
app.post('/api/reviews', ReviewsController.create);
app.put('/api/reviews/:id', ReviewsController.update);
app.delete('/api/reviews/:id', ReviewsController.delete);
app.get('/api/reviews/trainer/:trainerId', ReviewsController.getByTrainer);
app.get('/api/reviews/member/:memberId', ReviewsController.getByMember);
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
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg'
            };
            
            res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
            res.end(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({ error: 'Файл не найден' });
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
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
    console.log(`👤 Клиенты API: http://localhost:${PORT}/api/members`);
    console.log(`🏋️ Тренеры API: http://localhost:${PORT}/api/trainers`);
    console.log(`📅 Записи API: http://localhost:${PORT}/api/appointments`);
    console.log(`⭐ Отзывы API: http://localhost:${PORT}/api/reviews`);
    console.log(`🌐 Фронтенд: http://localhost:${PORT}`);
    console.log('='.repeat(50));
});