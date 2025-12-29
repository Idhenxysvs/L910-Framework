const fs = require('fs').promises;
const path = require('path');

class Controller {
  constructor(dataFile) {
    this.dataFile = path.join(__dirname, '..', 'data', dataFile);
  }

  async readData() {
    const data = await fs.readFile(this.dataFile, 'utf-8');
    return JSON.parse(data);
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
        res.status(404).json({ error: 'Не найдено' });
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
        ...req.body,
        createdAt: new Date().toISOString()
      };
      data.push(newItem);
      await this.writeData(data);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка создания' });
    }
  }

  async update(req, res) {
    try {
      const data = await this.readData();
      const index = data.findIndex(d => d.id === parseInt(req.params.id));
      if (index !== -1) {
        data[index] = { ...data[index], ...req.body, updatedAt: new Date().toISOString() };
        await this.writeData(data);
        res.json(data[index]);
      } else {
        res.status(404).json({ error: 'Не найдено' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Ошибка обновления' });
    }
  }

  async delete(req, res) {
    try {
      const data = await this.readData();
      const filteredData = data.filter(d => d.id !== parseInt(req.params.id));
      if (filteredData.length < data.length) {
        await this.writeData(filteredData);
        res.json({ message: 'Удалено успешно' });
      } else {
        res.status(404).json({ error: 'Не найдено' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Ошибка удаления' });
    }
  }
}

module.exports = Controller;