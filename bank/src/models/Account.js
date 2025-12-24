const fs = require('fs').promises;
const path = require('path');

class Account {
    constructor(data = {}) {
        this.id = data.id || 'A' + Date.now().toString(36);
        this.accountNumber = data.accountNumber || '40702' + Math.floor(1000000000 + Math.random() * 9000000000);
        this.clientId = data.clientId || '';
        this.accountType = data.accountType || 'checking';
        this.balance = data.balance || 0;
        this.currency = data.currency || 'RUB';
        this.openingDate = data.openingDate || new Date().toISOString();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.interestRate = data.interestRate || 0;
        this.transactions = data.transactions || [];
    }

    static get filePath() {
        return path.join(__dirname, '../../data/accounts.json');
    }

    static async findAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data).map(item => new Account(item));
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
                return [];
            }
            throw error;
        }
    }

    static async findById(id) {
        const accounts = await this.findAll();
        return accounts.find(account => account.id === id);
    }

    static async findByClientId(clientId) {
        const accounts = await this.findAll();
        return accounts.filter(account => account.clientId === clientId);
    }

    static async create(accountData) {
        const accounts = await this.findAll();
        const newAccount = new Account(accountData);
        accounts.push(newAccount);
        await this.saveAll(accounts);
        return newAccount;
    }

    static async update(id, accountData) {
        const accounts = await this.findAll();
        const index = accounts.findIndex(a => a.id === id);
        if (index === -1) return null;
        accounts[index] = new Account({ ...accounts[index], ...accountData, id });
        await this.saveAll(accounts);
        return accounts[index];
    }

    static async patch(id, updates) {
        const accounts = await this.findAll();
        const index = accounts.findIndex(a => a.id === id);
        if (index === -1) return null;
        const updatedAccount = { ...accounts[index], ...updates, id };
        accounts[index] = new Account(updatedAccount);
        await this.saveAll(accounts);
        return accounts[index];
    }

    static async delete(id) {
        const accounts = await this.findAll();
        const filteredAccounts = accounts.filter(account => account.id !== id);
        if (filteredAccounts.length === accounts.length) return false;
        await this.saveAll(filteredAccounts);
        return true;
    }

    static async saveAll(accounts) {
        await fs.writeFile(this.filePath, JSON.stringify(accounts, null, 2));
    }

    static async deposit(id, amount, description = 'Пополнение') {
        const account = await this.findById(id);
        if (!account) return null;
        account.balance += amount;
        account.transactions.push({
            date: new Date().toISOString(),
            type: 'deposit',
            amount: amount,
            description: description,
            balanceAfter: account.balance
        });
        await this.update(id, account);
        return account;
    }

    static async withdraw(id, amount, description = 'Снятие') {
        const account = await this.findById(id);
        if (!account) return null;
        if (account.balance < amount) throw new Error('Недостаточно средств');
        account.balance -= amount;
        account.transactions.push({
            date: new Date().toISOString(),
            type: 'withdrawal',
            amount: amount,
            description: description,
            balanceAfter: account.balance
        });
        await this.update(id, account);
        return account;
    }
}

module.exports = Account;