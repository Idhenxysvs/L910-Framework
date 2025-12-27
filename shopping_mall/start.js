console.log('Запуск ShopingMall Project ');
console.log('\n- Mall_HUB запущен: ✅')
require('./mall_hub/server.js');

setTimeout(() => {
    console.log('\n- ConcertsManager запущен: ✅')
    require('./departments/concerts/src/server.js');
}, 1000);

setTimeout(() => {
    console.log(`
КОНФИГУРАЦИЯ ShoppingMall Project:

Mall_HUB:       http://localhost:3000
Кинотеатр:      http://localhost:3001
ТЗ 'СИЛАЧ':     http://localhost:3002
ConcertFlow:    http://localhost:3003
Банк МММ:       http://localhost:3004

=========================
`);
}, 2000);