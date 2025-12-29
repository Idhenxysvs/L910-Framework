const API_BASE = '/api';

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    if (sectionId === 'clients') loadClients();
    else if (sectionId === 'accounts') loadAccounts();
    else if (sectionId === 'add-account') loadClientsForSelect();
}

function showMessage(text, type = 'info') {
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 4000);
}

async function loadClients() {
    try {
        const response = await fetch(`${API_BASE}/clients`);
        const clients = await response.json();
        const container = document.getElementById('clients-container');
        container.innerHTML = '';
        
        if (clients.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет клиентов</p>';
            return;
        }
        
        clients.forEach(client => {
            const card = document.createElement('div');
            card.className = 'card';
            const typeText = {
                individual: 'Физ. лицо',
                business: 'Юр. лицо',
                vip: 'VIP'
            }[client.clientType] || client.clientType;
            
            card.innerHTML = `
                <h3><i class="fas fa-user"></i> ${client.fullName}</h3>
                <p><span class="info-label">Тип:</span> ${typeText}</p>
                <p><span class="info-label">Телефон:</span> ${client.phone}</p>
                <p><span class="info-label">Email:</span> ${client.email || 'Нет'}</p>
                <p><span class="info-label">Кредитный рейтинг:</span> ${client.creditRating}/100</p>
                <p><span class="info-label">Доход:</span> ${client.income.toLocaleString()}</p>
                <p><span class="info-label">Счетов:</span> ${client.accountIds?.length || 0}</p>
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteClient('${client.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editClient('${client.id}')">
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

async function loadAccounts() {
    try {
        const response = await fetch(`${API_BASE}/accounts`);
        const accounts = await response.json();
        const container = document.getElementById('accounts-container');
        container.innerHTML = '';
        
        if (accounts.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет счетов</p>';
            return;
        }
        
        for (const account of accounts) {
            const clientResponse = await fetch(`${API_BASE}/clients/${account.clientId}`);
            const client = await clientResponse.json();
            const clientName = client ? client.fullName : 'Неизвестный клиент';
            
            const card = document.createElement('div');
            card.className = 'card';
            const typeText = {
                checking: 'Расчетный',
                savings: 'Накопительный',
                credit: 'Кредитный',
                deposit: 'Депозитный'
            }[account.accountType] || account.accountType;
            
            card.innerHTML = `
                <h3><i class="fas fa-credit-card"></i> ${typeText}</h3>
                <p><span class="info-label">Номер:</span> <span class="account-number">${account.accountNumber}</span></p>
                <p><span class="info-label">Клиент:</span> ${clientName}</p>
                <p><span class="info-label">Баланс:</span> <span class="balance">${account.balance.toLocaleString()} ${account.currency}</span></p>
                <p><span class="info-label">Ставка:</span> ${account.interestRate}%</p>
                <p><span class="info-label">Открыт:</span> ${new Date(account.openingDate).toLocaleDateString('ru-RU')}</p>
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="deleteAccount('${account.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button class="action-btn edit-btn" onclick="editAccount('${account.id}')">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="action-btn operations-btn" onclick="showAccountOperations('${account.id}')">
                        <i class="fas fa-exchange-alt"></i> Операции
                    </button>
                </div>
            `;
            container.appendChild(card);
        }
    } catch (error) {
        console.error('Ошибка загрузки счетов:', error);
        showMessage('Ошибка загрузки счетов', 'error');
    }
}

async function loadClientsForSelect() {
    try {
        const response = await fetch(`${API_BASE}/clients`);
        const clients = await response.json();
        const select = document.getElementById('clientSelect');
        select.innerHTML = '<option value="">Выберите клиента</option>';
        
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.fullName} (${client.passport})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки клиентов для выбора:', error);
    }
}

async function deleteClient(id) {
    if (!confirm('Удалить клиента?')) return;
    try {
        const response = await fetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showMessage('Клиент удален', 'success');
            loadClients();
        } else {
            showMessage('Ошибка удаления', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления клиента:', error);
        showMessage('Ошибка сети', 'error');
    }
}

async function deleteAccount(id) {
    if (!confirm('Удалить счет?')) return;
    try {
        const response = await fetch(`${API_BASE}/accounts/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showMessage('Счет удален', 'success');
            loadAccounts();
        } else {
            showMessage('Ошибка удаления', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления счета:', error);
        showMessage('Ошибка сети', 'error');
    }
}

async function editClient(clientId) {
    try {
        const response = await fetch(`${API_BASE}/clients/${clientId}/edit-form`);
        const data = await response.json();
        
        if (data.success) {
            const existingForm = document.querySelector('.edit-form-container');
            if (existingForm) existingForm.remove();
            
            document.body.insertAdjacentHTML('beforeend', data.formHtml);
            
            document.querySelector('.edit-form-container').scrollIntoView({ behavior: 'smooth' });
            
            document.getElementById('edit-client-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await submitEditClient(clientId);
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки формы редактирования:', error);
        showMessage('Ошибка загрузки формы', 'error');
    }
}

async function submitEditClient(clientId) {
    const form = document.getElementById('edit-client-form');
    if (!form) return;
    
    const clientData = {
        fullName: document.getElementById('edit-fullName').value,
        clientType: document.getElementById('edit-clientType').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/clients/${clientId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });
        
        if (response.ok) {
            showMessage('Клиент успешно обновлен', 'success');
            closeEditForm();
            loadClients();
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка обновления клиента:', error);
        showMessage('Ошибка сети', 'error');
    }
}

async function editAccount(accountId) {
    try {
        const response = await fetch(`${API_BASE}/accounts/${accountId}`);
        const account = await response.json();
        
        if (account) {
            const existingForm = document.querySelector('.edit-form-container');
            if (existingForm) existingForm.remove();
            
            document.body.insertAdjacentHTML('beforeend', `
                <div class="edit-form-container">
                    <div class="edit-form">
                        <h3><i class="fas fa-credit-card"></i> Редактирование счета</h3>
                        <form id="edit-account-form">
                            <div class="form-group">
                                <label>Процентная ставка (%):</label>
                                <input type="number" id="edit-interestRate" value="${account.interestRate}" min="0" max="100" step="0.1">
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="edit-isActive" ${account.isActive ? 'checked' : ''}>
                                    Активный счет
                                </label>
                            </div>
                            <div class="form-actions">
                                <button type="button" onclick="closeEditForm()" class="btn danger">Отмена</button>
                                <button type="submit" class="btn success">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            `);
            
            document.querySelector('.edit-form-container').scrollIntoView({ behavior: 'smooth' });
            
            document.getElementById('edit-account-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await submitEditAccount(accountId);
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки формы редактирования:', error);
        showMessage('Ошибка загрузки формы', 'error');
    }
}

async function submitEditAccount(accountId) {
    const accountData = {
        interestRate: parseFloat(document.getElementById('edit-interestRate').value) || 0,
        isActive: document.getElementById('edit-isActive').checked
    };
    
    try {
        const response = await fetch(`${API_BASE}/accounts/${accountId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData)
        });
        
        if (response.ok) {
            showMessage('Счет успешно обновлен', 'success');
            closeEditForm();
            loadAccounts();
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка обновления счета:', error);
        showMessage('Ошибка сети', 'error');
    }
}

function closeEditForm() {
    const form = document.querySelector('.edit-form-container');
    if (form) form.remove();
}

let currentAccountId = null;
let currentOperationType = null;

async function showAccountOperations(accountId) {
    currentAccountId = accountId;
    try {
        const response = await fetch(`${API_BASE}/accounts/${accountId}`);
        const account = await response.json();
        const clientResponse = await fetch(`${API_BASE}/clients/${account.clientId}`);
        const client = await clientResponse.json();
        
        document.getElementById('selected-account-info').innerHTML = `
            <h3><i class="fas fa-credit-card"></i> Счет ${account.accountNumber}</h3>
            <p><strong>Клиент:</strong> ${client.fullName}</p>
            <p><strong>Баланс:</strong> <span class="balance">${account.balance.toLocaleString()} ${account.currency}</span></p>
            <p><strong>Тип:</strong> ${account.accountType}</p>
        `;
        
        const transactionsList = document.getElementById('transactions-list');
        transactionsList.innerHTML = '<h3>Последние операции:</h3>';
        
        if (account.transactions && account.transactions.length > 0) {
            account.transactions.slice(-5).reverse().forEach(transaction => {
                const item = document.createElement('div');
                item.className = `transaction-item ${transaction.type}`;
                item.innerHTML = `
                    <p><strong>${new Date(transaction.date).toLocaleString('ru-RU')}</strong></p>
                    <p>${transaction.description}</p>
                    <p>${transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toLocaleString()} ${account.currency}</p>
                    <p>Остаток: ${transaction.balanceAfter.toLocaleString()} ${account.currency}</p>
                `;
                transactionsList.appendChild(item);
            });
        } else {
            transactionsList.innerHTML += '<p>Операций нет</p>';
        }
        
        showSection('account-operations');
    } catch (error) {
        console.error('Ошибка загрузки операций:', error);
        showMessage('Ошибка загрузки данных счета', 'error');
    }
}

function showDepositForm() {
    currentOperationType = 'deposit';
    document.getElementById('operation-form').style.display = 'block';
    document.getElementById('operationAmount').focus();
}

function showWithdrawForm() {
    currentOperationType = 'withdraw';
    document.getElementById('operation-form').style.display = 'block';
    document.getElementById('operationAmount').focus();
}

function cancelOperation() {
    document.getElementById('operation-form').style.display = 'none';
    document.getElementById('operation-form').reset();
}

document.getElementById('client-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const client = {
        fullName: document.getElementById('fullName').value,
        passport: document.getElementById('passport').value,
        clientType: document.getElementById('clientType').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value || undefined,
        address: document.getElementById('address').value || undefined,
        income: parseFloat(document.getElementById('income').value) || 0,
        isActive: document.getElementById('isActive').checked
    };
    
    try {
        const response = await fetch(`${API_BASE}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        
        if (response.ok) {
            showMessage('Клиент добавлен', 'success');
            document.getElementById('client-form').reset();
            setTimeout(() => showSection('clients'), 1500);
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка добавления клиента:', error);
        showMessage('Ошибка сети', 'error');
    }
});

document.getElementById('account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const account = {
        clientId: document.getElementById('clientSelect').value,
        accountType: document.getElementById('accountType').value,
        currency: document.getElementById('currency').value,
        balance: parseFloat(document.getElementById('initialBalance').value),
        interestRate: parseFloat(document.getElementById('interestRate').value) || 0,
        isActive: document.getElementById('accountActive').checked
    };
    
    try {
        const response = await fetch(`${API_BASE}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(account)
        });
        
        if (response.ok) {
            showMessage('Счет открыт', 'success');
            document.getElementById('account-form').reset();
            setTimeout(() => showSection('accounts'), 1500);
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка открытия счета:', error);
        showMessage('Ошибка сети', 'error');
    }
});

document.getElementById('operation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentAccountId || !currentOperationType) return;
    
    const operation = {
        amount: parseFloat(document.getElementById('operationAmount').value),
        description: document.getElementById('operationDescription').value || 
                   (currentOperationType === 'deposit' ? 'Пополнение' : 'Снятие')
    };
    
    try {
        const endpoint = currentOperationType === 'deposit' ? 'deposit' : 'withdraw';
        const response = await fetch(`${API_BASE}/accounts/${currentAccountId}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(operation)
        });
        
        if (response.ok) {
            const message = currentOperationType === 'deposit' ? 'Счет пополнен' : 'Средства сняты';
            showMessage(message, 'success');
            document.getElementById('operation-form').reset();
            document.getElementById('operation-form').style.display = 'none';
            showAccountOperations(currentAccountId);
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка операции:', error);
        showMessage('Ошибка сети', 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-btn').forEach((btn, index) => {
        const sections = ['clients', 'accounts', 'add-client', 'add-account'];
        if (sections[index]) {
            btn.setAttribute('data-section', sections[index]);
            btn.addEventListener('click', () => showSection(sections[index]));
        }
    });
    showSection('clients');
});