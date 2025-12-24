const Trainer = require('../models/Trainer');

class TrainersController {
    // GET /api/trainers - все тренеры
    static async getAll(req, res) {
        try {
            const trainers = await Trainer.findAll();
            res.json(trainers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/trainers/:id - тренер по ID
    static async getById(req, res) {
        try {
            const trainer = await Trainer.findById(req.params.id);
            if (!trainer) {
                return res.status(404).json({ error: 'Тренер не найден' });
            }
            res.json(trainer);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // POST /api/trainers - создать тренера
    static async create(req, res) {
        try {
            if (!req.body.fullName || !req.body.specialization) {
                return res.status(400).json({ 
                    error: 'Имя и специализация обязательны' 
                });
            }

            // Валидация белорусского номера телефона
            if (req.body.phone && !Trainer.validateBelarusianPhone(req.body.phone)) {
                return res.status(400).json({ 
                    error: 'Неверный формат белорусского номера телефона. Используйте формат: +375 (XX) XXX-XX-XX' 
                });
            }

            const trainer = await Trainer.create(req.body);
            res.status(201).json(trainer);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/trainers/:id - обновить тренера
    static async update(req, res) {
        try {
            // Валидация белорусского номера телефона
            if (req.body.phone && !Trainer.validateBelarusianPhone(req.body.phone)) {
                return res.status(400).json({ 
                    error: 'Неверный формат белорусского номера телефона. Используйте формат: +375 (XX) XXX-XX-XX' 
                });
            }

            const trainer = await Trainer.update(req.params.id, req.body);
            if (!trainer) {
                return res.status(404).json({ error: 'Тренер не найден' });
            }
            res.json(trainer);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // PATCH /api/trainers/:id - частично обновить тренера
    static async patch(req, res) {
        try {
            // Валидация белорусского номера телефона
            if (req.body.phone && !Trainer.validateBelarusianPhone(req.body.phone)) {
                return res.status(400).json({ 
                    error: 'Неверный формат белорусского номера телефона. Используйте формат: +375 (XX) XXX-XX-XX' 
                });
            }

            const trainer = await Trainer.patch(req.params.id, req.body);
            if (!trainer) {
                return res.status(404).json({ error: 'Тренер не найден' });
            }
            res.json(trainer);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // DELETE /api/trainers/:id - удалить тренера
    static async delete(req, res) {
        try {
            const success = await Trainer.delete(req.params.id);
            if (!success) {
                return res.status(404).json({ error: 'Тренер не найден' });
            }
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/trainers/available - доступные тренеры
    static async getAvailable(req, res) {
        try {
            const trainers = await Trainer.findAvailable();
            res.json(trainers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/trainers/specialization/:spec - тренеры по специализации
    static async getBySpecialization(req, res) {
        try {
            const trainers = await Trainer.findBySpecialization(req.params.spec);
            res.json(trainers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/trainers/top-rated - тренеры с высоким рейтингом
    static async getTopRated(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const trainers = await Trainer.getTopRated(limit);
            res.json(trainers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = TrainersController;