console.log("Запуск ShopingMall 'Kristall' ");
console.log('\n- Mall_HUB: ✅')
require('./mall_hub/server.js');

setTimeout(() => {
    console.log('\n- ConcertsFlow: ✅')
    require('./departments/concerts/src/server.js');
}, 1000);

setTimeout(() => {
    console.log(`
КОНФИГУРАЦИЯ ShoppingMall Project L9-10 Web:
===========================================================
Mall_HUB Kristall:                  http://localhost:3000
Кинотеатр '':                       http://localhost:3001
Тренажёрный зал 'СИЛАЧ':            http://localhost:3002
Раписание концертов 'ConcertFlow':  http://localhost:3003
Банк '':                            http://localhost:3004
===========================================================

|  ИНФОРМАЦИЯ ПО ПРОЕКТУ И ЕГО РАЗРАБОТЧИКАХ В README.md  |
`);
}, 2000);