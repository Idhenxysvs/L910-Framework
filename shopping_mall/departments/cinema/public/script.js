class CinemaAPI {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            
            // Проверяем, является ли ответ JSON
            const contentType = response.headers.get('content-type');
            let result;
            
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                result = await response.text();
            }
            
            if (!response.ok) {
                throw new Error(typeof result === 'object' && result.error ? result.error : `HTTP error! status: ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error('API Request error:', error);
            throw error;
        }
    }

    async getFilms() {
        return this.request('/api/films');
    }

    async getFilm(id) {
        return this.request(`/api/films/${id}`);
    }

    async createFilm(film) {
        return this.request('/api/films', 'POST', film);
    }

    async updateFilm(id, film) {
        return this.request(`/api/films/${id}`, 'PUT', film);
    }

    async patchFilm(id, film) {
        return this.request(`/api/films/${id}`, 'PATCH', film);
    }

    async deleteFilm(id) {
        return this.request(`/api/films/${id}`, 'DELETE');
    }

    async getSessions() {
        return this.request('/api/sessions');
    }

    async getSession(id) {
        return this.request(`/api/sessions/${id}`);
    }

    async createSession(session) {
        return this.request('/api/sessions', 'POST', session);
    }

    async updateSession(id, session) {
        return this.request(`/api/sessions/${id}`, 'PUT', session);
    }

    async patchSession(id, session) {
        return this.request(`/api/sessions/${id}`, 'PATCH', session);
    }

    async deleteSession(id) {
        return this.request(`/api/sessions/${id}`, 'DELETE');
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/films');
            return response.ok;
        } catch {
            return false;
        }
    }
}

let currentFilmId = null;
let currentSessionId = null;
let filmsData = [];
let sessionsData = [];

const api = new CinemaAPI();

function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <div class="notification-content">
            <h4>${type === 'success' ? 'Успешно!' : type === 'error' ? 'Ошибка!' : type === 'warning' ? 'Внимание!' : 'Информация'}</h4>
            <p>${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    notifications.appendChild(notification);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const section = document.getElementById(`${sectionId}-section`);
    if (section) {
        section.classList.add('active');
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.nav-link[onclick*="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
    }
}

function goBack() {
    window.location.href = 'http://localhost:3000';
}

async function getFilms() {
    const loading = document.getElementById('films-loading');
    const empty = document.getElementById('films-empty');
    const list = document.getElementById('films-list');
    
    if (loading) loading.style.display = 'flex';
    if (list) list.innerHTML = '';
    
    try {
        filmsData = await api.getFilms();
        
        if (!filmsData || filmsData.length === 0) {
            if (loading) loading.style.display = 'none';
            if (empty) empty.style.display = 'block';
            updateCounters();
            return;
        }
        
        if (empty) empty.style.display = 'none';
        
        if (list) {
            list.innerHTML = filmsData.map(film => `
                <div class="film-card">
                    <div class="film-header">
                        <h4>${film.title || 'Без названия'}</h4>
                        <div class="film-year">${film.year || 'Не указан'}</div>
                        <div class="film-badge">
                            ${film.isReleased ? '🎬 Выпущен' : '⏳ Скоро'}
                        </div>
                    </div>
                    <div class="film-body">
                        <div class="film-info">
                            <div class="film-info-item">
                                <i class="fas fa-user-tie"></i>
                                <span>Режиссер: ${film.director || 'Не указан'}</span>
                            </div>
                            <div class="film-info-item">
                                <i class="fas fa-clock"></i>
                                <span>Продолжительность: ${film.duration || 0} мин</span>
                            </div>
                            <div class="film-info-item">
                                <i class="fas fa-calendar"></i>
                                <span>Дата выпуска: ${film.releaseDate || 'Не указана'}</span>
                            </div>
                        </div>
                        
                        <div class="film-genres">
                            ${(film.genres || []).map(genre => `
                                <span class="genre-tag">${genre}</span>
                            `).join('')}
                        </div>
                        
                        <div class="film-actions">
                            <button class="btn btn-primary btn-sm" onclick="editFilm(${film.id})">
                                <i class="fas fa-edit"></i> Изменить
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteFilm(${film.id})">
                                <i class="fas fa-trash"></i> Удалить
                            </button>
                            <button class="btn btn-warning btn-sm" onclick="patchFilm(${film.id})">
                                <i class="fas fa-magic"></i> PATCH
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        updateCounters();
    } catch (error) {
        showNotification(`Ошибка загрузки фильмов: ${error.message}`, 'error');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function searchFilms() {
    const searchTerm = document.getElementById('filmSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.film-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const director = card.querySelector('.film-info-item:nth-child(1) span').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || director.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function showFilmForm() {
    const modal = document.getElementById('film-modal');
    const title = document.getElementById('film-modal-title');
    
    if (modal && title) {
        modal.classList.add('active');
        title.textContent = 'Добавить фильм';
        document.getElementById('filmForm').reset();
        currentFilmId = null;
    }
}

function hideFilmForm() {
    const modal = document.getElementById('film-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function editFilm(id) {
    try {
        const film = await api.getFilm(id);
        currentFilmId = id;
        
        document.getElementById('filmId').value = film.id;
        document.getElementById('title').value = film.title || '';
        document.getElementById('director').value = film.director || '';
        document.getElementById('year').value = film.year || '';
        document.getElementById('duration').value = film.duration || '';
        document.getElementById('isReleased').checked = film.isReleased || false;
        document.getElementById('genres').value = (film.genres || []).join(', ');
        document.getElementById('releaseDate').value = film.releaseDate || '';
        
        const title = document.getElementById('film-modal-title');
        if (title) title.textContent = 'Изменить фильм';
        
        const modal = document.getElementById('film-modal');
        if (modal) modal.classList.add('active');
    } catch (error) {
        showNotification(`Ошибка загрузки фильма: ${error.message}`, 'error');
    }
}

async function submitFilmForm(event) {
    event.preventDefault();
    
    const film = {
        title: document.getElementById('title').value,
        director: document.getElementById('director').value,
        year: parseInt(document.getElementById('year').value) || 2024,
        duration: parseInt(document.getElementById('duration').value) || 120,
        isReleased: document.getElementById('isReleased').checked,
        genres: document.getElementById('genres').value.split(',').map(g => g.trim()).filter(g => g),
        releaseDate: document.getElementById('releaseDate').value || new Date().toISOString().split('T')[0]
    };
    
    try {
        if (currentFilmId) {
            await api.updateFilm(currentFilmId, film);
            showNotification('Фильм успешно обновлен!', 'success');
        } else {
            await api.createFilm(film);
            showNotification('Фильм успешно создан!', 'success');
        }
        
        hideFilmForm();
        await getFilms();
    } catch (error) {
        showNotification(`Ошибка сохранения фильма: ${error.message}`, 'error');
    }
}

async function deleteFilm(id) {
    if (!confirm('Вы уверены, что хотите удалить этот фильм?')) return;
    
    try {
        await api.deleteFilm(id);
        showNotification('Фильм успешно удален!', 'success');
        await getFilms();
    } catch (error) {
        showNotification(`Ошибка удаления фильма: ${error.message}`, 'error');
    }
}

async function patchFilm(id) {
    try {
        const patchData = {
            patched: true,
            patchTimestamp: new Date().toISOString()
        };
        
        await api.patchFilm(id, patchData);
        showNotification('PATCH успешно применен!', 'success');
        await getFilms();
    } catch (error) {
        showNotification(`Ошибка применения PATCH: ${error.message}`, 'error');
    }
}

async function generateRandomFilm() {
    try {
        const genres = ['Боевик', 'Драма', 'Комедия', 'Фантастика', 'Триллер', 'Ужасы', 'Мелодрама', 'Детектив'];
        const randomGenres = [...Array(Math.floor(Math.random() * 3) + 1)]
            .map(() => genres[Math.floor(Math.random() * genres.length)]);
        
        const film = {
            title: `Фильм ${Math.floor(Math.random() * 1000)}`,
            director: `Режиссер ${Math.floor(Math.random() * 100)}`,
            year: Math.floor(Math.random() * 30) + 1995,
            duration: Math.floor(Math.random() * 120) + 90,
            isReleased: Math.random() > 0.3,
            genres: [...new Set(randomGenres)],
            releaseDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0]
        };
        
        await api.createFilm(film);
        showNotification('Случайный фильм успешно создан!', 'success');
        getFilms();
    } catch (error) {
        showNotification(`Ошибка создания фильма: ${error.message}`, 'error');
    }
}

async function getSessions() {
    const loading = document.getElementById('sessions-loading');
    const empty = document.getElementById('sessions-empty');
    const tbody = document.getElementById('sessions-table-body');
    
    if (loading) loading.style.display = 'flex';
    if (tbody) tbody.innerHTML = '';
    
    try {
        sessionsData = await api.getSessions();
        
        if (!sessionsData || sessionsData.length === 0) {
            if (loading) loading.style.display = 'none';
            if (empty) empty.style.display = 'block';
            updateCounters();
            return;
        }
        
        if (empty) empty.style.display = 'none';
        
        const filmMap = {};
        filmsData.forEach(film => {
            filmMap[film.id] = film.title;
        });
        
        if (tbody) {
            tbody.innerHTML = sessionsData.map(session => `
                <tr>
                    <td>${session.id}</td>
                    <td><strong>${filmMap[session.filmId] || `Фильм #${session.filmId}`}</strong></td>
                    <td><span class="badge badge-info">Зал ${session.hallNumber}</span></td>
                    <td>${formatDate(session.dateTime)}</td>
                    <td><strong>${session.price} ₽</strong></td>
                    <td>
                        <span class="badge ${session.is3D ? 'badge-success' : 'badge-warning'}">
                            ${session.is3D ? '3D' : '2D'}
                        </span>
                    </td>
                    <td>
                        <div>Доступно: ${session.availableSeats?.length || 0}</div>
                        <div>Забронировано: ${session.bookedSeats?.length || 0}</div>
                    </td>
                    <td>
                        <div class="film-actions">
                            <button class="btn btn-primary btn-sm" onclick="editSession(${session.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteSession(${session.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="btn btn-warning btn-sm" onclick="patchSession(${session.id})">
                                <i class="fas fa-magic"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        
        updateCounters();
    } catch (error) {
        showNotification(`Ошибка загрузки сеансов: ${error.message}`, 'error');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function filterSessions() {
    const hallFilter = document.getElementById('hallFilter').value;
    const rows = document.querySelectorAll('#sessions-table-body tr');
    
    rows.forEach(row => {
        const hallCell = row.cells[2].textContent;
        if (!hallFilter || hallCell.includes(`Зал ${hallFilter}`)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function showSessionForm() {
    const modal = document.getElementById('session-modal');
    const title = document.getElementById('session-modal-title');
    
    if (modal && title) {
        modal.classList.add('active');
        title.textContent = 'Добавить сеанс';
        document.getElementById('sessionForm').reset();
        currentSessionId = null;
    }
}

function hideSessionForm() {
    const modal = document.getElementById('session-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function editSession(id) {
    try {
        const session = await api.getSession(id);
        currentSessionId = id;
        
        document.getElementById('sessionId').value = session.id;
        document.getElementById('filmIdSession').value = session.filmId || '';
        document.getElementById('hallNumber').value = session.hallNumber || '1';
        document.getElementById('dateTime').value = session.dateTime ? session.dateTime.slice(0, 16) : '';
        document.getElementById('price').value = session.price || '';
        document.getElementById('is3D').checked = session.is3D || false;
        document.getElementById('availableSeats').value = (session.availableSeats || []).join(', ');
        document.getElementById('bookedSeats').value = (session.bookedSeats || []).join(', ');
        
        const title = document.getElementById('session-modal-title');
        if (title) title.textContent = 'Изменить сеанс';
        
        const modal = document.getElementById('session-modal');
        if (modal) modal.classList.add('active');
    } catch (error) {
        showNotification(`Ошибка загрузки сеанса: ${error.message}`, 'error');
    }
}

async function submitSessionForm(event) {
    event.preventDefault();
    
    const parseSeats = (str) => {
        if (!str) return [];
        return str.split(',')
            .map(s => parseInt(s.trim()))
            .filter(s => !isNaN(s));
    };
    
    const session = {
        filmId: parseInt(document.getElementById('filmIdSession').value) || 1,
        hallNumber: parseInt(document.getElementById('hallNumber').value) || 1,
        dateTime: document.getElementById('dateTime').value + ':00.000Z',
        price: parseInt(document.getElementById('price').value) || 300,
        is3D: document.getElementById('is3D').checked,
        availableSeats: parseSeats(document.getElementById('availableSeats').value) || Array.from({length: 50}, (_, i) => i + 1),
        bookedSeats: parseSeats(document.getElementById('bookedSeats').value) || []
    };
    
    try {
        if (currentSessionId) {
            await api.updateSession(currentSessionId, session);
            showNotification('Сеанс успешно обновлен!', 'success');
        } else {
            await api.createSession(session);
            showNotification('Сеанс успешно создан!', 'success');
        }
        
        hideSessionForm();
        await getSessions();
    } catch (error) {
        showNotification(`Ошибка сохранения сеанса: ${error.message}`, 'error');
    }
}

async function deleteSession(id) {
    if (!confirm('Вы уверены, что хотите удалить этот сеанс?')) return;
    
    try {
        await api.deleteSession(id);
        showNotification('Сеанс успешно удален!', 'success');
        await getSessions();
    } catch (error) {
        showNotification(`Ошибка удаления сеанса: ${error.message}`, 'error');
    }
}

async function patchSession(id) {
    try {
        const patchData = {
            patched: true,
            patchTimestamp: new Date().toISOString()
        };
        
        await api.patchSession(id, patchData);
        showNotification('PATCH успешно применен к сеансу!', 'success');
        await getSessions();
    } catch (error) {
        showNotification(`Ошибка применения PATCH: ${error.message}`, 'error');
    }
}

async function generateRandomSession() {
    try {
        const halls = [1, 2, 3, 4, 5];
        const session = {
            filmId: Math.floor(Math.random() * 10) + 1,
            hallNumber: halls[Math.floor(Math.random() * halls.length)],
            dateTime: new Date(Date.now() + Math.random() * 604800000).toISOString(),
            price: Math.floor(Math.random() * 200) + 300,
            is3D: Math.random() > 0.5,
            availableSeats: Array.from({length: Math.floor(Math.random() * 30) + 20}, (_, i) => i + 1),
            bookedSeats: Array.from({length: Math.floor(Math.random() * 20)}, (_, i) => i + 51)
        };
        
        await api.createSession(session);
        showNotification('Случайный сеанс создан!', 'success');
        getSessions();
    } catch (error) {
        showNotification(`Ошибка создания сеанса: ${error.message}`, 'error');
    }
}

function updateCounters() {
    const filmsCount = document.getElementById('films-count');
    const sessionsCount = document.getElementById('sessions-count');
    
    if (filmsCount) filmsCount.textContent = filmsData.length;
    if (sessionsCount) sessionsCount.textContent = sessionsData.length;
}

async function monitorServer() {
    try {
        const isAlive = await api.checkHealth();
        const statusElement = document.getElementById('server-status');
        const footerStatus = document.getElementById('server-status-footer');
        
        if (isAlive) {
            if (statusElement) {
                statusElement.textContent = '🟢';
                statusElement.title = 'Сервер работает';
            }
            if (footerStatus) {
                footerStatus.innerHTML = '<span style="color: #2a9d8f">🟢 Сервер работает</span>';
            }
        } else {
            if (statusElement) {
                statusElement.textContent = '🔴';
                statusElement.title = 'Сервер не отвечает';
            }
            if (footerStatus) {
                footerStatus.innerHTML = '<span style="color: #e63946">🔴 Сервер не отвечает</span>';
            }
            showNotification('Сервер не отвечает. Проверьте подключение.', 'error');
        }
    } catch (error) {
        console.log('Ошибка мониторинга сервера:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await monitorServer();
    
    await getFilms();
    await getSessions();
    
    setInterval(monitorServer, 30000);
    
    const filmForm = document.getElementById('filmForm');
    if (filmForm) {
        filmForm.addEventListener('submit', submitFilmForm);
    }
    
    const sessionForm = document.getElementById('sessionForm');
    if (sessionForm) {
        sessionForm.addEventListener('submit', submitSessionForm);
    }
    
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    window.addEventListener('click', (event) => {
        const filmModal = document.getElementById('film-modal');
        const sessionModal = document.getElementById('session-modal');
        
        if (filmModal && event.target === filmModal) {
            hideFilmForm();
        }
        
        if (sessionModal && event.target === sessionModal) {
            hideSessionForm();
        }
    });
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            hideFilmForm();
            hideSessionForm();
        }
    });
});

window.showSection = showSection;
window.toggleMobileMenu = toggleMobileMenu;
window.goBack = goBack;
window.getFilms = getFilms;
window.getSessions = getSessions;
window.searchFilms = searchFilms;
window.showFilmForm = showFilmForm;
window.hideFilmForm = hideFilmForm;
window.editFilm = editFilm;
window.deleteFilm = deleteFilm;
window.patchFilm = patchFilm;
window.generateRandomFilm = generateRandomFilm;
window.filterSessions = filterSessions;
window.showSessionForm = showSessionForm;
window.hideSessionForm = hideSessionForm;
window.editSession = editSession;
window.deleteSession = deleteSession;
window.patchSession = patchSession;
window.generateRandomSession = generateRandomSession;