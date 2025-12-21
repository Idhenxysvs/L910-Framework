const fs = require('fs').promises;
const path = require('path');

class Trainer {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.fullName = data.fullName || '';
        this.specialization = data.specialization || ''; // фитнес, йога, бодибилдинг и т.д.
        this.experienceYears = data.experienceYears || 0;
        this.certifications = data.certifications || []; // массив сертификатов
        this.workSchedule = data.workSchedule || {}; // объект с расписанием
        this.hourlyRate = data.hourlyRate || 0;
        this.isAvailable = data.isAvailable !== undefined ? data.isAvailable : true;
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.clientsCount = data.clientsCount || 0;
        this.rating = data.rating || 0; // от 0 до 5
        this.bio = data.bio || '';
        this.photoUrl = data.photoUrl || '';
    }

    generateId() {
        return 'T' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    static get filePath() {
        return path.join(__dirname, '../../data/trainers.json');
    }

    // Валидация белорусского номера телефона
    static validateBelarusianPhone(phone) {
        // Форматы: +375 (XX) XXX-XX-XX или +375XXXXXXXXX
        const phoneRegex = /^\+375\s?\(?\d{2}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/;
        return phoneRegex.test(phone);
    }

    // Получить всех тренеров
    static async findAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data).map(item => new Trainer(item));
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
                return [];
            }
            throw error;
        }
    }

    // Найти тренера по ID
    static async findById(id) {
        const trainers = await this.findAll();
        return trainers.find(trainer => trainer.id === id);
    }

    // Создать тренера
    static async create(trainerData) {
        const trainers = await this.findAll();
        const newTrainer = new Trainer(trainerData);
        trainers.push(newTrainer);
        await this.saveAll(trainers);
        return newTrainer;
    }

    // Обновить тренера
    static async update(id, trainerData) {
        const trainers = await this.findAll();
        const index = trainers.findIndex(t => t.id === id);
        
        if (index === -1) return null;
        
        trainers[index] = new Trainer({ ...trainers[index], ...trainerData, id });
        await this.saveAll(trainers);
        return trainers[index];
    }

    // Частичное обновление
    static async patch(id, updates) {
        const trainers = await this.findAll();
        const index = trainers.findIndex(t => t.id === id);
        
        if (index === -1) return null;
        
        const updatedTrainer = { ...trainers[index], ...updates, id };
        trainers[index] = new Trainer(updatedTrainer);
        await this.saveAll(trainers);
        return trainers[index];
    }

    // Удалить тренера
    static async delete(id) {
        const trainers = await this.findAll();
        const filteredTrainers = trainers.filter(trainer => trainer.id !== id);
        
        if (filteredTrainers.length === trainers.length) return false;
        
        await this.saveAll(filteredTrainers);
        return true;
    }

    // Сохранить всех тренеров
    static async saveAll(trainers) {
        await fs.writeFile(this.filePath, JSON.stringify(trainers, null, 2));
    }

    // Получить доступных тренеров
    static async findAvailable() {
        const trainers = await this.findAll();
        return trainers.filter(trainer => trainer.isAvailable);
    }

    // Получить тренеров по специализации
    static async findBySpecialization(specialization) {
        const trainers = await this.findAll();
        return trainers.filter(trainer => trainer.specialization === specialization);
    }
}

module.exports = Trainer;