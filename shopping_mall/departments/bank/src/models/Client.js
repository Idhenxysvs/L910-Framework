const fs = require('fs').promises;
const path = require('path');

class Client {
    constructor(data = {}) {
        this.id = data.id || 'C' + Date.now().toString(36);
        this.fullName = data.fullName || '';
        this.passport = data.passport || '';
        this.birthDate = data.birthDate || new Date().toISOString();
        this.address = data.address || '';
        this.phone = data.phone || '';
        this.email = data.email || '';
        this.clientType = data.clientType || 'individual';
        this.registrationDate = data.registrationDate || new Date().toISOString();
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.creditRating = data.creditRating || 0;
        this.income = data.income || 0;
        this.accountIds = data.accountIds || [];
        this.lastModified = data.lastModified || new Date().toISOString();
        this.modificationCount = data.modificationCount || 0;
        this.patchHistory = data.patchHistory || [];
    }

    static get filePath() {
        return path.join(__dirname, '../../data/clients.json');
    }

    static async findAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            return JSON.parse(data).map(item => new Client(item));
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
                return [];
            }
            throw error;
        }
    }

    static async findById(id) {
        const clients = await this.findAll();
        return clients.find(client => client.id === id);
    }

    static async create(clientData) {
        const clients = await this.findAll();
        const newClient = new Client(clientData);
        clients.push(newClient);
        await this.saveAll(clients);
        return newClient;
    }

    static async update(id, clientData) {
        const clients = await this.findAll();
        const index = clients.findIndex(c => c.id === id);
        if (index === -1) return null;
        clients[index] = new Client({ ...clients[index], ...clientData, id });
        await this.saveAll(clients);
        return clients[index];
    }

    static async patch(id, updates) {
    const clients = await this.findAll();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    const now = new Date().toISOString();
    const actualUpdates = { ...updates };
    actualUpdates.lastModified = now;
    actualUpdates.modificationCount = (clients[index].modificationCount || 0) + 1;
    
    const updatedClient = { 
        ...clients[index], 
        ...actualUpdates, 
        id
    };
    
    clients[index] = new Client(updatedClient);
    await this.saveAll(clients);
    return clients[index];
}

    static async delete(id) {
        const clients = await this.findAll();
        const filteredClients = clients.filter(client => client.id !== id);
        if (filteredClients.length === clients.length) return false;
        await this.saveAll(filteredClients);
        return true;
    }

    static async saveAll(clients) {
        await fs.writeFile(this.filePath, JSON.stringify(clients, null, 2));
    }

    static async findActive() {
        const clients = await this.findAll();
        return clients.filter(client => client.isActive);
    }

    static async findByType(type) {
        const clients = await this.findAll();
        return clients.filter(client => client.clientType === type);
    }
}

module.exports = Client;