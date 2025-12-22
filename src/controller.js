const fs = require('fs').promises;
const path = require('path');

class Controller {
  constructor(dataFile) {
    this.dataFile = path.join(__dirname, '..', 'data', dataFile);
  }

  async readData() {
    try {
      const data = await fs.readFile(this.dataFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async writeData(data) {
    await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
  }

  async getAll(req, res) {
    try {
      const data = await this.readData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка чтения данных' });
    }
  }

  async getById(req, res) {
    try {
      const data = await this.readData();
      const item = data.find(d => d.id === parseInt(req.params.id));
      if (item) {
        res.json(item);
      } else {
        res.status(404).json({ error: 'Артист не найден' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Ошибка чтения данных' });
    }
  }

  async create(req, res) {
    try {
      const data = await this.readData();
      const newItem = {
        id: data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1,
        name: req.body.name,
        genre: req.body.genre || 'Unknown',
        createdAt: new Date().toISOString()
      };
      data.push(newItem);
      await this.writeData(data);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка создания артиста' });
    }
  }
}

module.exports = Controller;