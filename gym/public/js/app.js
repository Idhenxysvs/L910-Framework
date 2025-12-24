const API_BASE = '/api';

// Управление секциями
function showSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показать нужную секцию
    document.getElementById(sectionId).classList.add('active');
    
    // Обновить активные кнопки
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Обновить заголовки форм
    updateFormTitles();
    
    // Загрузить данные если нужно
    if (sectionId === 'dashboard') {
        loadDashboard();
    } else if (sectionId === 'members') {
        loadMembers();
    } else if (sectionId === 'trainers') {
        loadTrainers();
    } else if (sectionId === 'appointments') {
        loadAppointments();
    } else if (sectionId === 'reviews') {
        loadReviews();
    } else if (sectionId === 'add-member') {
        loadTrainersForSelect();
    } else if (sectionId === 'add-appointment') {
        loadMembersAndTrainersForSelect();
    }
}

// Обновление заголовков форм
function updateFormTitles() {
    const memberForm = document.getElementById('member-form');
    const trainerForm = document.getElementById('trainer-form');
    const appointmentForm = document.getElementById('appointment-form');
    
    if (memberForm.dataset.editId) {
        document.getElementById('member-form-title').textContent = 'Редактирование клиента';
    } else {
        document.getElementById('member-form-title').textContent = 'Новый клиент';
    }
    
    if (trainerForm.dataset.editId) {
        document.getElementById('trainer-form-title').textContent = 'Редактирование тренера';
    } else {
        document.getElementById('trainer-form-title').textContent = 'Новый тренер';
    }
    
    if (appointmentForm.dataset.editId) {
        document.getElementById('appointment-form-title').textContent = 'Редактирование записи';
    } else {
        document.getElementById('appointment-form-title').textContent = 'Новая запись';
    }
}

// Сброс формы клиента
function resetMemberForm() {
    const form = document.getElementById('member-form');
    form.reset();
    const submitBtn = document.getElementById('member-submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-check"></i> Добавить клиента';
    delete form.dataset.editId;
    updateFormTitles();
}

// Сброс формы тренера
function resetTrainerForm() {
    const form = document.getElementById('trainer-form');
    form.reset();
    const submitBtn = document.getElementById('trainer-submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-check"></i> Добавить тренера';
    delete form.dataset.editId;
    updateFormTitles();
}

// Сброс формы записи
function resetAppointmentForm() {
    const form = document.getElementById('appointment-form');
    form.reset();
    const submitBtn = document.getElementById('appointment-submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-check"></i> Добавить запись';
    delete form.dataset.editId;
    updateFormTitles();
}

// Показать сообщение
function showMessage(text, type = 'info') {
    // Удалить старые сообщения
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 4000);
}

// Загрузка дашборда
async function loadDashboard() {
    try {
        // Загружаем статистику
        const membersResponse = await fetch(`${API_BASE}/members`);
        const members = await membersResponse.json();
        document.getElementById('total-members').textContent = members.length;
        
        const trainersResponse = await fetch(`${API_BASE}/trainers`);
        const trainers = await trainersResponse.json();
        document.getElementById('total-trainers').textContent = trainers.length;
        
        const today = new Date().toISOString().split('T')[0];
        const todayAppointmentsResponse = await fetch(`${API_BASE}/appointments/date/${today}`);
        const todayAppointments = await todayAppointmentsResponse.json();
        document.getElementById('today-appointments').textContent = todayAppointments.length;
        
        const reviewsResponse = await fetch(`${API_BASE}/reviews`);
        const reviews = await reviewsResponse.json();
        document.getElementById('total-reviews').textContent = reviews.length;
        
        // Загружаем предстоящие записи
        const upcomingResponse = await fetch(`${API_BASE}/appointments/upcoming`);
        const upcoming = await upcomingResponse.json();
        
        const upcomingContainer = document.getElementById('upcoming-appointments');
        upcomingContainer.innerHTML = '';
        
        if (upcoming.length === 0) {
            upcomingContainer.innerHTML = '<p class="empty-message">Нет предстоящих записей</p>';
        } else {
            upcoming.slice(0, 5).forEach(appointment => {
                const item = document.createElement('div');
                item.className = 'dashboard-item';
                item.innerHTML = `
                    <div>
                        <div class="dashboard-item-title">${appointment.member?.fullName || 'Клиент'}</div>
                        <div class="dashboard-item-subtitle">${appointment.trainer?.fullName || 'Тренер'} - ${appointment.date} ${appointment.time}</div>
                    </div>
                    <div class="dashboard-item-value">${appointment.status === 'scheduled' ? 'Запланирована' : appointment.status === 'completed' ? 'Завершена' : 'Отменена'}</div>
                `;
                upcomingContainer.appendChild(item);
            });
        }
        
        // Загружаем топ тренеров
        const topTrainersResponse = await fetch(`${API_BASE}/trainers/top-rated?limit=5`);
        const topTrainers = await topTrainersResponse.json();
        
        const topTrainersContainer = document.getElementById('top-trainers');
        topTrainersContainer.innerHTML = '';
        
        if (topTrainers.length === 0) {
            topTrainersContainer.innerHTML = '<p class="empty-message">Нет тренеров с рейтингом</p>';
        } else {
            topTrainers.forEach(trainer => {
                const item = document.createElement('div');
                item.className = 'dashboard-item';
                item.innerHTML = `
                    <div>
                        <div class="dashboard-item-title">${trainer.fullName}</div>
                        <div class="dashboard-item-subtitle">${trainer.specialization}</div>
                    </div>
                    <div class="dashboard-item-value">${trainer.rating}/5 ⭐</div>
                `;
                topTrainersContainer.appendChild(item);
            });
        }
        
    } catch (error) {
        console.error('Ошибка загрузки дашборда:', error);
        showMessage('Ошибка загрузки дашборда', 'error');
    }
}

// Загрузка клиентов
async function loadMembers() {
    try {
        const response = await fetch(`${API_BASE}/members`);
        const members = await response.json();
        
        const container = document.getElementById('members-container');
        container.innerHTML = '';
        
        if (members.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет клиентов. Добавьте первого!</p>';
            return;
        }
        
        members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3><i class="fas fa-user"></i> ${member.fullName}</h3>
                <p><span class="info-label">Возраст:</span> ${member.age} лет</p>
                <p><span class="info-label">Email:</span> ${member.email}</p>
                <p><span class="info-label">Телефон:</span> ${member.phone}</p>
                <p><span class="info-label">Абонемент:</span> 
                    <span class="membership">${member.membershipType}</span>
                </p>
                <p><span class="info-label">Статус:</span> 
                    <span class="${member.isActive ? 'active-member' : 'inactive-member'}">
                        <i class="fas ${member.isActive ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${member.isActive ? 'АКТИВЕН' : 'НЕАКТИВЕН'}
                    </span>
                </p>
                <p><span class="info-label">Рост/Вес:</span> ${member.height}см / ${member.weight}кг</p>
                <p><span class="info-label">Цели:</span> ${member.goals.join(', ') || 'Не указаны'}</p>
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteMember('${member.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editMember('${member.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки клиентов:', error);
        showMessage('Ошибка загрузки клиентов', 'error');
    }
}

// Поиск клиентов
async function searchMembers() {
    const searchTerm = document.getElementById('members-search').value.toLowerCase();
    
    if (!searchTerm) {
        loadMembers();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/members`);
        const members = await response.json();
        
        const filteredMembers = members.filter(member => 
            member.fullName.toLowerCase().includes(searchTerm) || 
            member.email.toLowerCase().includes(searchTerm)
        );
        
        const container = document.getElementById('members-container');
        container.innerHTML = '';
        
        if (filteredMembers.length === 0) {
            container.innerHTML = '<p class="empty-message">Клиенты не найдены</p>';
            return;
        }
        
        filteredMembers.forEach(member => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3><i class="fas fa-user"></i> ${member.fullName}</h3>
                <p><span class="info-label">Возраст:</span> ${member.age} лет</p>
                <p><span class="info-label">Email:</span> ${member.email}</p>
                <p><span class="info-label">Телефон:</span> ${member.phone}</p>
                <p><span class="info-label">Абонемент:</span> 
                    <span class="membership">${member.membershipType}</span>
                </p>
                <p><span class="info-label">Статус:</span> 
                    <span class="${member.isActive ? 'active-member' : 'inactive-member'}">
                        <i class="fas ${member.isActive ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${member.isActive ? 'АКТИВЕН' : 'НЕАКТИВЕН'}
                    </span>
                </p>
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteMember('${member.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editMember('${member.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка поиска клиентов:', error);
        showMessage('Ошибка поиска клиентов', 'error');
    }
}

// Загрузка активных клиентов
async function showActiveMembers() {
    try {
        const response = await fetch(`${API_BASE}/members/active`);
        const members = await response.json();
        
        const container = document.getElementById('members-container');
        container.innerHTML = '';
        
        if (members.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет активных клиентов</p>';
            return;
        }
        
        members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3><i class="fas fa-user"></i> ${member.fullName}</h3>
                <p><span class="info-label">Абонемент:</span> 
                    <span class="membership">${member.membershipType}</span>
                </p>
                <p><span class="info-label">Телефон:</span> ${member.phone}</p>
                <p><span class="active-member">
                    <i class="fas fa-check-circle"></i> АКТИВЕН
                </span></p>
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteMember('${member.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editMember('${member.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки активных клиентов:', error);
        showMessage('Ошибка загрузки активных клиентов', 'error');
    }
}

// Загрузка тренеров
async function loadTrainers() {
    try {
        const response = await fetch(`${API_BASE}/trainers`);
        const trainers = await response.json();
        
        const container = document.getElementById('trainers-container');
        container.innerHTML = '';
        
        if (trainers.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет тренеров. Добавьте первого!</p>';
            return;
        }
        
        trainers.forEach(trainer => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3><i class="fas fa-user-tie"></i> ${trainer.fullName}</h3>
                <p><span class="info-label">Специализация:</span> ${trainer.specialization}</p>
                <p><span class="info-label">Опыт:</span> ${trainer.experienceYears} лет</p>
                <p><span class="info-label">Ставка:</span> ${trainer.hourlyRate} BYN/час</p>
                <p><span class="info-label">Рейтинг:</span> 
                    <span class="rating">${'★'.repeat(Math.round(trainer.rating))}</span>
                    (${trainer.rating}/5)
                </p>
                <p><span class="info-label">Статус:</span> 
                    ${trainer.isAvailable ? 
                        '<span class="active-member"><i class="fas fa-user-check"></i> ДОСТУПЕН</span>' : 
                        '<span class="inactive-member"><i class="fas fa-user-times"></i> НЕ ДОСТУПЕН</span>'
                    }
                </p>
                <p><span class="info-label">Сертификаты:</span> ${trainer.certifications.join(', ') || 'Нет'}</p>
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteTrainer('${trainer.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editTrainer('${trainer.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="action-btn review-btn" onclick="addReview('${trainer.id}')">
                        <i class="fas fa-star"></i> Отзыв
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки тренеров:', error);
        showMessage('Ошибка загрузки тренеров', 'error');
    }
}

// Поиск тренеров
async function searchTrainers() {
    const searchTerm = document.getElementById('trainers-search').value.toLowerCase();
    
    if (!searchTerm) {
        loadTrainers();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/trainers`);
        const trainers = await response.json();
        
        const filteredTrainers = trainers.filter(trainer => 
            trainer.fullName.toLowerCase().includes(searchTerm) || 
            trainer.specialization.toLowerCase().includes(searchTerm)
        );
        
        const container = document.getElementById('trainers-container');
        container.innerHTML = '';
        
        if (filteredTrainers.length === 0) {
            container.innerHTML = '<p class="empty-message">Тренеры не найдены</p>';
            return;
        }
        
        filteredTrainers.forEach(trainer => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3><i class="fas fa-user-tie"></i> ${trainer.fullName}</h3>
                <p><span class="info-label">Специализация:</span> ${trainer.specialization}</p>
                <p><span class="info-label">Опыт:</span> ${trainer.experienceYears} лет</p>
                <p><span class="info-label">Ставка:</span> ${trainer.hourlyRate} BYN/час</p>
                <p><span class="info-label">Рейтинг:</span> 
                    <span class="rating">${'★'.repeat(Math.round(trainer.rating))}</span>
                    (${trainer.rating}/5)
                </p>
                <p><span class="info-label">Статус:</span> 
                    ${trainer.isAvailable ? 
                        '<span class="active-member"><i class="fas fa-user-check"></i> ДОСТУПЕН</span>' : 
                        '<span class="inactive-member"><i class="fas fa-user-times"></i> НЕ ДОСТУПЕН</span>'
                    }
                </p>
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteTrainer('${trainer.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editTrainer('${trainer.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="action-btn review-btn" onclick="addReview('${trainer.id}')">
                        <i class="fas fa-star"></i> Отзыв
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка поиска тренеров:', error);
        showMessage('Ошибка поиска тренеров', 'error');
    }
}

// Загрузка доступных тренеров
async function showAvailableTrainers() {
    try {
        const response = await fetch(`${API_BASE}/trainers/available`);
        const trainers = await response.json();
        
        const container = document.getElementById('trainers-container');
        container.innerHTML = '';
        
        if (trainers.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет доступных тренеров</p>';
            return;
        }
        
        trainers.forEach(trainer => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3><i class="fas fa-user-tie"></i> ${trainer.fullName}</h3>
                <p><span class="info-label">Специализация:</span> ${trainer.specialization}</p>
                <p><span class="info-label">Ставка:</span> ${trainer.hourlyRate} BYN/час</p>
                <p><span class="info-label">Рейтинг:</span> 
                    <span class="rating">${'★'.repeat(Math.round(trainer.rating))}</span>
                    (${trainer.rating}/5)
                </p>
                <p><span class="active-member">
                    <i class="fas fa-user-check"></i> ДОСТУПЕН ДЛЯ НОВЫХ КЛИЕНТОВ
                </span></p>
                <div class="card-actions">
                    <button class="action-btn edit-btn" onclick="editTrainer('${trainer.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="action-btn review-btn" onclick="addReview('${trainer.id}')">
                        <i class="fas fa-star"></i> Отзыв
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки доступных тренеров:', error);
        showMessage('Ошибка загрузки доступных тренеров', 'error');
    }
}

// Загрузка записей
async function loadAppointments() {
    try {
        const response = await fetch(`${API_BASE}/appointments`);
        const appointments = await response.json();
        
        const container = document.getElementById('appointments-container');
        container.innerHTML = '';
        
        if (appointments.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет записей. Добавьте первую!</p>';
            return;
        }
        
        appointments.forEach(appointment => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const statusClass = appointment.status === 'scheduled' ? 'status-scheduled' : 
                               appointment.status === 'completed' ? 'status-completed' : 'status-cancelled';
            const statusText = appointment.status === 'scheduled' ? 'Запланирована' : 
                              appointment.status === 'completed' ? 'Завершена' : 'Отменена';
            
            card.innerHTML = `
                <h3><i class="fas fa-calendar-alt"></i> Запись на ${appointment.date}</h3>
                <p><span class="info-label">Время:</span> ${appointment.time}</p>
                <p><span class="info-label">Длительность:</span> ${appointment.duration} минут</p>
                <p><span class="info-label">Клиент:</span> ${appointment.member?.fullName || 'Неизвестный клиент'}</p>
                <p><span class="info-label">Тренер:</span> ${appointment.trainer?.fullName || 'Неизвестный тренер'} (${appointment.trainer?.specialization || ''})</p>
                <p><span class="info-label">Статус:</span> 
                    <span class="appointment-status ${statusClass}">
                        <i class="fas ${appointment.status === 'scheduled' ? 'fa-clock' : appointment.status === 'completed' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${statusText}
                    </span>
                </p>
                ${appointment.notes ? `<p><span class="info-label">Примечания:</span> ${appointment.notes}</p>` : ''}
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteAppointment('${appointment.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editAppointment('${appointment.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    ${appointment.status === 'scheduled' ? `
                        <button class="action-btn complete-btn" onclick="completeAppointment('${appointment.id}')">
                            <i class="fas fa-check"></i> Завершить
                        </button>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки записей:', error);
        showMessage('Ошибка загрузки записей', 'error');
    }
}

// Фильтрация записей по дате
async function filterAppointmentsByDate() {
    const date = document.getElementById('appointment-date').value;
    
    if (!date) {
        loadAppointments();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/appointments/date/${date}`);
        const appointments = await response.json();
        
        const container = document.getElementById('appointments-container');
        container.innerHTML = '';
        
        if (appointments.length === 0) {
            container.innerHTML = `<p class="empty-message">Нет записей на ${date}</p>`;
            return;
        }
        
        appointments.forEach(appointment => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const statusClass = appointment.status === 'scheduled' ? 'status-scheduled' : 
                               appointment.status === 'completed' ? 'status-completed' : 'status-cancelled';
            const statusText = appointment.status === 'scheduled' ? 'Запланирована' : 
                              appointment.status === 'completed' ? 'Завершена' : 'Отменена';
            
            card.innerHTML = `
                <h3><i class="fas fa-calendar-alt"></i> Запись на ${appointment.date}</h3>
                <p><span class="info-label">Время:</span> ${appointment.time}</p>
                <p><span class="info-label">Длительность:</span> ${appointment.duration} минут</p>
                <p><span class="info-label">Клиент:</span> ${appointment.member?.fullName || 'Неизвестный клиент'}</p>
                <p><span class="info-label">Тренер:</span> ${appointment.trainer?.fullName || 'Неизвестный тренер'} (${appointment.trainer?.specialization || ''})</p>
                <p><span class="info-label">Статус:</span> 
                    <span class="appointment-status ${statusClass}">
                        <i class="fas ${appointment.status === 'scheduled' ? 'fa-clock' : appointment.status === 'completed' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${statusText}
                    </span>
                </p>
                ${appointment.notes ? `<p><span class="info-label">Примечания:</span> ${appointment.notes}</p>` : ''}
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteAppointment('${appointment.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editAppointment('${appointment.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    ${appointment.status === 'scheduled' ? `
                        <button class="action-btn complete-btn" onclick="completeAppointment('${appointment.id}')">
                            <i class="fas fa-check"></i> Завершить
                        </button>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка фильтрации записей:', error);
        showMessage('Ошибка фильтрации записей', 'error');
    }
}

// Показать предстоящие записи
async function showUpcomingAppointments() {
    try {
        const response = await fetch(`${API_BASE}/appointments/upcoming`);
        const appointments = await response.json();
        
        const container = document.getElementById('appointments-container');
        container.innerHTML = '';
        
        if (appointments.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет предстоящих записей</p>';
            return;
        }
        
        appointments.forEach(appointment => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const statusClass = appointment.status === 'scheduled' ? 'status-scheduled' : 
                               appointment.status === 'completed' ? 'status-completed' : 'status-cancelled';
            const statusText = appointment.status === 'scheduled' ? 'Запланирована' : 
                              appointment.status === 'completed' ? 'Завершена' : 'Отменена';
            
            card.innerHTML = `
                <h3><i class="fas fa-calendar-alt"></i> Запись на ${appointment.date}</h3>
                <p><span class="info-label">Время:</span> ${appointment.time}</p>
                <p><span class="info-label">Длительность:</span> ${appointment.duration} минут</p>
                <p><span class="info-label">Клиент:</span> ${appointment.member?.fullName || 'Неизвестный клиент'}</p>
                <p><span class="info-label">Тренер:</span> ${appointment.trainer?.fullName || 'Неизвестный тренер'} (${appointment.trainer?.specialization || ''})</p>
                <p><span class="info-label">Статус:</span> 
                    <span class="appointment-status ${statusClass}">
                        <i class="fas ${appointment.status === 'scheduled' ? 'fa-clock' : appointment.status === 'completed' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${statusText}
                    </span>
                </p>
                ${appointment.notes ? `<p><span class="info-label">Примечания:</span> ${appointment.notes}</p>` : ''}
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteAppointment('${appointment.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editAppointment('${appointment.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    ${appointment.status === 'scheduled' ? `
                        <button class="action-btn complete-btn" onclick="completeAppointment('${appointment.id}')">
                            <i class="fas fa-check"></i> Завершить
                        </button>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки предстоящих записей:', error);
        showMessage('Ошибка загрузки предстоящих записей', 'error');
    }
}

// Загрузка отзывов
async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE}/reviews`);
        const reviews = await response.json();
        
        const container = document.getElementById('reviews-container');
        container.innerHTML = '';
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет отзывов. Добавьте первый!</p>';
            return;
        }
        
        reviews.forEach(review => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3><i class="fas fa-star"></i> Отзыв на ${review.trainer?.fullName || 'Неизвестный тренер'}</h3>
                <p><span class="info-label">От клиента:</span> ${review.member?.fullName || 'Неизвестный клиент'}</p>
                <p><span class="info-label">Рейтинг:</span> 
                    <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                    (${review.rating}/5)
                </p>
                <p><span class="info-label">Дата:</span> ${new Date(review.createdAt).toLocaleDateString('ru-RU')}</p>
                ${review.comment ? `<p><span class="info-label">Комментарий:</span> ${review.comment}</p>` : ''}
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteReview('${review.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editReview('${review.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        showMessage('Ошибка загрузки отзывов', 'error');
    }
}

// Фильтрация отзывов по тренеру
async function filterReviewsByTrainer() {
    const trainerId = document.getElementById('review-trainer-filter').value;
    
    if (!trainerId) {
        loadReviews();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/reviews/trainer/${trainerId}`);
        const reviews = await response.json();
        
        const container = document.getElementById('reviews-container');
        container.innerHTML = '';
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет отзывов на этого тренера</p>';
            return;
        }
        
        reviews.forEach(review => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3><i class="fas fa-star"></i> Отзыв на ${review.trainer?.fullName || 'Неизвестный тренер'}</h3>
                <p><span class="info-label">От клиента:</span> ${review.member?.fullName || 'Неизвестный клиент'}</p>
                <p><span class="info-label">Рейтинг:</span> 
                    <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                    (${review.rating}/5)
                </p>
                <p><span class="info-label">Дата:</span> ${new Date(review.createdAt).toLocaleDateString('ru-RU')}</p>
                ${review.comment ? `<p><span class="info-label">Комментарий:</span> ${review.comment}</p>` : ''}
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteReview('${review.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editReview('${review.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка фильтрации отзывов:', error);
        showMessage('Ошибка фильтрации отзывов', 'error');
    }
}

// Загрузка тренеров для выпадающего списка
async function loadTrainersForSelect() {
    try {
        const response = await fetch(`${API_BASE}/trainers`);
        const trainers = await response.json();
        
        const select = document.getElementById('trainerId');
        select.innerHTML = '<option value="">Без тренера</option>';
        
        trainers.forEach(trainer => {
            if (trainer.isAvailable) {
                const option = document.createElement('option');
                option.value = trainer.id;
                option.textContent = `${trainer.fullName} (${trainer.specialization})`;
                select.appendChild(option);
            }
        });
        
    } catch (error) {
        console.error('Ошибка загрузки тренеров для выбора:', error);
    }
}

// Загрузка клиентов и тренеров для формы записи
async function loadMembersAndTrainersForSelect() {
    try {
        // Загрузка клиентов
        const membersResponse = await fetch(`${API_BASE}/members`);
        const members = await membersResponse.json();
        
        const memberSelect = document.getElementById('appointmentMemberId');
        memberSelect.innerHTML = '<option value="">Выберите клиента</option>';
        
        members.forEach(member => {
            if (member.isActive) {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = member.fullName;
                memberSelect.appendChild(option);
            }
        });
        
        // Загрузка тренеров
        const trainersResponse = await fetch(`${API_BASE}/trainers`);
        const trainers = await trainersResponse.json();
        
        const trainerSelect = document.getElementById('appointmentTrainerId');
        trainerSelect.innerHTML = '<option value="">Выберите тренера</option>';
        
        trainers.forEach(trainer => {
            if (trainer.isAvailable) {
                const option = document.createElement('option');
                option.value = trainer.id;
                option.textContent = `${trainer.fullName} (${trainer.specialization})`;
                trainerSelect.appendChild(option);
            }
        });
        
        // Загрузка тренеров для фильтра отзывов
        const reviewTrainerSelect = document.getElementById('review-trainer-filter');
        reviewTrainerSelect.innerHTML = '<option value="">Все тренеры</option>';
        
        trainers.forEach(trainer => {
            const option = document.createElement('option');
            option.value = trainer.id;
            option.textContent = `${trainer.fullName} (${trainer.specialization})`;
            reviewTrainerSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки данных для форм:', error);
    }
}

// Редактирование клиента
async function editMember(id) {
    try {
        const response = await fetch(`${API_BASE}/members/${id}`);
        const member = await response.json();
        
        if (!member) {
            showMessage('Клиент не найден', 'error');
            return;
        }
        
        // Заполняем форму данными
        document.getElementById('fullName').value = member.fullName || '';
        document.getElementById('age').value = member.age || '';
        document.getElementById('email').value = member.email || '';
        document.getElementById('phone').value = member.phone || '';
        document.getElementById('membershipType').value = member.membershipType || 'Standard';
        document.getElementById('height').value = member.height || '';
        document.getElementById('weight').value = member.weight || '';
        document.getElementById('goals').value = member.goals?.join(', ') || '';
        document.getElementById('isActive').checked = member.isActive !== false;
        
        // Загружаем список тренеров
        await loadTrainersForSelect();
        if (member.trainerId) {
            document.getElementById('trainerId').value = member.trainerId;
        }
        
        // Меняем текст кнопки и добавляем обработчик
        const form = document.getElementById('member-form');
        const submitBtn = document.getElementById('member-submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
        form.dataset.editId = id;
        
        // Обновляем заголовок
        updateFormTitles();
        
        // Переходим на форму
        showSection('add-member');
        showMessage('Заполнена форма для редактирования клиента', 'info');
        
    } catch (error) {
        console.error('Ошибка загрузки клиента для редактирования:', error);
        showMessage('Ошибка загрузки данных клиента', 'error');
    }
}

// Редактирование тренера
async function editTrainer(id) {
    try {
        const response = await fetch(`${API_BASE}/trainers/${id}`);
        const trainer = await response.json();
        
        if (!trainer) {
            showMessage('Тренер не найден', 'error');
            return;
        }
        
        // Заполняем форму данными
        document.getElementById('trainerFullName').value = trainer.fullName || '';
        document.getElementById('specialization').value = trainer.specialization || 'Фитнес';
        document.getElementById('experienceYears').value = trainer.experienceYears || '';
        document.getElementById('hourlyRate').value = trainer.hourlyRate || '';
        document.getElementById('trainerEmail').value = trainer.email || '';
        document.getElementById('trainerPhone').value = trainer.phone || '';
        document.getElementById('certifications').value = trainer.certifications?.join(', ') || '';
        document.getElementById('bio').value = trainer.bio || '';
        document.getElementById('isAvailable').checked = trainer.isAvailable !== false;
        
        // Меняем текст кнопки
        const form = document.getElementById('trainer-form');
        const submitBtn = document.getElementById('trainer-submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
        form.dataset.editId = id;
        
        // Обновляем заголовок
        updateFormTitles();
        
        // Переходим на форму
        showSection('add-trainer');
        showMessage('Заполнена форма для редактирования тренера', 'info');
        
    } catch (error) {
        console.error('Ошибка загрузки тренера для редактирования:', error);
        showMessage('Ошибка загрузки данных тренера', 'error');
    }
}

// Редактирование записи
async function editAppointment(id) {
    try {
        const response = await fetch(`${API_BASE}/appointments/${id}`);
        const appointment = await response.json();
        
        if (!appointment) {
            showMessage('Запись не найдена', 'error');
            return;
        }
        
        // Загружаем списки клиентов и тренеров
        await loadMembersAndTrainersForSelect();
        
        // Заполняем форму данными
        document.getElementById('appointmentMemberId').value = appointment.memberId || '';
        document.getElementById('appointmentTrainerId').value = appointment.trainerId || '';
        document.getElementById('appointmentDate').value = appointment.date || '';
        document.getElementById('appointmentTime').value = appointment.time || '';
        document.getElementById('appointmentDuration').value = appointment.duration || 60;
        document.getElementById('appointmentStatus').value = appointment.status || 'scheduled';
        document.getElementById('appointmentNotes').value = appointment.notes || '';
        
        // Меняем текст кнопки
        const form = document.getElementById('appointment-form');
        const submitBtn = document.getElementById('appointment-submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
        form.dataset.editId = id;
        
        // Обновляем заголовок
        updateFormTitles();
        
        // Переходим на форму
        showSection('add-appointment');
        showMessage('Заполнена форма для редактирования записи', 'info');
        
    } catch (error) {
        console.error('Ошибка загрузки записи для редактирования:', error);
        showMessage('Ошибка загрузки данных записи', 'error');
    }
}

// Завершение записи
async function completeAppointment(id) {
    try {
        const response = await fetch(`${API_BASE}/appointments/${id}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'completed' })
        });
        
        if (response.ok) {
            showMessage('Запись успешно завершена!', 'success');
            setTimeout(() => loadAppointments(), 500);
        } else {
            showMessage('Ошибка при завершении записи', 'error');
        }
    } catch (error) {
        console.error('Ошибка завершения записи:', error);
        showMessage('Ошибка сети при завершении записи', 'error');
    }
}

// Добавление отзыва
function addReview(trainerId) {
    // Создаем модальное окно для добавления отзыва
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-star"></i> Добавить отзыв</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="review-form">
                    <div class="form-group">
                        <label for="review-member">Клиент:</label>
                        <select id="review-member" required>
                            <option value="">Выберите клиента</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="review-rating">Рейтинг:</label>
                        <select id="review-rating" required>
                            <option value="5">5 - Отлично</option>
                            <option value="4">4 - Хорошо</option>
                            <option value="3">3 - Нормально</option>
                            <option value="2">2 - Плохо</option>
                            <option value="1">1 - Ужасно</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="review-comment">Комментарий:</label>
                        <textarea id="review-comment" rows="3" placeholder="Ваш отзыв..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn secondary" onclick="closeModal()">Отмена</button>
                <button class="btn primary" onclick="submitReview('${trainerId}')">Добавить отзыв</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Загружаем список клиентов
    loadMembersForReview();
}

// Редактирование отзыва
async function editReview(id) {
    try {
        const response = await fetch(`${API_BASE}/reviews/${id}`);
        const review = await response.json();
        
        if (!review) {
            showMessage('Отзыв не найден', 'error');
            return;
        }
        
        // Создаем модальное окно для редактирования отзыва
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-star"></i> Редактировать отзыв</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="review-edit-form">
                        <div class="form-group">
                            <label for="review-edit-member">Клиент:</label>
                            <select id="review-edit-member" required>
                                <option value="">Выберите клиента</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="review-edit-rating">Рейтинг:</label>
                            <select id="review-edit-rating" required>
                                <option value="5" ${review.rating === 5 ? 'selected' : ''}>5 - Отлично</option>
                                <option value="4" ${review.rating === 4 ? 'selected' : ''}>4 - Хорошо</option>
                                <option value="3" ${review.rating === 3 ? 'selected' : ''}>3 - Нормально</option>
                                <option value="2" ${review.rating === 2 ? 'selected' : ''}>2 - Плохо</option>
                                <option value="1" ${review.rating === 1 ? 'selected' : ''}>1 - Ужасно</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="review-edit-comment">Комментарий:</label>
                            <textarea id="review-edit-comment" rows="3" placeholder="Ваш отзыв...">${review.comment || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" onclick="closeModal()">Отмена</button>
                    <button class="btn primary" onclick="submitReviewEdit('${id}')">Сохранить изменения</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Загружаем список клиентов
        loadMembersForReviewEdit(review.memberId);
        
    } catch (error) {
        console.error('Ошибка загрузки отзыва для редактирования:', error);
        showMessage('Ошибка загрузки данных отзыва', 'error');
    }
}

// Загрузка клиентов для формы отзыва
async function loadMembersForReview() {
    try {
        const response = await fetch(`${API_BASE}/members`);
        const members = await response.json();
        
        const select = document.getElementById('review-member');
        select.innerHTML = '<option value="">Выберите клиента</option>';
        
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.fullName;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки клиентов для отзыва:', error);
    }
}

// Загрузка клиентов для формы редактирования отзыва
async function loadMembersForReviewEdit(selectedMemberId) {
    try {
        const response = await fetch(`${API_BASE}/members`);
        const members = await response.json();
        
        const select = document.getElementById('review-edit-member');
        select.innerHTML = '<option value="">Выберите клиента</option>';
        
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.fullName;
            if (member.id === selectedMemberId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки клиентов для отзыва:', error);
    }
}

// Отправка отзыва
async function submitReview(trainerId) {
    const memberId = document.getElementById('review-member').value;
    const rating = parseInt(document.getElementById('review-rating').value);
    const comment = document.getElementById('review-comment').value;
    
    if (!memberId) {
        showMessage('Выберите клиента', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                memberId,
                trainerId,
                rating,
                comment
            })
        });
        
        if (response.ok) {
            showMessage('Отзыв успешно добавлен!', 'success');
            closeModal();
            setTimeout(() => loadReviews(), 500);
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.error || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка добавления отзыва:', error);
        showMessage('Ошибка сети при добавлении отзыва', 'error');
    }
}

// Отправка редактированного отзыва
async function submitReviewEdit(reviewId) {
    const memberId = document.getElementById('review-edit-member').value;
    const rating = parseInt(document.getElementById('review-edit-rating').value);
    const comment = document.getElementById('review-edit-comment').value;
    
    if (!memberId) {
        showMessage('Выберите клиента', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                memberId,
                rating,
                comment
            })
        });
        
        if (response.ok) {
            showMessage('Отзыв успешно обновлен!', 'success');
            closeModal();
            setTimeout(() => loadReviews(), 500);
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.error || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка обновления отзыва:', error);
        showMessage('Ошибка сети при обновлении отзыва', 'error');
    }
}

// Закрытие модального окна
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Добавление/редактирование клиента
document.getElementById('member-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const isEditMode = form.dataset.editId;
    const memberId = isEditMode ? form.dataset.editId : null;
    
    const member = {
        fullName: document.getElementById('fullName').value,
        age: parseInt(document.getElementById('age').value) || 0,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        membershipType: document.getElementById('membershipType').value,
        trainerId: document.getElementById('trainerId').value || null,
        height: parseInt(document.getElementById('height').value) || 0,
        weight: parseInt(document.getElementById('weight').value) || 0,
        goals: document.getElementById('goals').value
            .split(',')
            .map(g => g.trim())
            .filter(g => g.length > 0),
        isActive: document.getElementById('isActive').checked
    };
    
    try {
        const url = isEditMode ? `${API_BASE}/members/${memberId}` : `${API_BASE}/members`;
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(member)
        });
        
        if (response.ok) {
            const message = isEditMode ? 'Клиент успешно обновлен!' : 'Клиент успешно добавлен!';
            showMessage(message, 'success');
            
            resetMemberForm();
            setTimeout(() => {
                showSection('members');
                loadMembers();
            }, 1500);
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.error || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка сохранения клиента:', error);
        showMessage('Ошибка сети при сохранении клиента', 'error');
    }
});

// Добавление/редактирование тренера
document.getElementById('trainer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const isEditMode = form.dataset.editId;
    const trainerId = isEditMode ? form.dataset.editId : null;
    
    const trainer = {
        fullName: document.getElementById('trainerFullName').value,
        specialization: document.getElementById('specialization').value,
        experienceYears: parseInt(document.getElementById('experienceYears').value) || 0,
        hourlyRate: parseInt(document.getElementById('hourlyRate').value) || 0,
        email: document.getElementById('trainerEmail').value,
        phone: document.getElementById('trainerPhone').value,
        certifications: document.getElementById('certifications').value
            .split(',')
            .map(c => c.trim())
            .filter(c => c.length > 0),
        bio: document.getElementById('bio').value,
        isAvailable: document.getElementById('isAvailable').checked
    };
    
    try {
        const url = isEditMode ? `${API_BASE}/trainers/${trainerId}` : `${API_BASE}/trainers`;
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(trainer)
        });
        
        if (response.ok) {
            const message = isEditMode ? 'Тренер успешно обновлен!' : 'Тренер успешно добавлен!';
            showMessage(message, 'success');
            
            resetTrainerForm();
            setTimeout(() => {
                showSection('trainers');
                loadTrainers();
            }, 1500);
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.error || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка сохранения тренера:', error);
        showMessage('Ошибка сети при сохранении тренера', 'error');
    }
});

// Добавление/редактирование записи
document.getElementById('appointment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const isEditMode = form.dataset.editId;
    const appointmentId = isEditMode ? form.dataset.editId : null;
    
    const appointment = {
        memberId: document.getElementById('appointmentMemberId').value,
        trainerId: document.getElementById('appointmentTrainerId').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        duration: parseInt(document.getElementById('appointmentDuration').value) || 60,
        status: document.getElementById('appointmentStatus').value,
        notes: document.getElementById('appointmentNotes').value
    };
    
    try {
        const url = isEditMode ? `${API_BASE}/appointments/${appointmentId}` : `${API_BASE}/appointments`;
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointment)
        });
        
        if (response.ok) {
            const message = isEditMode ? 'Запись успешно обновлена!' : 'Запись успешно добавлена!';
            showMessage(message, 'success');
            
            resetAppointmentForm();
            setTimeout(() => {
                showSection('appointments');
                loadAppointments();
            }, 1500);
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.error || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка сохранения записи:', error);
        showMessage('Ошибка сети при сохранении записи', 'error');
    }
});

// Удаление клиента
async function deleteMember(id) {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/members/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Клиент удален!', 'success');
            setTimeout(() => loadMembers(), 500);
        } else {
            showMessage('Ошибка при удалении клиента', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления клиента:', error);
        showMessage('Ошибка сети при удалении клиента', 'error');
    }
}

// Удаление тренера
async function deleteTrainer(id) {
    if (!confirm('Вы уверены, что хотите удалить этого тренера?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/trainers/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Тренер удален!', 'success');
            setTimeout(() => loadTrainers(), 500);
        } else {
            showMessage('Ошибка при удалении тренера', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления тренера:', error);
        showMessage('Ошибка сети при удалении тренера', 'error');
    }
}

// Удаление записи
async function deleteAppointment(id) {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/appointments/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Запись удалена!', 'success');
            setTimeout(() => loadAppointments(), 500);
        } else {
            showMessage('Ошибка при удалении записи', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления записи:', error);
        showMessage('Ошибка сети при удалении записи', 'error');
    }
}

// Удаление отзыва
async function deleteReview(id) {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/reviews/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Отзыв удален!', 'success');
            setTimeout(() => loadReviews(), 500);
        } else {
            showMessage('Ошибка при удалении отзыва', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления отзыва:', error);
        showMessage('Ошибка сети при удалении отзыва', 'error');
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем обработчики кнопок навигации
    document.querySelectorAll('.nav-btn').forEach((btn, index) => {
        const sections = ['dashboard', 'members', 'trainers', 'appointments', 'reviews', 'add-member', 'add-trainer', 'add-appointment'];
        if (sections[index]) {
            btn.setAttribute('data-section', sections[index]);
            btn.addEventListener('click', () => {
                showSection(sections[index]);
            });
        }
    });
    
    // Обработчики кнопок отмены
    document.getElementById('cancel-member-btn').addEventListener('click', () => {
        resetMemberForm();
        showSection('members');
    });
    
    document.getElementById('cancel-trainer-btn').addEventListener('click', () => {
        resetTrainerForm();
        showSection('trainers');
    });
    
    document.getElementById('cancel-appointment-btn').addEventListener('click', () => {
        resetAppointmentForm();
        showSection('appointments');
    });
    
    // Устанавливаем сегодняшнюю дату для фильтра записей
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
    
    // Показываем дашборд по умолчанию
    showSection('dashboard');
});