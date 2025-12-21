const fs = require('fs').promises;
const path = require('path');

class Member {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.fullName = data.fullName || '';
        this.age = data.age || 0;
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.membershipType = data.membershipType || 'Standard'; // Standard, Premium, VIP
        this.startDate = data.startDate || new Date().toISOString();
        this.endDate = data.endDate || this.calculateEndDate();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.trainerId = data.trainerId || null;
        this.workoutSchedule = data.workoutSchedule || []; // Array of days
        this.payments = data.payments || []; // Array of payment objects
        this.height = data.height || 0; // in cm
        this.weight = data.weight || 0; // in kg
        this.goals = data.goals || []; // Array of goal strings
    }

    generateId() {
        return 'M' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    calculateEndDate() {
        const date = new Date();
        date.setMonth(date.getMonth() + 1); // +1 месяц
        return date.toISOString();
    }

    static get filePath() {
        return path.join(__dirname, '../../data/members.json');
    }

    // Валидация белорусского номера телефона
    static validateBelarusianPhone(phone) {
        // Форматы: +375 (XX) XXX-XX-XX или +375XXXXXXXXX
        const phoneRegex = /^\+375\s?\(?\d{2}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/;
        return phoneRegex.test(phone);
    }

    // Получить всех клиентов
    static async findAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data).map(item => new Member(item));
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
                return [];
            }
            throw error;
        }
    }

    // Найти клиента по ID
    static async findById(id) {
        const members = await this.findAll();
        return members.find(member => member.id === id);
    }

    // Создать клиента
    static async create(memberData) {
        const members = await this.findAll();
        const newMember = new Member(memberData);
        members.push(newMember);
        await this.saveAll(members);
        return newMember;
    }

    // Обновить клиента
    static async update(id, memberData) {
        const members = await this.findAll();
        const index = members.findIndex(m => m.id === id);
        
        if (index === -1) return null;
        
        members[index] = new Member({ ...members[index], ...memberData, id });
        await this.saveAll(members);
        return members[index];
    }

    // Частичное обновление
    static async patch(id, updates) {
        const members = await this.findAll();
        const index = members.findIndex(m => m.id === id);
        
        if (index === -1) return null;
        
        const updatedMember = { ...members[index], ...updates, id };
        members[index] = new Member(updatedMember);
        await this.saveAll(members);
        return members[index];
    }

    // Удалить клиента
    static async delete(id) {
        const members = await this.findAll();
        const filteredMembers = members.filter(member => member.id !== id);
        
        if (filteredMembers.length === members.length) return false;
        
        await this.saveAll(filteredMembers);
        return true;
    }

    // Сохранить всех клиентов
    static async saveAll(members) {
        await fs.writeFile(this.filePath, JSON.stringify(members, null, 2));
    }

    // Получить активных клиентов
    static async findActive() {
        const members = await this.findAll();
        return members.filter(member => member.isActive);
    }

    // Получить клиентов по типу абонемента
    static async findByMembershipType(type) {
        const members = await this.findAll();
        return members.filter(member => member.membershipType === type);
    }
}

module.exports = Member;