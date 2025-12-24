const Appointment = require('../models/Appointment');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');

class AppointmentsController {
    // GET /api/appointments - все записи
    static async getAll(req, res) {
        try {
            const appointments = await Appointment.findAll();
            
            // Добавляем информацию о клиентах и тренерах
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

    // GET /api/appointments/:id - запись по ID
    static async getById(req, res) {
        try {
            const appointment = await Appointment.findById(req.params.id);
            if (!appointment) {
                return res.status(404).json({ error: 'Запись не найдена' });
            }
            
            // Добавляем информацию о клиенте и тренере
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

    // POST /api/appointments - создать запись
    static async create(req, res) {
        try {
            const { memberId, trainerId, date, time, duration = 60 } = req.body;
            
            // Валидация
            if (!memberId || !trainerId || !date || !time) {
                return res.status(400).json({ 
                    error: 'ID клиента, ID тренера, дата и время обязательны' 
                });
            }
            
            // Проверяем существование клиента и тренера
            const member = await Member.findById(memberId);
            const trainer = await Trainer.findById(trainerId);
            
            if (!member) {
                return res.status(404).json({ error: 'Клиент не найден' });
            }
            
            if (!trainer) {
                return res.status(404).json({ error: 'Тренер не найден' });
            }
            
            // Проверяем доступность времени
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

    // PUT /api/appointments/:id - обновить запись
    static async update(req, res) {
        try {
            const { memberId, trainerId, date, time, duration = 60 } = req.body;
            
            // Проверяем существование записи
            const existingAppointment = await Appointment.findById(req.params.id);
            if (!existingAppointment) {
                return res.status(404).json({ error: 'Запись не найдена' });
            }
            
            // Если изменяются важные поля, проводим проверки
            if (memberId || trainerId || date || time || duration) {
                const newMemberId = memberId || existingAppointment.memberId;
                const newTrainerId = trainerId || existingAppointment.trainerId;
                const newDate = date || existingAppointment.date;
                const newTime = time || existingAppointment.time;
                const newDuration = duration || existingAppointment.duration;
                
                // Проверяем существование клиента и тренера
                const member = await Member.findById(newMemberId);
                const trainer = await Trainer.findById(newTrainerId);
                
                if (!member) {
                    return res.status(404).json({ error: 'Клиент не найден' });
                }
                
                if (!trainer) {
                    return res.status(404).json({ error: 'Тренер не найден' });
                }
                
                // Проверяем доступность времени (если изменяется время, дата, тренер или длительность)
                if (trainerId || date || time || duration) {
                    const isAvailable = await Appointment.isTimeAvailable(
                        newTrainerId, 
                        newDate, 
                        newTime, 
                        newDuration,
                        req.params.id // Исключаем текущую запись из проверки
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

    // PATCH /api/appointments/:id - частично обновить запись
    static async patch(req, res) {
        try {
            const { status } = req.body;
            
            // Проверяем существование записи
            const existingAppointment = await Appointment.findById(req.params.id);
            if (!existingAppointment) {
                return res.status(404).json({ error: 'Запись не найдена' });
            }
            
            // Обновляем только статус
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

    // DELETE /api/appointments/:id - удалить запись
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

    // GET /api/appointments/member/:memberId - записи клиента
    static async getByMember(req, res) {
        try {
            const appointments = await Appointment.findByMember(req.params.memberId);
            
            // Добавляем информацию о тренерах
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

    // GET /api/appointments/trainer/:trainerId - записи тренера
    static async getByTrainer(req, res) {
        try {
            const appointments = await Appointment.findByTrainer(req.params.trainerId);
            
            // Добавляем информацию о клиентах
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

    // GET /api/appointments/date/:date - записи на определенную дату
    static async getByDate(req, res) {
        try {
            const appointments = await Appointment.findByDate(req.params.date);
            
            // Добавляем информацию о клиентах и тренерах
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

    // GET /api/appointments/upcoming - предстоящие записи
    static async getUpcoming(req, res) {
        try {
            const appointments = await Appointment.getUpcoming();
            
            // Добавляем информацию о клиентах и тренерах
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