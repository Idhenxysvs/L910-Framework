console.log('|=================================================================|');
console.log('|                Запуск ShopingMall "Kristall"                    |');
console.log('\n- Mall_HUB: ✅')
require('./mall_hub/server.js');

setTimeout(() => {
    console.log('\n- Absolute cinema: ✅')
    require('./departments/cinema/server.js');
}, 1000);

setTimeout(() => {
    console.log('\n- Силач: ✅')
    require('./departments/gym/src/server.js');
}, 1000);

setTimeout(() => {
    console.log('\n- ConcertFlow: ✅')
    require('./departments/concerts/src/server.js');
}, 1000);

setTimeout(() => {
    console.log('\n- Сайт банка: ✅')
    require('./departments/bank/src/server.js');
}, 1000);

setTimeout(() => {
    console.log(`
|          КОНФИГУРАЦИЯ ShoppingMall Project L9-10 Web:           |
|=================================================================|
|🏬 Mall_HUB Kristall:                   http://localhost:3000    |
|🎥 Кинотеатр 'Absolute cinema':         http://localhost:3001    |
|🥊 Тренажёрный зал 'СИЛАЧ':             http://localhost:3002    |
|📅 Раписание концертов 'ConcertFlow':   http://localhost:3003    |
|🏦 Сайт банка:                          http://localhost:3004    |
|=================================================================|
| ИНФОРМАЦИЯ ПО ПРОЕКТУ И РАЗРАБОТЧИКАХ В shopping_mall/README.md |
`);
}, 2000);