class ConcertManager {
  constructor() {
    this.baseUrl = '';
    this.currentView = 'concerts';
    this.concertFilter = 'all';
    this.currentTheme = 'blue';
    this.init();
  }

  async init() {
    this.bindEvents();
    this.loadTheme();
    await this.loadStats();
    await this.loadConcerts();
    await this.loadArtists();
    this.updateUI();
    this.switchView('concerts');
  }

  bindEvents() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });
    document.querySelectorAll('.control-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleControlAction(action);
      });
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.concertFilter = e.target.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterConcerts();
      });
    });

    document.getElementById('createConcertForm').addEventListener('submit', (e) => this.createConcert(e));
    document.getElementById('createArtistForm').addEventListener('submit', (e) => this.createArtist(e));
    document.getElementById('editConcertForm').addEventListener('submit', (e) => this.updateConcert(e));
    document.getElementById('editArtistForm').addEventListener('submit', (e) => this.updateArtist(e));

    document.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => this.switchView('concerts'));
    });
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('concertManagerTheme');
    if (savedTheme) {
      this.currentTheme = savedTheme;
      this.applyTheme();
    }
  }

  toggleTheme() {
    document.body.classList.add('theme-transition');
    
    this.currentTheme = this.currentTheme === 'blue' ? 'red' : 'blue';
    this.applyTheme();
    localStorage.setItem('concertManagerTheme', this.currentTheme);
    
    const themeIcon = document.getElementById('themeIcon');
    themeIcon.className = this.currentTheme === 'blue' ? 'fas fa-palette' : 'fas fa-fire';
    
    this.showNotification(
      `Тема изменена на ${this.currentTheme === 'blue' ? '🔵 Синюю' : '🔴 Красно-чёрную'}`,
      'success'
    );
    
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 500);
  }

  applyTheme() {
    if (this.currentTheme === 'red') {
      document.body.classList.add('theme-red');
    } else {
      document.body.classList.remove('theme-red');
    }
  }

  async loadStats() {
    try {
      const [concertsRes, artistsRes] = await Promise.all([
        this.apiRequest('/concerts'),
        this.apiRequest('/artists')
      ]);

      const upcomingConcerts = concertsRes.data.filter(c => new Date(c.date) > new Date()).length;
      
      document.getElementById('totalConcerts').textContent = concertsRes.data.length;
      document.getElementById('totalArtists').textContent = artistsRes.data.length;
      document.getElementById('upcomingConcerts').textContent = upcomingConcerts;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadConcerts() {
    try {
      const response = await this.apiRequest('/concerts');
      this.concerts = response.data;
      this.renderConcerts();
      this.populateSelects();
    } catch (error) {
      this.showNotification('Ошибка загрузки концертов', 'error');
    }
  }

  async loadArtists() {
    try {
      const response = await this.apiRequest('/artists');
      this.artists = response.data;
      this.renderArtists();
      this.populateSelects();
    } catch (error) {
      this.showNotification('Ошибка загрузки артистов', 'error');
    }
  }

  renderConcerts() {
    const container = document.getElementById('concertsContainer');
    if (!container) return;

    const filteredConcerts = this.filterConcertsByType(this.concerts);
    
    if (filteredConcerts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-music"></i>
          <h3>Концерты не найдены</h3>
          <p>Создайте свой первый концерт!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredConcerts.map(concert => this.createConcertCard(concert)).join('');
    
    document.querySelectorAll('.edit-concert').forEach(btn => {
      btn.addEventListener('click', (e) => this.prepareEditConcert(e.currentTarget.dataset.id));
    });
    
    document.querySelectorAll('.delete-concert').forEach(btn => {
      btn.addEventListener('click', (e) => this.deleteConcert(e.currentTarget.dataset.id));
    });
  }

  createConcertCard(concert) {
    const artist = this.artists?.find(a => a.id === concert.artistId);
    const date = new Date(concert.date);
    const isUpcoming = date > new Date();
    const isSoldOut = concert.soldOut;
    const formattedDate = date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const title = concert.title.length > 50 ? concert.title.substring(0, 47) + '...' : concert.title;
    const artistName = artist?.name || 'Неизвестный артист';
    const shortArtistName = artistName.length > 25 ? artistName.substring(0, 22) + '...' : artistName;
    const venue = concert.venue.length > 25 ? concert.venue.substring(0, 22) + '...' : concert.venue;
    const genres = concert.genres.join(', ');
    const shortGenres = genres.length > 25 ? genres.substring(0, 22) + '...' : genres;
    
    return `
      <div class="concert-card ${isSoldOut ? 'sold-out' : ''}">
        <div class="concert-header">
          <div style="flex: 1; min-width: 0;">
            <h3 class="concert-title" title="${concert.title}">${title}</h3>
            <div class="concert-artist" title="${artistName}">${shortArtistName}</div>
          </div>
          <div class="concert-date">${formattedDate}</div>
        </div>
        
        <div class="concert-details">
          <div class="detail-item">
            <span class="detail-label">📍 Место:</span>
            <span class="detail-value" title="${concert.venue}">${venue}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">💰 Цена:</span>
            <span class="detail-value">$${concert.price}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">🎵 Жанры:</span>
            <span class="detail-value" title="${genres}">${shortGenres}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">📅 Статус:</span>
            <span class="detail-value ${isUpcoming ? 'text-success' : 'text-muted'}">
              ${isUpcoming ? 'Предстоящий' : 'Прошедший'}
            </span>
          </div>
        </div>
        
        <div class="concert-actions">
          <button class="action-btn edit-concert" data-id="${concert.id}" title="Редактировать концерт">
            <i class="fas fa-edit"></i> Редактировать
          </button>
          <button class="action-btn delete-concert" data-id="${concert.id}" title="Удалить концерт">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </div>
      </div>
    `;
  }

  renderArtists() {
    const container = document.getElementById('artistsContainer');
    if (!container || !this.artists) return;

    if (this.artists.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-user"></i>
          <h3>Артисты не найдены</h3>
          <p>Добавьте своего первого артиста!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.artists.map(artist => this.createArtistCard(artist)).join('');
    
    document.querySelectorAll('.edit-artist').forEach(btn => {
      btn.addEventListener('click', (e) => this.prepareEditArtist(e.currentTarget.dataset.id));
    });
    
    document.querySelectorAll('.delete-artist').forEach(btn => {
      btn.addEventListener('click', (e) => this.deleteArtist(e.currentTarget.dataset.id));
    });
  }

  createArtistCard(artist) {
    const upcomingConcerts = this.concerts?.filter(c => 
      c.artistId === artist.id && new Date(c.date) > new Date()
    ).length || 0;

    const artistName = artist.name.length > 30 ? artist.name.substring(0, 27) + '...' : artist.name;
    const country = artist.country.length > 20 ? artist.country.substring(0, 17) + '...' : artist.country;

    return `
      <div class="artist-card">
        <div class="artist-header">
          <div class="artist-avatar" title="${artist.name}">
            ${artist.name.charAt(0)}
          </div>
          <div class="artist-info">
            <h3 title="${artist.name}">${artistName}</h3>
            <div class="artist-country" title="${artist.country}">${country}</div>
          </div>
        </div>
        
        <div class="artist-stats">
          <div class="stat">
            <div class="stat-value">${artist.albumCount}</div>
            <div class="stat-label">Альбомов</div>
          </div>
          <div class="stat">
            <div class="stat-value">${upcomingConcerts}</div>
            <div class="stat-label">Концертов</div>
          </div>
          <div class="stat">
            <div class="stat-value">${artist.popularity.toFixed(1)}</div>
            <div class="stat-label">Рейтинг</div>
          </div>
          <div class="stat">
            <div class="stat-value">${artist.active ? '✅' : '❌'}</div>
            <div class="stat-label">Активен</div>
          </div>
        </div>
        
        <div class="artist-actions">
          <button class="action-btn edit-artist" data-id="${artist.id}" title="Редактировать артиста">
            <i class="fas fa-edit"></i> Редактировать
          </button>
          <button class="action-btn delete-artist" data-id="${artist.id}" title="Удалить артиста">
            <i class="fas fa-trash"></i> Удалить
          </button>
        </div>
      </div>
    `;
  }

  filterConcertsByType(concerts) {
    const now = new Date();
    
    switch(this.concertFilter) {
      case 'upcoming':
        return concerts.filter(c => new Date(c.date) > now);
      case 'past':
        return concerts.filter(c => new Date(c.date) <= now);
      case 'soldout':
        return concerts.filter(c => c.soldOut);
      default:
        return concerts;
    }
  }

  filterConcerts() {
    this.renderConcerts();
  }

  async createConcert(e) {
    e.preventDefault();
    
    const formData = {
      title: document.getElementById('concertTitle').value,
      artistId: parseInt(document.getElementById('concertArtistId').value),
      date: document.getElementById('concertDate').value,
      venue: document.getElementById('concertVenue').value,
      price: parseFloat(document.getElementById('concertPrice').value),
      soldOut: document.getElementById('concertSoldOut').value === 'true',
      genres: document.getElementById('concertGenres').value.split(',').map(g => g.trim()).filter(g => g)
    };

    try {
      await this.apiRequest('/concerts', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      this.showNotification('🎉 Концерт успешно создан!');
      document.getElementById('createConcertForm').reset();
      await this.loadConcerts();
      await this.loadStats();
      this.switchView('concerts');
    } catch (error) {
      this.showNotification('❌ Ошибка создания концерта', 'error');
    }
  }

  async createArtist(e) {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('artistNameCreate').value,
      country: document.getElementById('artistCountryCreate').value,
      active: document.getElementById('artistActiveCreate').value === 'true',
      albumCount: parseInt(document.getElementById('artistAlbumCountCreate').value),
      popularity: parseFloat(document.getElementById('artistPopularityCreate').value),
      upcomingConcerts: document.getElementById('artistConcertsCreate').value
        .split(',')
        .map(c => parseInt(c.trim()))
        .filter(c => !isNaN(c)),
      debutDate: document.getElementById('artistDebutDateCreate').value
    };

    try {
      await this.apiRequest('/artists', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      this.showNotification('🎉 Артист успешно создан!');
      document.getElementById('createArtistForm').reset();
      await this.loadArtists();
      await this.loadStats();
      this.switchView('artists');
    } catch (error) {
      this.showNotification('❌ Ошибка создания артиста', 'error');
    }
  }

  async updateConcert(e) {
    e.preventDefault();
    
    const concertId = document.getElementById('editConcertId').value;
    if (!concertId) {
      this.showNotification('❌ Выберите концерт для редактирования', 'error');
      return;
    }

    const formData = {
      title: document.getElementById('editConcertTitle').value,
      artistId: parseInt(document.getElementById('editConcertArtistId').value),
      date: document.getElementById('editConcertDate').value,
      venue: document.getElementById('editConcertVenue').value,
      price: parseFloat(document.getElementById('editConcertPrice').value),
      soldOut: document.getElementById('editConcertSoldOut').value === 'true',
      genres: document.getElementById('editConcertGenres').value.split(',').map(g => g.trim()).filter(g => g)
    };

    try {
      await this.apiRequest(`/concerts/${concertId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      this.showNotification('✅ Концерт успешно обновлен!');
      await this.loadConcerts();
      this.switchView('concerts');
    } catch (error) {
      this.showNotification('❌ Ошибка обновления концерта', 'error');
    }
  }

  async updateArtist(e) {
    e.preventDefault();
    
    const artistId = document.getElementById('editArtistId').value;
    if (!artistId) {
      this.showNotification('❌ Выберите артиста для редактирования', 'error');
      return;
    }

    const formData = {
      name: document.getElementById('editArtistName').value,
      country: document.getElementById('editArtistCountry').value,
      active: document.getElementById('editArtistActive').value === 'true',
      albumCount: parseInt(document.getElementById('editArtistAlbumCount').value),
      popularity: parseFloat(document.getElementById('editArtistPopularity').value),
      upcomingConcerts: document.getElementById('editArtistConcerts').value
        .split(',')
        .map(c => parseInt(c.trim()))
        .filter(c => !isNaN(c)),
      debutDate: document.getElementById('editArtistDebutDate').value
    };

    try {
      await this.apiRequest(`/artists/${artistId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      this.showNotification('✅ Артист успешно обновлен!');
      await this.loadArtists();
      this.switchView('artists');
    } catch (error) {
      this.showNotification('❌ Ошибка обновления артиста', 'error');
    }
  }

  async deleteConcert(id) {
    if (!confirm('Удалить этот концерт?')) return;

    try {
      await this.apiRequest(`/concerts/${id}`, {
        method: 'DELETE'
      });

      this.showNotification('🗑️ Концерт удален!');
      await this.loadConcerts();
      await this.loadStats();
    } catch (error) {
      this.showNotification('❌ Ошибка удаления концерта', 'error');
    }
  }

  async deleteArtist(id) {
    if (!confirm('Удалить этого артиста?')) return;

    try {
      await this.apiRequest(`/artists/${id}`, {
        method: 'DELETE'
      });

      this.showNotification('🗑️ Артист удален!');
      await this.loadArtists();
      await this.loadStats();
    } catch (error) {
      this.showNotification('❌ Ошибка удаления артиста', 'error');
    }
  }

  prepareEditConcert(id) {
    const concert = this.concerts.find(c => c.id == id);
    if (!concert) return;

    document.getElementById('editConcertId').value = concert.id;
    document.getElementById('editConcertTitle').value = concert.title;
    document.getElementById('editConcertArtistId').value = concert.artistId;
    document.getElementById('editConcertDate').value = concert.date.split('T')[0] + 'T' + concert.date.split('T')[1].slice(0,5);
    document.getElementById('editConcertVenue').value = concert.venue;
    document.getElementById('editConcertPrice').value = concert.price;
    document.getElementById('editConcertSoldOut').value = concert.soldOut.toString();
    document.getElementById('editConcertGenres').value = concert.genres.join(', ');

    this.switchView('editConcert');
    this.showNotification('📝 Загружены данные концерта для редактирования');
  }

  prepareEditArtist(id) {
    const artist = this.artists.find(a => a.id == id);
    if (!artist) return;

    document.getElementById('editArtistId').value = artist.id;
    document.getElementById('editArtistName').value = artist.name;
    document.getElementById('editArtistCountry').value = artist.country;
    document.getElementById('editArtistActive').value = artist.active.toString();
    document.getElementById('editArtistAlbumCount').value = artist.albumCount;
    document.getElementById('editArtistPopularity').value = artist.popularity;
    document.getElementById('editArtistConcerts').value = artist.upcomingConcerts.join(', ');
    document.getElementById('editArtistDebutDate').value = artist.debutDate;

    this.switchView('editArtist');
    this.showNotification('📝 Загружены данные артиста для редактирования');
  }

  populateSelects() {
    const concertSelect = document.getElementById('editConcertId');
    if (concertSelect && this.concerts) {
      concertSelect.innerHTML = '<option value="">Выберите концерт...</option>' +
        this.concerts.map(concert => `
          <option value="${concert.id}">${concert.title.length > 40 ? concert.title.substring(0, 37) + '...' : concert.title} (ID: ${concert.id})</option>
        `).join('');
    }

    const artistSelects = ['concertArtistId', 'editConcertArtistId', 'editArtistId'];
    artistSelects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select && this.artists) {
        select.innerHTML = '<option value="">Выберите артиста...</option>' +
          this.artists.map(artist => `
            <option value="${artist.id}">${artist.name.length > 40 ? artist.name.substring(0, 37) + '...' : artist.name}</option>
          `).join('');
      }
    });
  }

  switchView(view) {
    this.currentView = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
        document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === view);
    });
    document.querySelectorAll('.control-card').forEach(card => {
      card.classList.toggle('active', card.dataset.action === view);
    });
    document.querySelectorAll('.form-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById('concertsSection').style.display = 
      (view === 'concerts' || view === 'createConcert' || view === 'editConcert') ? 'block' : 'none';
    document.getElementById('artistsSection').style.display = 
      (view === 'artists' || view === 'createArtist' || view === 'editArtist') ? 'block' : 'none';

    if (view === 'createConcert') {
      document.getElementById('createConcertFormSection').classList.add('active');
    } else if (view === 'createArtist') {
      document.getElementById('createArtistFormSection').classList.add('active');
    } else if (view === 'editConcert') {
      document.getElementById('editConcertFormSection').classList.add('active');
    } else if (view === 'editArtist') {
      document.getElementById('editArtistFormSection').classList.add('active');
    }
    if (view === 'concerts') {
      document.querySelector('#concertsSection h2').innerHTML = '<i class="fas fa-calendar-alt"></i> Расписание концертов';
    } else if (view === 'artists') {
      document.querySelector('#artistsSection h2').innerHTML = '<i class="fas fa-user"></i> Артисты и исполнители';
    }
  }

  handleControlAction(action) {
    this.switchView(action);
  }

  updateUI() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0,5);
    
    document.querySelectorAll('input[type="date"]').forEach(input => {
      if (!input.value) input.value = today;
    });
    
    document.querySelectorAll('input[type="datetime-local"]').forEach(input => {
      if (!input.value) input.value = `${today}T${time}`;
    });
    
    document.getElementById('concertPrice').value = '50';
    document.getElementById('concertSoldOut').value = 'false';
    document.getElementById('concertGenres').value = 'Rock, Pop';
    
    document.getElementById('artistActiveCreate').value = 'true';
    document.getElementById('artistAlbumCountCreate').value = '1';
    document.getElementById('artistPopularityCreate').value = '7.5';
    
    document.getElementById('editConcertPrice').value = '50';
    document.getElementById('editConcertSoldOut').value = 'false';
    document.getElementById('editConcertGenres').value = 'Rock, Pop';
  }

  async apiRequest(endpoint, options = {}) {
    const response = await fetch(endpoint, {
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
  }

  showNotification(message, type = 'success') {
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.concertManager = new ConcertManager();
});