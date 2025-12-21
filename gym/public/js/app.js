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
    if (sectionId === 'members') {
        loadMembers();
    } else if (sectionId === 'trainers') {
        loadTrainers();
    } else if (sectionId === 'add-member') {
        loadTrainersForSelect();
    }
}

// Обновление заголовков форм
function updateFormTitles() {
    const memberForm = document.getElementById('member-form');
    const trainerForm = document.getElementById('trainer-form');
    
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
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
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
                </div>
            `;
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки тренеров:', error);
        showMessage('Ошибка загрузки тренеров', 'error');
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
                <p><span class="active-member">
                    <i class="fas fa-user-check"></i> ДОСТУПЕН ДЛЯ НОВЫХ КЛИЕНТОВ
                </span></p>
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteTrainer('${trainer.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editTrainer('${trainer.id}')">
                        <i class="fas fa-edit"></i> Редактировать
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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем обработчики кнопок навигации
    document.querySelectorAll('.nav-btn').forEach((btn, index) => {
        const sections = ['members', 'trainers', 'add-member', 'add-trainer'];
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
    
    // Показываем секцию клиентов по умолчанию
    showSection('members');
});