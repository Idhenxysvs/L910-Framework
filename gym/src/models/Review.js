const fs = require('fs').promises;
const path = require('path');

class Review {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.trainerId = data.trainerId || '';
        this.memberId = data.memberId || '';
        this.rating = data.rating || 5; // от 1 до 5
        this.comment = data.comment || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    generateId() {
        return 'R' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    static get filePath() {
        return path.join(__dirname, '../../data/reviews.json');
    }

    // Получить все отзывы
    static async findAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data).map(item => new Review(item));
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
                return [];
            }
            throw error;
        }
    }

    // Найти отзыв по ID
    static async findById(id) {
        const reviews = await this.findAll();
        return reviews.find(review => review.id === id);
    }

    // Создать отзыв
    static async create(reviewData) {
        const reviews = await this.findAll();
        const newReview = new Review(reviewData);
        reviews.push(newReview);
        await this.saveAll(reviews);
        return newReview;
    }

    // Обновить отзыв
    static async update(id, reviewData) {
        const reviews = await this.findAll();
        const index = reviews.findIndex(r => r.id === id);
        
        if (index === -1) return null;
        
        reviews[index] = new Review({ ...reviews[index], ...reviewData, id });
        await this.saveAll(reviews);
        return reviews[index];
    }

    // Удалить отзыв
    static async delete(id) {
        const reviews = await this.findAll();
        const filteredReviews = reviews.filter(review => review.id !== id);
        
        if (filteredReviews.length === reviews.length) return false;
        
        await this.saveAll(filteredReviews);
        return true;
    }

    // Сохранить все отзывы
    static async saveAll(reviews) {
        await fs.writeFile(this.filePath, JSON.stringify(reviews, null, 2));
    }

    // Получить отзывы по тренеру
    static async findByTrainer(trainerId) {
        const reviews = await this.findAll();
        return reviews.filter(review => review.trainerId === trainerId);
    }

    // Получить отзывы по клиенту
    static async findByMember(memberId) {
        const reviews = await this.findAll();
        return reviews.filter(review => review.memberId === memberId);
    }
}

module.exports = Review;