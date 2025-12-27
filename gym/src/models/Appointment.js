const fs = require('fs').promises;
const path = require('path');

class Appointment {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.memberId = data.memberId || '';
        this.trainerId = data.trainerId || '';
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.time = data.time || '12:00';
        this.duration = data.duration || 60;
        this.status = data.status || 'scheduled';
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    generateId() {
        return 'A' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    static get filePath() {
        return path.join(__dirname, '../../data/appointments.json');
    }

    static async findAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data).map(item => new Appointment(item));
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
                return [];
            }
            throw error;
        }
    }

    static async findById(id) {
        const appointments = await this.findAll();
        return appointments.find(appointment => appointment.id === id);
    }

    static async create(appointmentData) {
        const appointments = await this.findAll();
        const newAppointment = new Appointment(appointmentData);
        appointments.push(newAppointment);
        await this.saveAll(appointments);
        return newAppointment;
    }

    static async update(id, appointmentData) {
        const appointments = await this.findAll();
        const index = appointments.findIndex(a => a.id === id);
        
        if (index === -1) return null;
        
        appointments[index] = new Appointment({ ...appointments[index], ...appointmentData, id });
        await this.saveAll(appointments);
        return appointments[index];
    }

    static async patch(id, updates) {
        const appointments = await this.findAll();
        const index = appointments.findIndex(a => a.id === id);
        
        if (index === -1) return null;
        
        const updatedAppointment = { ...appointments[index], ...updates, id };
        appointments[index] = new Appointment(updatedAppointment);
        await this.saveAll(appointments);
        return appointments[index];
    }

    static async delete(id) {
        const appointments = await this.findAll();
        const filteredAppointments = appointments.filter(appointment => appointment.id !== id);
        
        if (filteredAppointments.length === appointments.length) return false;
        
        await this.saveAll(filteredAppointments);
        return true;
    }

    static async saveAll(appointments) {
        await fs.writeFile(this.filePath, JSON.stringify(appointments, null, 2));
    }

    static async findByMember(memberId) {
        const appointments = await this.findAll();
        return appointments.filter(appointment => appointment.memberId === memberId);
    }

    static async findByTrainer(trainerId) {
        const appointments = await this.findAll();
        return appointments.filter(appointment => appointment.trainerId === trainerId);
    }

    static async findByDate(date) {
        const appointments = await this.findAll();
        return appointments.filter(appointment => appointment.date === date);
    }

    static async getUpcoming() {
        const appointments = await this.findAll();
        const today = new Date().toISOString().split('T')[0];
        
        return appointments
            .filter(appointment => 
                appointment.date >= today && 
                appointment.status === 'scheduled'
            )
            .sort((a, b) => {
                if (a.date !== b.date) {
                    return a.date.localeCompare(b.date);
                }
                return a.time.localeCompare(b.time);
            });
    }

    static async isTimeAvailable(trainerId, date, time, duration, excludeId = null) {
        const appointments = await this.findByTrainer(trainerId);
        const targetDate = new Date(`${date} ${time}`);
        const targetEndTime = new Date(targetDate.getTime() + duration * 60000);
        
        return !appointments.some(appointment => {
            if (excludeId && appointment.id === excludeId) return false;
            if (appointment.date !== date || appointment.status !== 'scheduled') return false;
            const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
            const appointmentEndTime = new Date(appointmentDate.getTime() + appointment.duration * 60000);
            return (
                (targetDate >= appointmentDate && targetDate < appointmentEndTime) ||
                (targetEndTime > appointmentDate && targetEndTime <= appointmentEndTime) ||
                (targetDate <= appointmentDate && targetEndTime >= appointmentEndTime)
            );
        });
    }
}

module.exports = Appointment;