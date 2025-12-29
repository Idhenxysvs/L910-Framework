# Банковская система

## Описание
Система управления клиентами и счетами банка на самописном Node.js фреймворке.

## API Endpoints

### Клиенты
- `GET /api/clients` - все клиенты
- `GET /api/clients/:id` - клиент по ID
- `POST /api/clients` - создать клиента
- `PUT /api/clients/:id` - обновить клиента
- `PATCH /api/clients/:id` - частично обновить клиента
- `DELETE /api/clients/:id` - удалить клиента

### Счета
- `GET /api/accounts` - все счета
- `GET /api/accounts/:id` - счет по ID
- `POST /api/accounts` - создать счет
- `PUT /api/accounts/:id` - обновить счет
- `PATCH /api/accounts/:id` - частично обновить счет
- `DELETE /api/accounts/:id` - удалить счет
- `POST /api/accounts/:id/deposit` - пополнить
- `POST /api/accounts/:id/withdraw` - снять

## Запуск
npm i
npm start