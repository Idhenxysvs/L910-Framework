const fs = require('fs').promises;
const path = require('path');
const Review = require('./Review');

class Trainer {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.fullName = data.fullName || '';
        this.specialization = data.specialization || '';
        this.experienceYears = data.experienceYears || 0;
        this.certifications = data.certifications || []; 
        this.workSchedule = data.workSchedule || {}; 
        this.hourlyRate = data.hourlyRate || 0;
        this.isAvailable = data.isAvailable !== undefined ? data.isAvailable : true;
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.clientsCount = data.clientsCount || 0;
        this.rating = data.rating || 0; 
        this.bio = data.bio || '';
        this.photoUrl = data.photoUrl || '';
    }

    generateId() {
        return 'T' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    static get filePath() {
        return path.join(__dirname, '../../data/trainers.json');
    }

    static validateBelarusianPhone(phone) {
        const phoneRegex = /^\+375\s?\(?\d{2}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/;
        return phoneRegex.test(phone);
    }

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

    static async findById(id) {
        const trainers = await this.findAll();
        return trainers.find(trainer => trainer.id === id);
    }

    static async create(trainerData) {
        const trainers = await this.findAll();
        const newTrainer = new Trainer(trainerData);
        trainers.push(newTrainer);
        await this.saveAll(trainers);
        return newTrainer;
    }

    static async update(id, trainerData) {
        const trainers = await this.findAll();
        const index = trainers.findIndex(t => t.id === id);
        
        if (index === -1) return null;
        
        trainers[index] = new Trainer({ ...trainers[index], ...trainerData, id });
        await this.saveAll(trainers);
        return trainers[index];
    }

    static async patch(id, updates) {
        const trainers = await this.findAll();
        const index = trainers.findIndex(t => t.id === id);
        
        if (index === -1) return null;
        
        const updatedTrainer = { ...trainers[index], ...updates, id };
        trainers[index] = new Trainer(updatedTrainer);
        await this.saveAll(trainers);
        return trainers[index];
    }

    static async delete(id) {
        const trainers = await this.findAll();
        const filteredTrainers = trainers.filter(trainer => trainer.id !== id);
        
        if (filteredTrainers.length === trainers.length) return false;
        
        await this.saveAll(filteredTrainers);
        return true;
    }

    static async saveAll(trainers) {
        await fs.writeFile(this.filePath, JSON.stringify(trainers, null, 2));
    }

    static async findAvailable() {
        const trainers = await this.findAll();
        return trainers.filter(trainer => trainer.isAvailable);
    }

    static async findBySpecialization(specialization) {
        const trainers = await this.findAll();
        return trainers.filter(trainer => trainer.specialization === specialization);
    }

    static async getTopRated(limit = 5) {
        const trainers = await this.findAll();
        return trainers
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
    }

    static async updateRating(trainerId) {
        const reviews = await Review.findByTrainer(trainerId);
        const trainer = await this.findById(trainerId);
        
        if (!trainer) return null;
        
        if (reviews.length === 0) {
            trainer.rating = 0;
        } else {
            const sumRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            trainer.rating = Math.round((sumRating / reviews.length) * 10) / 10;
        }
        
        await this.update(trainerId, { rating: trainer.rating });
        return trainer;
    }
}

module.exports = Trainer;