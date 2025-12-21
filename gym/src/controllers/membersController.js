const Member = require('../models/Member');

class MembersController {
    // GET /api/members - все клиенты
    static async getAll(req, res) {
        try {
            const members = await Member.findAll();
            res.json(members);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/members/:id - клиент по ID
    static async getById(req, res) {
        try {
            const member = await Member.findById(req.params.id);
            if (!member) {
                return res.status(404).json({ error: 'Клиент не найден' });
            }
            res.json(member);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // POST /api/members - создать клиента
    static async create(req, res) {
        try {
            // Валидация
            if (!req.body.fullName || !req.body.email) {
                return res.status(400).json({ 
                    error: 'Имя и email обязательны' 
                });
            }

            // Валидация белорусского номера телефона
            if (req.body.phone && !Member.validateBelarusianPhone(req.body.phone)) {
                return res.status(400).json({ 
                    error: 'Неверный формат белорусского номера телефона. Используйте формат: +375 (XX) XXX-XX-XX' 
                });
            }

            const member = await Member.create(req.body);
            res.status(201).json(member);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/members/:id - обновить клиента
    static async update(req, res) {
        try {
            // Валидация белорусского номера телефона
            if (req.body.phone && !Member.validateBelarusianPhone(req.body.phone)) {
                return res.status(400).json({ 
                    error: 'Неверный формат белорусского номера телефона. Используйте формат: +375 (XX) XXX-XX-XX' 
                });
            }

            const member = await Member.update(req.params.id, req.body);
            if (!member) {
                return res.status(404).json({ error: 'Клиент не найден' });
            }
            res.json(member);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // PATCH /api/members/:id - частично обновить клиента
    static async patch(req, res) {
        try {
            // Валидация белорусского номера телефона
            if (req.body.phone && !Member.validateBelarusianPhone(req.body.phone)) {
                return res.status(400).json({ 
                    error: 'Неверный формат белорусского номера телефона. Используйте формат: +375 (XX) XXX-XX-XX' 
                });
            }

            const member = await Member.patch(req.params.id, req.body);
            if (!member) {
                return res.status(404).json({ error: 'Клиент не найден' });
            }
            res.json(member);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // DELETE /api/members/:id - удалить клиента
    static async delete(req, res) {
        try {
            const success = await Member.delete(req.params.id);
            if (!success) {
                return res.status(404).json({ error: 'Клиент не найден' });
            }
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/members/active - активные клиенты
    static async getActive(req, res) {
        try {
            const members = await Member.findActive();
            res.json(members);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/members/type/:type - клиенты по типу абонемента
    static async getByMembershipType(req, res) {
        try {
            const members = await Member.findByMembershipType(req.params.type);
            res.json(members);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = MembersController;