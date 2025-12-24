const Account = require('../models/Account');

class AccountsController {
    static async getAll(req, res) {
        try {
            const accounts = await Account.findAll();
            res.json(accounts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const account = await Account.findById(req.params.id);
            if (!account) return res.status(404).json({ error: 'Account not found' });
            res.json(account);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            if (!req.body.clientId) return res.status(400).json({ error: 'Client ID required' });
            const account = await Account.create(req.body);
            res.status(201).json(account);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const account = await Account.update(req.params.id, req.body);
            if (!account) return res.status(404).json({ error: 'Account not found' });
            res.json(account);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async patch(req, res) {
        try {
            const account = await Account.patch(req.params.id, req.body);
            if (!account) return res.status(404).json({ error: 'Account not found' });
            res.json(account);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const success = await Account.delete(req.params.id);
            if (!success) return res.status(404).json({ error: 'Account not found' });
            res.status(204).end();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deposit(req, res) {
        try {
            const { amount, description } = req.body;
            if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
            const account = await Account.deposit(req.params.id, amount, description);
            if (!account) return res.status(404).json({ error: 'Account not found' });
            res.json(account);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async withdraw(req, res) {
        try {
            const { amount, description } = req.body;
            if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
            const account = await Account.withdraw(req.params.id, amount, description);
            res.json(account);
        } catch (error) {
            if (error.message === 'Недостаточно средств') {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    static async getByClient(req, res) {
        try {
            const accounts = await Account.findByClientId(req.params.clientId);
            res.json(accounts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AccountsController;