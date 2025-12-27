const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`
    КОНФИГУРАЦИЯ MALL_HUB
    =================================
    
    🚀 Порт: ${PORT}
    📍 URL: http://localhost:${PORT}
    📡 API: http://localhost:${PORT}/api
    
    📋 API команды:
    GET  /api/projects          - Список проектов
    POST /api/projects/start    - Запуск проекта
    POST /api/projects/stop     - Остановка проекта
    POST /api/projects/restart  - Перезапуск проекта
    GET  /api/status            - Статус всех проектов
    GET  /api/health            - Проверка здоровья
    
    =================================
    `);
});
module.exports = app;