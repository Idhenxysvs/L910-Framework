class ConcertManager {
    constructor() {
        this.baseUrl = '';
        this.concerts = [];
        this.artists = [];
    }

    async init() {
        await this.loadConcerts();
        await this.loadArtists();
        this.renderConcerts();
        this.renderArtists();
    }

    async loadConcerts() {
        try {
            const response = await fetch('/concerts');
            this.concerts = await response.json();
        } catch (error) {
            console.error('Error loading concerts:', error);
        }
    }

    async loadArtists() {
        try {
            const response = await fetch('/artists');
            this.artists = await response.json();
        } catch (error) {
            console.error('Error loading artists:', error);
        }
    }

    renderConcerts() {
        const container = document.getElementById('concertsContainer');
        if (!container || this.concerts.length === 0) {
            container.innerHTML = '<p>Нет концертов</p>';
            return;
        }

        container.innerHTML = this.concerts.map(concert => `
            <div class="concert-item">
                <h3>${concert.title}</h3>
                <p>${new Date(concert.date).toLocaleDateString()}</p>
            </div>
        `).join('');
    }

    renderArtists() {
        const container = document.getElementById('artistsContainer');
        if (!container || this.artists.length === 0) {
            container.innerHTML = '<p>Нет артистов</p>';
            return;
        }

        container.innerHTML = this.artists.map(artist => `
            <div class="artist-item">
                <h3>${artist.name}</h3>
                <p>${artist.country}</p>
            </div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.concertManager = new ConcertManager();
    window.concertManager.init();
});