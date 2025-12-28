// Базовый класс API
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
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request error:', error);
            throw error;
        }
    }

    // Методы для работы с фильмами
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

    // Методы для работы с сеансами
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
}

// Глобальные переменные
const api = new CinemaAPI();
let filmsData = [];
let sessionsData = [];
let currentFilmId = null;
let currentSessionId = null;

// Функции для работы с интерфейсом
function showTab(tabName) {
    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показать выбранную вкладку
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Обновить активные кнопки вкладок
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    event.target.classList.add('active');
}

function showFilmForm() {
    document.getElementById('film-modal').classList.add('active');
    document.getElementById('film-modal-title').textContent = 'Добавить фильм';
    document.getElementById('filmForm').reset();
    currentFilmId = null;
}

function closeFilmForm() {
    document.getElementById('film-modal').classList.remove('active');
}

function showSessionForm() {
    document.getElementById('session-modal').classList.add('active');
    document.getElementById('session-modal-title').textContent = 'Добавить сеанс';
    document.getElementById('sessionForm').reset();
    currentSessionId = null;
}

function closeSessionForm() {
    document.getElementById('session-modal').classList.remove('active');
}

// Функции для работы с фильмами
async function loadFilms() {
    const container = document.getElementById('films-container');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Загрузка фильмов...</p>
        </div>
    `;

    try {
        filmsData = await api.getFilms();
        
        if (filmsData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-film fa-3x"></i>
                    <h3>Нет фильмов</h3>
                    <p>Добавьте первый фильм, нажав кнопку "Добавить фильм"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="films-grid" id="films-grid"></div>
        `;

        const grid = document.getElementById('films-grid');
        filmsData.forEach(film => {
            const filmCard = document.createElement('div');
            filmCard.className = 'film-card';
            filmCard.innerHTML = `
                <div class="film-header">
                    <h3>${film.title || 'Без названия'}</h3>
                    <div class="film-year">${film.year || 'Не указан'}</div>
                </div>
                <div class="film-body">
                    <div class="film-info">
                        <div class="film-info-item">
                            <i class="fas fa-user-tie"></i>
                            <span>Режиссер: ${film.director || 'Не указан'}</span>
                        </div>
                        <div class="film-info-item">
                            <i class="fas fa-clock"></i>
                            <span>Длительность: ${film.duration || 0} мин</span>
                        </div>
                        <div class="film-info-item">
                            <i class="fas fa-calendar"></i>
                            <span>Дата выпуска: ${film.releaseDate || 'Не указана'}</span>
                        </div>
                        <div class="film-info-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Статус: ${film.isReleased ? 'Выпущен' : 'Скоро'}</span>
                        </div>
                    </div>
                    
                    <div class="film-genres">
                        ${(film.genres || []).map(genre => `
                            <span class="genre-tag">${genre}</span>
                        `).join('')}
                    </div>
                    
                    <div class="film-actions">
                        <button class="btn btn-primary" onclick="editFilm(${film.id})">
                            <i class="fas fa-edit"></i> Изменить
                        </button>
                        <button class="btn btn-danger" onclick="deleteFilm(${film.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                        <button class="btn btn-warning" onclick="patchFilm(${film.id})">
                            <i class="fas fa-magic"></i> PATCH
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(filmCard);
        });
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function editFilm(id) {
    try {
        const film = await api.getFilm(id);
        currentFilmId = id;
        
        document.getElementById('filmId').value = film.id;
        document.getElementById('filmTitle').value = film.title || '';
        document.getElementById('filmDirector').value = film.director || '';
        document.getElementById('filmYear').value = film.year || '';
        document.getElementById('filmDuration').value = film.duration || '';
        document.getElementById('filmGenres').value = (film.genres || []).join(', ');
        document.getElementById('filmReleaseDate').value = film.releaseDate || '';
        document.getElementById('filmReleased').checked = film.isReleased || false;
        
        document.getElementById('film-modal-title').textContent = 'Изменить фильм';
        showFilmForm();
    } catch (error) {
        alert(`Ошибка загрузки фильма: ${error.message}`);
    }
}

async function deleteFilm(id) {
    if (!confirm('Вы уверены, что хотите удалить этот фильм?')) return;
    
    try {
        await api.deleteFilm(id);
        alert('Фильм успешно удален!');
        loadFilms();
    } catch (error) {
        alert(`Ошибка удаления фильма: ${error.message}`);
    }
}

async function patchFilm(id) {
    try {
        await api.patchFilm(id, { patched: true, timestamp: new Date().toISOString() });
        alert('PATCH успешно применен!');
        loadFilms();
    } catch (error) {
        alert(`Ошибка применения PATCH: ${error.message}`);
    }
}

async function generateRandomFilm() {
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
    
    try {
        await api.createFilm(film);
        alert('Случайный фильм создан!');
        loadFilms();
        closeFilmForm();
    } catch (error) {
        alert(`Ошибка создания фильма: ${error.message}`);
    }
}

// Функции для работы с сеансами
async function loadSessions() {
    const container = document.getElementById('sessions-container');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Загрузка сеансов...</p>
        </div>
    `;

    try {
        sessionsData = await api.getSessions();
        
        if (sessionsData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt fa-3x"></i>
                    <h3>Нет сеансов</h3>
                    <p>Создайте первый сеанс, нажав кнопку "Добавить сеанс"</p>
                </div>
            `;
            return;
        }

        const filmMap = {};
        filmsData.forEach(film => {
            filmMap[film.id] = film.title;
        });

        container.innerHTML = `
            <table class="sessions-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Фильм</th>
                        <th>Зал</th>
                        <th>Дата и время</th>
                        <th>Цена</th>
                        <th>Формат</th>
                        <th>Места</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody id="sessions-table-body"></tbody>
            </table>
        `;

        const tbody = document.getElementById('sessions-table-body');
        sessionsData.forEach(session => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${session.id}</td>
                <td><strong>${filmMap[session.filmId] || `Фильм #${session.filmId}`}</strong></td>
                <td><span class="badge badge-success">Зал ${session.hallNumber}</span></td>
                <td>${new Date(session.dateTime).toLocaleString('ru-RU')}</td>
                <td><strong>${session.price} ₽</strong></td>
                <td><span class="badge ${session.is3D ? 'badge-success' : 'badge-warning'}">${session.is3D ? '3D' : '2D'}</span></td>
                <td>
                    <div>Доступно: ${session.availableSeats?.length || 0}</div>
                    <div>Забронировано: ${session.bookedSeats?.length || 0}</div>
                </td>
                <td>
                    <div style="display: flex; gap: 5px;">
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
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function editSession(id) {
    try {
        const session = await api.getSession(id);
        currentSessionId = id;
        
        document.getElementById('sessionId').value = session.id;
        document.getElementById('sessionFilmId').value = session.filmId || '';
        document.getElementById('sessionHall').value = session.hallNumber || '1';
        document.getElementById('sessionPrice').value = session.price || '';
        document.getElementById('sessionDateTime').value = session.dateTime ? session.dateTime.slice(0, 16) : '';
        document.getElementById('sessionAvailable').value = (session.availableSeats || []).join(', ');
        document.getElementById('sessionBooked').value = (session.bookedSeats || []).join(', ');
        document.getElementById('session3D').checked = session.is3D || false;
        
        document.getElementById('session-modal-title').textContent = 'Изменить сеанс';
        showSessionForm();
    } catch (error) {
        alert(`Ошибка загрузки сеанса: ${error.message}`);
    }
}

async function deleteSession(id) {
    if (!confirm('Вы уверены, что хотите удалить этот сеанс?')) return;
    
    try {
        await api.deleteSession(id);
        alert('Сеанс успешно удален!');
        loadSessions();
    } catch (error) {
        alert(`Ошибка удаления сеанса: ${error.message}`);
    }
}

async function patchSession(id) {
    try {
        await api.patchSession(id, { patched: true, timestamp: new Date().toISOString() });
        alert('PATCH успешно применен!');
        loadSessions();
    } catch (error) {
        alert(`Ошибка применения PATCH: ${error.message}`);
    }
}

async function generateRandomSession() {
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
    
    try {
        await api.createSession(session);
        alert('Случайный сеанс создан!');
        loadSessions();
        closeSessionForm();
    } catch (error) {
        alert(`Ошибка создания сеанса: ${error.message}`);
    }
}

// Поиск и фильтрация
function searchFilms() {
    const searchTerm = document.getElementById('filmSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.film-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const director = card.querySelector('.film-info-item:nth-child(1) span').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || director.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
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

// Обработчики форм
document.getElementById('filmForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const film = {
        title: document.getElementById('filmTitle').value,
        director: document.getElementById('filmDirector').value,
        year: parseInt(document.getElementById('filmYear').value) || 2024,
        duration: parseInt(document.getElementById('filmDuration').value) || 120,
        isReleased: document.getElementById('filmReleased').checked,
        genres: document.getElementById('filmGenres').value.split(',').map(g => g.trim()).filter(g => g),
        releaseDate: document.getElementById('filmReleaseDate').value || new Date().toISOString().split('T')[0]
    };
    
    try {
        if (currentFilmId) {
            await api.updateFilm(currentFilmId, film);
            alert('Фильм успешно обновлен!');
        } else {
            await api.createFilm(film);
            alert('Фильм успешно создан!');
        }
        
        closeFilmForm();
        loadFilms();
    } catch (error) {
        alert(`Ошибка сохранения фильма: ${error.message}`);
    }
});

document.getElementById('sessionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const parseSeats = (str) => {
        if (!str) return [];
        return str.split(',')
            .map(s => parseInt(s.trim()))
            .filter(s => !isNaN(s));
    };
    
    const session = {
        filmId: parseInt(document.getElementById('sessionFilmId').value) || 1,
        hallNumber: parseInt(document.getElementById('sessionHall').value) || 1,
        dateTime: document.getElementById('sessionDateTime').value + ':00.000Z',
        price: parseInt(document.getElementById('sessionPrice').value) || 300,
        is3D: document.getElementById('session3D').checked,
        availableSeats: parseSeats(document.getElementById('sessionAvailable').value) || Array.from({length: 50}, (_, i) => i + 1),
        bookedSeats: parseSeats(document.getElementById('sessionBooked').value) || []
    };
    
    try {
        if (currentSessionId) {
            await api.updateSession(currentSessionId, session);
            alert('Сеанс успешно обновлен!');
        } else {
            await api.createSession(session);
            alert('Сеанс успешно создан!');
        }
        
        closeSessionForm();
        loadSessions();
    } catch (error) {
        alert(`Ошибка сохранения сеанса: ${error.message}`);
    }
});

// Проверка состояния сервера
async function checkServerStatus() {
    try {
        await api.getFilms();
        document.querySelector('#server-status .status-badge').className = 'status-badge online';
        document.querySelector('#server-status .status-badge').textContent = 'Онлайн';
    } catch (error) {
        document.querySelector('#server-status .status-badge').className = 'status-badge offline';
        document.querySelector('#server-status .status-badge').textContent = 'Офлайн';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadFilms();
    loadSessions();
    checkServerStatus();
    
    // Обновляем статус каждые 30 секунд
    setInterval(checkServerStatus, 30000);
});