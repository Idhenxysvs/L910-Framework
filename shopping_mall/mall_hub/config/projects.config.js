const path = require('path');
module.exports = {
    projects: [
        {
            id: 'cinema',
            name: 'Кинотеатр ""',
            port: 3001,
            path: path.join(__dirname, '../../departments/cinema'),
            startCommand: 'node server.js',
            description: '',
            color: '#3498db',
            icon: '🎬'
        },
        {
            id: 'gym',
            name: 'Тренажёрный зал "Силач"',
            port: 3002,
            path: path.join(__dirname, '../../departmens/gym'),
            startCommand: 'node server.js',
            description: '',
            color: '#e74c3c',
            icon: '💪'
        },
        {
            id: 'concerts',
            name: 'Концертный зал "ConcertFlow"',
            port: 3003,
            path: path.join(__dirname, '../../departments/concerts'),
            startCommand: 'node server.js',
            description: '',
            color: '#2ecc71',
            icon: '🎵'
        },
        {
            id: 'bank',
            name: 'Банк ""',
            port: 3004,
            path: path.join(__dirname, '../../departments/bank'),
            startCommand: 'node server.js',
            description: '',
            color: '#9b59b6',
            icon: '🏦'
        }
    ],
    
    processManager: {
        checkInterval: 5000,
        timeout: 30000,
        maxRetries: 3
    }
};