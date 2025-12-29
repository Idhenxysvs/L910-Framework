const Client = require('../models/Client');

class ClientsController {
    static async getAll(req, res) {
        try {
            const clients = await Client.findAll();
            res.json(clients);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const client = await Client.findById(req.params.id);
            if (!client) return res.status(404).json({ error: 'Client not found' });
            res.json(client);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            if (!req.body.fullName) return res.status(400).json({ error: 'Full name required' });
            const client = await Client.create(req.body);
            res.status(201).json(client);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const client = await Client.update(req.params.id, req.body);
            if (!client) return res.status(404).json({ error: 'Client not found' });
            res.json(client);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async patch(req, res) {
        try {
            const client = await Client.patch(req.params.id, req.body);
            if (!client) return res.status(404).json({ error: 'Client not found' });
            res.json(client);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const success = await Client.delete(req.params.id);
            if (!success) return res.status(404).json({ error: 'Client not found' });
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getActive(req, res) {
        try {
            const clients = await Client.findActive();
            res.json(clients);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getByType(req, res) {
        try {
            const clients = await Client.findByType(req.params.type);
            res.json(clients);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getEditForm(req, res) {
        try {
            const client = await Client.findById(req.params.id);
            if (!client) return res.status(404).json({ error: 'Client not found' });
            
            res.json({
                success: true,
                client: client,
                formHtml: `
                    <div class="edit-form-container">
                        <div class="edit-form">
                            <h3><i class="fas fa-user-edit"></i> Редактирование клиента</h3>
                            <form id="edit-client-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>ФИО:</label>
                                        <input type="text" id="edit-fullName" value="${client.fullName.replace(/"/g, '&quot;')}" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Тип клиента:</label>
                                        <select id="edit-clientType">
                                            <option value="individual" ${client.clientType === 'individual' ? 'selected' : ''}>Физическое лицо</option>
                                            <option value="business" ${client.clientType === 'business' ? 'selected' : ''}>Юридическое лицо</option>
                                            <option value="vip" ${client.clientType === 'vip' ? 'selected' : ''}>VIP клиент</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-actions">
                                    <button type="button" onclick="closeEditForm()" class="btn danger">Отмена</button>
                                    <button type="submit" class="btn success">Сохранить</button>
                                </div>
                            </form>
                        </div>
                    </div>
                `
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ClientsController;