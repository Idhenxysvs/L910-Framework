const Appointment = require('../models/Appointment');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');

class AppointmentsController {
    static async getAll(req, res) {
        try {
            const appointments = await Appointment.findAll();
            const enrichedAppointments = await Promise.all(
                appointments.map(async (appointment) => {
                    const member = await Member.findById(appointment.memberId);
                    const trainer = await Trainer.findById(appointment.trainerId);
                    
                    return {
                        ...appointment,
                        member: member ? {
                            id: member.id,
                            fullName: member.fullName
                        } : null,
                        trainer: trainer ? {
                            id: trainer.id,
                            fullName: trainer.fullName,
                            specialization: trainer.specialization
                        } : null
                    };
                })
            );
            
            res.json(enrichedAppointments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const appointment = await Appointment.findById(req.params.id);
            if (!appointment) {
                return res.status(404).json({ error: 'Запись не найдена' });
            }
            const member = await Member.findById(appointment.memberId);
            const trainer = await Trainer.findById(appointment.trainerId);
            const enrichedAppointment = {
                ...appointment,
                member: member ? {
                    id: member.id,
                    fullName: member.fullName
                } : null,
                trainer: trainer ? {
                    id: trainer.id,
                    fullName: trainer.fullName,
                    specialization: trainer.specialization
                } : null
            };
            
            res.json(enrichedAppointment);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const { memberId, trainerId, date, time, duration = 60 } = req.body;
            if (!memberId || !trainerId || !date || !time) {
                return res.status(400).json({ 
                    error: 'ID клиента, ID тренера, дата и время обязательны' 
                });
            }
            const member = await Member.findById(memberId);
            const trainer = await Trainer.findById(trainerId);
            
            if (!member) {
                return res.status(404).json({ error: 'Клиент не найден' });
            }
            
            if (!trainer) {
                return res.status(404).json({ error: 'Тренер не найден' });
            }
            const isAvailable = await Appointment.isTimeAvailable(
                trainerId, 
                date, 
                time, 
                duration
            );
            
            if (!isAvailable) {
                return res.status(409).json({ 
                    error: 'Это время уже занято' 
                });
            }
            
            const appointment = await Appointment.create(req.body);
            res.status(201).json(appointment);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { memberId, trainerId, date, time, duration = 60 } = req.body;
            const existingAppointment = await Appointment.findById(req.params.id);
            if (!existingAppointment) {
                return res.status(404).json({ error: 'Запись не найдена' });
            }
            if (memberId || trainerId || date || time || duration) {
                const newMemberId = memberId || existingAppointment.memberId;
                const newTrainerId = trainerId || existingAppointment.trainerId;
                const newDate = date || existingAppointment.date;
                const newTime = time || existingAppointment.time;
                const newDuration = duration || existingAppointment.duration;
                const member = await Member.findById(newMemberId);
                const trainer = await Trainer.findById(newTrainerId);
                if (!member) {
                    return res.status(404).json({ error: 'Клиент не найден' });
                }
                
                if (!trainer) {
                    return res.status(404).json({ error: 'Тренер не найден' });
                }
                if (trainerId || date || time || duration) {
                    const isAvailable = await Appointment.isTimeAvailable(
                        newTrainerId, 
                        newDate, 
                        newTime, 
                        newDuration,
                        req.params.id
                    );
                    
                    if (!isAvailable) {
                        return res.status(409).json({ 
                            error: 'Это время уже занято' 
                        });
                    }
                }
            }
            
            const appointment = await Appointment.update(req.params.id, req.body);
            res.json(appointment);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async patch(req, res) {
        try {
            const { status } = req.body;
            const existingAppointment = await Appointment.findById(req.params.id);
            if (!existingAppointment) {
                return res.status(404).json({ error: 'Запись не найдена' });
            }
            if (status) {
                const appointment = await Appointment.patch(req.params.id, { status });
                res.json(appointment);
            } else {
                res.status(400).json({ error: 'Поле status обязательно' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const success = await Appointment.delete(req.params.id);
            if (!success) {
                return res.status(404).json({ error: 'Запись не найдена' });
            }
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getByMember(req, res) {
        try {
            const appointments = await Appointment.findByMember(req.params.memberId);
            const enrichedAppointments = await Promise.all(
                appointments.map(async (appointment) => {
                    const trainer = await Trainer.findById(appointment.trainerId);
                    
                    return {
                        ...appointment,
                        trainer: trainer ? {
                            id: trainer.id,
                            fullName: trainer.fullName,
                            specialization: trainer.specialization
                        } : null
                    };
                })
            );
            
            res.json(enrichedAppointments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getByTrainer(req, res) {
        try {
            const appointments = await Appointment.findByTrainer(req.params.trainerId);
            const enrichedAppointments = await Promise.all(
                appointments.map(async (appointment) => {
                    const member = await Member.findById(appointment.memberId);
                    
                    return {
                        ...appointment,
                        member: member ? {
                            id: member.id,
                            fullName: member.fullName
                        } : null
                    };
                })
            );
            
            res.json(enrichedAppointments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getByDate(req, res) {
        try {
            const appointments = await Appointment.findByDate(req.params.date);
            const enrichedAppointments = await Promise.all(
                appointments.map(async (appointment) => {
                    const member = await Member.findById(appointment.memberId);
                    const trainer = await Trainer.findById(appointment.trainerId);
                    
                    return {
                        ...appointment,
                        member: member ? {
                            id: member.id,
                            fullName: member.fullName
                        } : null,
                        trainer: trainer ? {
                            id: trainer.id,
                            fullName: trainer.fullName,
                            specialization: trainer.specialization
                        } : null
                    };
                })
            );
            
            res.json(enrichedAppointments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getUpcoming(req, res) {
        try {
            const appointments = await Appointment.getUpcoming();
            const enrichedAppointments = await Promise.all(
                appointments.map(async (appointment) => {
                    const member = await Member.findById(appointment.memberId);
                    const trainer = await Trainer.findById(appointment.trainerId);
                    
                    return {
                        ...appointment,
                        member: member ? {
                            id: member.id,
                            fullName: member.fullName
                        } : null,
                        trainer: trainer ? {
                            id: trainer.id,
                            fullName: trainer.fullName,
                            specialization: trainer.specialization
                        } : null
                    };
                })
            );
            
            res.json(enrichedAppointments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AppointmentsController;