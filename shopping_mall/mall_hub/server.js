const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;
const packageJson = require('./package.json');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`|=================================================================|`);
    console.log(`|💼 Хаб ТЦ 'Крышталь' — ${packageJson.version}:                                    |`);               
    console.log(`|📶 Адрес сайта – http://localhost:${PORT}                           |`);
    console.log('|📦 API: документация в README проекта                            |');
    console.log(`|=================================================================|`);
});
module.exports = app;