class ConcertManager {
    constructor() {
        this.baseUrl = '';
        this.currentView = 'concerts';
        this.concerts = [];
        this.artists = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadConcerts();
        await this.loadArtists();
        this.updateStats();
        this.switchView('concerts');
    }

    bindEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
        document.getElementById('createForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createConcert();
        });
        document.getElementById('createArtistForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createArtist(e);
        });
    }

    async loadConcerts() {
        try {
            const response = await this.apiRequest('/concerts');
            this.concerts = response.data;
            this.renderConcerts();
        } catch (error) {
            console.error('Error loading concerts:', error);
        }
    }

    async loadArtists() {
        try {
            const response = await this.apiRequest('/artists');
            this.artists = response.data;
            this.renderArtists();
        } catch (error) {
            console.error('Error loading artists:', error);
        }
    }

    renderConcerts() {
        const container = document.getElementById('concertsContainer');
        if (!container) return;

        if (this.concerts.length === 0) {
            container.innerHTML = '<p class="empty">Нет концертов</p>';
            return;
        }

        container.innerHTML = this.concerts.map(concert => `
            <div class="concert-card">
                <h3>${concert.title}</h3>
                <p><i class="fas fa-calendar"></i> ${new Date(concert.date).toLocaleString()}</p>
                <p><i class="fas fa-map-marker"></i> ${concert.venue || 'Место не указано'}</p>
                <div class="actions">
                    <button class="btn-edit" onclick="concertManager.editConcert(${concert.id})">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="btn-delete" onclick="concertManager.deleteConcert(${concert.id})">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
        `).join('');
    }

    async createConcert() {
        const title = document.getElementById('concertTitle').value;
        const date = document.getElementById('concertDate').value;

        try {
            await this.apiRequest('/concerts', {
                method: 'POST',
                body: JSON.stringify({ title, date })
            });

            alert('Концерт создан!');
            await this.loadConcerts();
            this.updateStats();
            this.switchView('concerts');
        } catch (error) {
            alert('Ошибка создания концерта');
        }
    }

    async deleteConcert(id) {
        if (!confirm('Удалить концерт?')) return;

        try {
            await this.apiRequest(`/concerts/${id}`, {
                method: 'DELETE'
            });

            await this.loadConcerts();
            this.updateStats();
        } catch (error) {
            alert('Ошибка удаления');
        }
    }

    updateStats() {
        document.getElementById('totalConcerts').textContent = this.concerts.length;
        document.getElementById('totalArtists').textContent = this.artists.length;
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${view}Section`)?.classList.add('active');
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
        return { data, status: response.status };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.concertManager = new ConcertManager();
});