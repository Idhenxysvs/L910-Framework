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
}

module.exports = Controller;