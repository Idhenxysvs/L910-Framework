class ConcertAPI {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return { data, status: response.status };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  getConcerts() {
    return this.request('/concerts');
  }
  getConcert(id) {
    return this.request(`/concerts/${id}`);
  }
  createConcert(concert) {
    return this.request('/concerts', {
      method: 'POST',
      body: JSON.stringify(concert)
    });
  }
  updateConcert(id, concert) {
    return this.request(`/concerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(concert)
    });
  }
  patchConcert(id, concert) {
    return this.request(`/concerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(concert)
    });
  }
  deleteConcert(id) {
    return this.request(`/concerts/${id}`, {
      method: 'DELETE'
    });
  }

  getArtists() {
    return this.request('/artists');
  }
  getArtist(id) {
    return this.request(`/artists/${id}`);
  }
  createArtist(artist) {
    return this.request('/artists', {
      method: 'POST',
      body: JSON.stringify(artist)
    });
  }
  updateArtist(id, artist) {
    return this.request(`/artists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(artist)
    });
  }
  patchArtist(id, artist) {
    return this.request(`/artists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(artist)
    });
  }
  deleteArtist(id) {
    return this.request(`/artists/${id}`, {
      method: 'DELETE'
    });
  }
}

class UI {
  constructor() {
    this.api = new ConcertAPI();
    this.initEventListeners();
    this.loadInitialData();
  }

  initEventListeners() {
    document.getElementById('getConcerts').addEventListener('click', () => this.handleGetConcerts());
    document.getElementById('getConcert').addEventListener('click', () => this.handleGetConcert());
    document.getElementById('createConcert').addEventListener('click', () => this.handleCreateConcert());
    document.getElementById('updateConcert').addEventListener('click', () => this.handleUpdateConcert());
    document.getElementById('patchConcert').addEventListener('click', () => this.handlePatchConcert());
    document.getElementById('deleteConcert').addEventListener('click', () => this.handleDeleteConcert());

    document.getElementById('getArtists').addEventListener('click', () => this.handleGetArtists());
    document.getElementById('getArtist').addEventListener('click', () => this.handleGetArtist());
    document.getElementById('createArtist').addEventListener('click', () => this.handleCreateArtist());
    document.getElementById('updateArtist').addEventListener('click', () => this.handleUpdateArtist());
    document.getElementById('patchArtist').addEventListener('click', () => this.handlePatchArtist());
    document.getElementById('deleteArtist').addEventListener('click', () => this.handleDeleteArtist());
  }

  async loadInitialData() {
    try {
      const [concerts, artists] = await Promise.all([
        this.api.getConcerts(),
        this.api.getArtists()
      ]);
      
      this.updateSelectOptions('concertId', concerts.data);
      this.updateSelectOptions('artistId', artists.data);
    } catch (error) {
      this.showError('Не удалось загрузить начальные данные');
    }
  }

  updateSelectOptions(selectId, items) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Выберите...';
    select.appendChild(emptyOption);
    
    items.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.title || item.name} (ID: ${item.id})`;
      select.appendChild(option);
    });

    if (currentValue && [...select.options].some(opt => opt.value === currentValue)) {
      select.value = currentValue;
    }
  }

  async handleGetConcerts() {
    try {
      const response = await this.api.getConcerts();
      this.showResult('concertResult', response.data);
    } catch (error) {
      this.showError('concertResult', error.message);
    }
  }
  async handleGetConcert() {
    const id = document.getElementById('concertId').value;
    if (!id) {
      this.showError('concertResult', 'Введите ID концерта');
      return;
    }
    try {
      const response = await this.api.getConcert(id);
      this.showResult('concertResult', response.data);
    } catch (error) {
      this.showError('concertResult', error.message);
    }
  }
  async handleCreateConcert() {
    const concert = {
      title: document.getElementById('concertTitle').value || 'Новый концерт',
      artistId: parseInt(document.getElementById('concertArtistId').value) || 1,
      date: new Date().toISOString(),
      venue: document.getElementById('concertVenue').value || 'Неизвестная площадка',
      price: parseFloat(document.getElementById('concertPrice').value) || 0,
      soldOut: document.getElementById('concertSoldOut').value === 'true',
      genres: document.getElementById('concertGenres').value.split(',').map(g => g.trim()).filter(g => g)
    };
    
    try {
      const response = await this.api.createConcert(concert);
      this.showResult('concertResult', response.data, 'Концерт создан!');
      this.loadInitialData();
    } catch (error) {
      this.showError('concertResult', error.message);
    }
  }

  async handleUpdateConcert() {
    const id = document.getElementById('concertId').value;
    if (!id) {
      this.showError('concertResult', 'Выберите концерт для обновления');
      return;
    }
    
    const concert = {
      title: document.getElementById('concertTitle').value || 'Обновленный концерт',
      artistId: parseInt(document.getElementById('concertArtistId').value) || 1,
      date: new Date().toISOString(),
      venue: document.getElementById('concertVenue').value || 'Обновленная площадка',
      price: parseFloat(document.getElementById('concertPrice').value) || 0,
      soldOut: document.getElementById('concertSoldOut').value === 'true',
      genres: document.getElementById('concertGenres').value.split(',').map(g => g.trim()).filter(g => g)
    };
    
    try {
      const response = await this.api.updateConcert(id, concert);
      this.showResult('concertResult', response.data, 'Концерт обновлен!');
      this.loadInitialData();
    } catch (error) {
      this.showError('concertResult', error.message);
    }
  }
  async handlePatchConcert() {
    const id = document.getElementById('concertId').value;
    if (!id) {
      this.showError('concertResult', 'Выберите концерт для частичного обновления');
      return;
    }
    
    const concert = {};
    const title = document.getElementById('concertTitle').value;
    const venue = document.getElementById('concertVenue').value;
    
    if (title) concert.title = title;
    if (venue) concert.venue = venue;
    
    try {
      const response = await this.api.patchConcert(id, concert);
      this.showResult('concertResult', response.data, 'Концерт частично обновлен!');
      this.loadInitialData();
    } catch (error) {
      this.showError('concertResult', error.message);
    }
  }
  async handleDeleteConcert() {
    const id = document.getElementById('concertId').value;
    if (!id) {
      this.showError('concertResult', 'Выберите концерт для удаления');
      return;
    }
    
    if (!confirm(`Удалить концерт с ID ${id}?`)) return;
    
    try {
      const response = await this.api.deleteConcert(id);
      this.showResult('concertResult', response.data, 'Концерт удален!');
      this.loadInitialData();
    } catch (error) {
      this.showError('concertResult', error.message);
    }
  }
  async handleGetArtists() {
    try {
      const response = await this.api.getArtists();
      this.showResult('artistResult', response.data);
    } catch (error) {
      this.showError('artistResult', error.message);
    }
  }
  async handleGetArtist() {
    const id = document.getElementById('artistId').value;
    if (!id) {
      this.showError('artistResult', 'Введите ID артиста');
      return;
    }
    
    try {
      const response = await this.api.getArtist(id);
      this.showResult('artistResult', response.data);
    } catch (error) {
      this.showError('artistResult', error.message);
    }
  }
  async handleCreateArtist() {
    const artist = {
      name: document.getElementById('artistName').value || 'Новый артист',
      country: document.getElementById('artistCountry').value || 'Неизвестно',
      active: document.getElementById('artistActive').value === 'true',
      albumCount: parseInt(document.getElementById('artistAlbumCount').value) || 0,
      popularity: parseFloat(document.getElementById('artistPopularity').value) || 0,
      upcomingConcerts: document.getElementById('artistConcerts').value.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c)),
      debutDate: new Date().toISOString().split('T')[0]
    };
    try {
      const response = await this.api.createArtist(artist);
      this.showResult('artistResult', response.data, 'Артист создан!');
      this.loadInitialData();
    } catch (error) {
      this.showError('artistResult', error.message);
    }
  }
  async handleUpdateArtist() {
    const id = document.getElementById('artistId').value;
    if (!id) {
      this.showError('artistResult', 'Выберите артиста для обновления');
      return;
    }
    const artist = {
      name: document.getElementById('artistName').value || 'Обновленный артист',
      country: document.getElementById('artistCountry').value || 'Обновлено',
      active: document.getElementById('artistActive').value === 'true',
      albumCount: parseInt(document.getElementById('artistAlbumCount').value) || 0,
      popularity: parseFloat(document.getElementById('artistPopularity').value) || 0,
      upcomingConcerts: document.getElementById('artistConcerts').value.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c)),
      debutDate: new Date().toISOString().split('T')[0]
    };
    try {
      const response = await this.api.updateArtist(id, artist);
      this.showResult('artistResult', response.data, 'Артист обновлен!');
      this.loadInitialData();
    } catch (error) {
      this.showError('artistResult', error.message);
    }
  }
  async handlePatchArtist() {
    const id = document.getElementById('artistId').value;
    if (!id) {
      this.showError('artistResult', 'Выберите артиста для частичного обновления');
      return;
    }
    const artist = {};
    const name = document.getElementById('artistName').value;
    const country = document.getElementById('artistCountry').value;
    
    if (name) artist.name = name;
    if (country) artist.country = country;
    
    try {
      const response = await this.api.patchArtist(id, artist);
      this.showResult('artistResult', response.data, 'Артист частично обновлен!');
      this.loadInitialData();
    } catch (error) {
      this.showError('artistResult', error.message);
    }
  }
  async handleDeleteArtist() {
    const id = document.getElementById('artistId').value;
    if (!id) {
      this.showError('artistResult', 'Выберите артиста для удаления');
      return;
    }
    
    if (!confirm(`Удалить артиста с ID ${id}?`)) return;
    
    try {
      const response = await this.api.deleteArtist(id);
      this.showResult('artistResult', response.data, 'Артист удален!');
      this.loadInitialData();
    } catch (error) {
      this.showError('artistResult', error.message);
    }
  }

  showResult(elementId, data, successMessage = '') {
    const element = document.getElementById(elementId);
    element.innerHTML = '';
    
    if (successMessage) {
      const successDiv = document.createElement('div');
      successDiv.className = 'success';
      successDiv.textContent = successMessage;
      element.appendChild(successDiv);
    }
    
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(data, null, 2);
    element.appendChild(pre);
  }

  showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = '';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = `Ошибка: ${message}`;
    element.appendChild(errorDiv);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new UI();
});