const { Post, Tag, Category, User } = require('../server/models');
const tagService = require('../server/services/tagService');

async function seedPendingPosts() {
  try {
    const devCategory = await Category.findOne({ where: { slug: 'development' } });
    const categoryId = devCategory ? devCategory.id : null;

    const user1 = await User.findOne({ where: { username: 'guskov_sergey' } });
    const user2 = await User.findOne({ where: { username: 'alexey_dev_134' } });

    const userId1 = user1 ? user1.id : 5;
    const userId2 = user2 ? user2.id : 4;

    // Post 1
    const existing1 = await Post.findOne({
      where: { title: 'Практическое руководство по методам Array.prototype в JavaScript' }
    });
    
    if (!existing1) {
      const post1Body = `# Практическое руководство по методам Array.prototype в JavaScript

Массивы — одна из самых базовых и часто используемых структур данных в JavaScript. Современный стандарт ECMAScript предоставляет богатый набор встроенных методов в \`Array.prototype\`, которые позволяют писать чистый, декларативный и читаемый код без использования громоздких циклов \`for\` и \`while\`.

В этом практическом руководстве мы разберем ключевые методы работы с массивами, разделенные по категориям их применения, с практической интерактивной визуализацией потока данных и готовыми кодовыми сниппетами.

![Схема потока данных в методах массива](/uploads/array_methods_cover.png)

---

## 📊 Общий поток обработки данных (Data Flow Pipeline)

При обработке коллекций в функциональном стиле методы массива легко соединяются в цепочки (chaining).

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│  Исходный массив: [{ id: 1, name: "Laptop", price: 1200 },  │
│                   { id: 2, name: "Mouse",  price: 25 },    │
│                   { id: 3, name: "Keyb",   price: 85 }]    │
└──────────────────────────────┬──────────────────────────────┘
                               │ .filter(item => item.price > 50)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Отфильтровано:   [{ id: 1, name: "Laptop", price: 1200 },  │
│                   { id: 3, name: "Keyb",   price: 85 }]    │
└──────────────────────────────┬──────────────────────────────┘
                               │ .map(item => item.price)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Цены товара:     [1200, 85]                                │
└──────────────────────────────┬──────────────────────────────┘
                               │ .reduce((sum, p) => sum + p, 0)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Итоговая сумма:  1285                                       │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 1. Трансформация данных: \`map()\` и \`flatMap()\`

### \`Array.prototype.map()\`
Создает новый массив с результатами вызова указанной функции для каждого элемента.

\`\`\`javascript
const users = [
  { id: 1, firstName: 'Иван', lastName: 'Иванов', role: 'admin' },
  { id: 2, firstName: 'Анна', lastName: 'Петрова', role: 'user' },
  { id: 3, firstName: 'Сергей', lastName: 'Смирнов', role: 'user' }
];

// Получаем список полных имен пользователей
const userFullNames = users.map(user => ({
  id: user.id,
  fullName: \`\${user.firstName} \${user.lastName}\`,
  isAdmin: user.role === 'admin'
}));

console.log(userFullNames);
/*
[
  { id: 1, fullName: 'Иван Иванов', isAdmin: true },
  { id: 2, fullName: 'Анна Петрова', isAdmin: false },
  { id: 3, fullName: 'Сергей Смирнов', isAdmin: false }
]
*/
\`\`\`

### \`Array.prototype.flatMap()\`
Сначала применяет функцию к каждому элементу, а затем плоская проекция формирует новый массив (эквивалент \`.map().flat(1)\`).

\`\`\`javascript
const orders = [
  { orderId: 101, items: ['Ноутбук', 'Мышь'] },
  { orderId: 102, items: ['Клавиатура'] },
  { orderId: 103, items: ['Монитор', 'Кабель HDMI', 'Коврики'] }
];

// Извлекаем единый плоский список всех купленных товаров
const allItems = orders.flatMap(order => order.items);

console.log(allItems);
// ['Ноутбук', 'Мышь', 'Клавиатура', 'Монитор', 'Кабель HDMI', 'Коврики']
\`\`\`

---

## 2. Фильтрация и поиск: \`filter()\`, \`find()\`, \`some()\`, \`every()\`

### \`Array.prototype.filter()\`
Возвращает новый массив со всеми элементами, прошедшими проверку в переданной функции.

\`\`\`javascript
const products = [
  { name: 'Монитор 4K', category: 'electronics', inStock: true, price: 45000 },
  { name: 'Мышь беспроводная', category: 'electronics', inStock: false, price: 1500 },
  { name: 'Клавиатура', category: 'electronics', inStock: true, price: 3500 },
  { name: 'Кофейная кружка', category: 'home', inStock: true, price: 500 }
];

// Находим товары в наличии из категории electronics дешевле 50000
const availableTech = products.filter(p => p.category === 'electronics' && p.inStock && p.price < 50000);

console.log(availableTech);
\`\`\`

### \`Array.prototype.find()\` и \`findIndex()\`
\`find()\` возвращает первый элемент, удовлетворяющий условию (или \`undefined\`), а \`findIndex()\` — его индекс.

\`\`\`javascript
const usersList = [
  { id: 'u_1', email: 'alex@dev.com', active: true },
  { id: 'u_2', email: 'sergey@dev.com', active: false },
  { id: 'u_3', email: 'kate@dev.com', active: true }
];

const foundUser = usersList.find(u => u.email === 'sergey@dev.com');
const userIndex = usersList.findIndex(u => u.id === 'u_3');

console.log(foundUser); // { id: 'u_2', email: 'sergey@dev.com', active: false }
console.log(userIndex); // 2
\`\`\`

### \`Array.prototype.some()\` и \`every()\`
- \`some()\` возвращает \`true\`, если **хотя бы один** элемент соответствует условию.
- \`every()\` возвращает \`true\`, если **все** элементы соответствуют условию.

\`\`\`javascript
const cart = [
  { name: 'Книга', price: 800, isDigital: true },
  { name: 'Курс', price: 3000, isDigital: true },
  { name: 'Футболка', price: 1500, isDigital: false }
];

const hasPhysicalItems = cart.some(item => !item.isDigital); // true
const isAllDigital = cart.every(item => item.isDigital);     // false
\`\`\`

---

## 3. Агрегация и сведение: \`reduce()\`

Метод \`reduce()\` применяет функцию-редуктор к каждому элементу массива (слева направо), возвращая одно итоговое значение.

### Схема работы \`reduce()\`:
\`\`\`
Начальное значение: accumulator = {}

Итерация 1 ('electronics'): acc = { electronics: 1 }
Итерация 2 ('home'):        acc = { electronics: 1, home: 1 }
Итерация 3 ('electronics'): acc = { electronics: 2, home: 1 }

Итоговый объект: { electronics: 2, home: 1 }
\`\`\`

### Практический пример: Группировка данных (Group By)

\`\`\`javascript
const transactions = [
  { id: 1, type: 'income', amount: 5000, category: 'Salary' },
  { id: 2, type: 'expense', amount: 1200, category: 'Groceries' },
  { id: 3, type: 'expense', amount: 300, category: 'Transport' },
  { id: 4, type: 'income', amount: 1500, category: 'Freelance' }
];

// Подсчет баланса и группировка по типам
const summary = transactions.reduce((acc, tx) => {
  if (tx.type === 'income') {
    acc.totalIncome += tx.amount;
  } else {
    acc.totalExpenses += tx.amount;
  }
  
  if (!acc.byCategory[tx.category]) {
    acc.byCategory[tx.category] = 0;
  }
  acc.byCategory[tx.category] += tx.amount;
  
  return acc;
}, { totalIncome: 0, totalExpenses: 0, byCategory: {} });

console.log(summary);
/*
{
  totalIncome: 6500,
  totalExpenses: 1500,
  byCategory: { Salary: 5000, Groceries: 1200, Transport: 300, Freelance: 1500 }
}
*/
\`\`\`

---

## 📊 Таблица сравнения популярнейших методов массива

| Метод | Изменяет исходный массив (Mutating)? | Возвращаемое значение | Быстрый вариант использования |
| :--- | :---: | :--- | :--- |
| \`map()\` | ❌ Нет | Новый массив той же длины | Преобразование элементов |
| \`filter()\` | ❌ Нет | Новый массив меньшей/равной длины | Фильтрация по критериям |
| \`reduce()\` | ❌ Нет | Аккумулятор (любой тип) | Подсчет сумм, группировка |
| \`forEach()\` | ❌ Нет | \`undefined\` | Побочные эффекты (side-effects) |
| \`slice()\` | ❌ Нет | Новый подмассив | Копирование / срез |
| \`splice()\` | ⚠️ **Да** | Удаленные элементы | Вставка / удаление по индексу |
| \`sort()\` | ⚠️ **Да** | Ссылка на исходный массив | Сортировка элементов |

---

## Заключение

Использование методов \`Array.prototype\` делает код более декларативным, предсказуемым и пригодным для тестирования. Понимание того, какие методы мутируют исходные данные, а какие возвращают новые структуры, критически важно для предотвращения скрытых багов в приложениях.`;

      const p1 = await Post.create({
        title: 'Практическое руководство по методам Array.prototype в JavaScript',
        body: post1Body,
        categoryId,
        featuredImage: 'array_methods_cover.png',
        userId: userId1,
        status: 'pending',
      });
      const tags1 = await tagService.findOrCreateTags('javascript, array-methods, webdev, functional-programming');
      await p1.setTags(tags1);
      console.log('Created Post 1 with ID:', p1.id);
    } else {
      console.log('Post 1 already exists ID:', existing1.id);
    }

    // Post 2
    const existing2 = await Post.findOne({
      where: { title: 'Как реализовать методы массива с нуля: пишем собственный Array.prototype' }
    });

    if (!existing2) {
      const post2Body = `# Как реализовать методы массива с нуля: пишем собственный Array.prototype

Глубокое понимание того, как устроены встроенные методы JavaScript, — важный шаг для каждого разработчика. В этой статье мы создадим собственную библиотеку полифилов для основных методов \`Array.prototype\` (\`myMap\`, \`myFilter\`, \`myReduce\`, \`myFlatMap\`, \`myFind\`, \`myEvery\`, \`mySome\`), учитывая контекст \`thisArg\`, обработку разреженных массивов (sparse arrays) и краевые случаи.

![Архитектура построения алгоритмов массивов](/uploads/implement_array_methods_cover.png)

---

## 🏗 Архитектурная схема прототипа (Prototype Architecture)

В JavaScript все массивы наследуются от \`Array.prototype\`. Добавляя метод в прототип, мы делаем его доступным на всех экземплярах массива.

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                       Array.prototype                       │
├─────────────────────────────────────────────────────────────┤
│  map(), filter(), reduce(), find(), slice()                 │
│                                                             │
│  [Наши собственный методы]:                                  │
│  ├── myMap(callback, thisArg)                               │
│  ├── myFilter(callback, thisArg)                            │
│  ├── myReduce(callback, initialValue)                       │
│  ├── myFlatMap(callback, thisArg)                           │
│  └── myFind(callback, thisArg)                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ Экземпляр массива (proto inheritance)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  const arr = [1, 2, 3];                                     │
│  arr.myMap(x => x * 2); // [2, 4, 6]                        │
└──────────────────────────────┴──────────────────────────────┘
\`\`\`

---

## 1. Реализация \`myMap\`

Стандартный \`map(callback(currentValue, index, array), thisArg)\` вызывает callback для каждого элемента и возвращает новый массив.

### Особенности реализации:
- Проверка, что \`this\` не является \`null\` или \`undefined\`.
- Проверка, что \`callback\` — это функция.
- Поддержка \`thisArg\` (передача контекста через \`callback.call(thisArg, ...)\`).
- Пропуск отсутствующих элементов (дыр) в разреженных массивах (\`i in this\`).

\`\`\`javascript
Array.prototype.myMap = function (callback, thisArg) {
  if (this == null) {
    throw new TypeError('Array.prototype.myMap called on null or undefined');
  }
  if (typeof callback !== 'function') {
    throw new TypeError(\`\${callback} is not a function\`);
  }

  const O = Object(this);
  const len = O.length >>> 0; // Приведение длины к 32-битному целому без знака
  const result = new Array(len);

  for (let i = 0; i < len; i++) {
    // Проверяем наличие ключа в объекте для корректной работы со разреженными массивами
    if (i in O) {
      result[i] = callback.call(thisArg, O[i], i, O);
    }
  }

  return result;
};

// Проверка:
const numbers = [1, 2, , 4]; // содержит разреженный элемент на индексе 2
const doubled = numbers.myMap(x => x * 2);
console.log(doubled); // [2, 4, empty, 8]
\`\`\`

---

## 2. Реализация \`myFilter\`

\`myFilter\` создает новый массив со всеми элементами, для которых \`callback\` вернул истинное значение (\`truthy\`).

\`\`\`javascript
Array.prototype.myFilter = function (callback, thisArg) {
  if (this == null) {
    throw new TypeError('Array.prototype.myFilter called on null or undefined');
  }
  if (typeof callback !== 'function') {
    throw new TypeError(\`\${callback} is not a function\`);
  }

  const O = Object(this);
  const len = O.length >>> 0;
  const result = [];

  for (let i = 0; i < len; i++) {
    if (i in O) {
      const val = O[i];
      if (callback.call(thisArg, val, i, O)) {
        result.push(val);
      }
    }
  }

  return result;
};

// Проверка:
const scores = [45, 80, 92, 30, 67];
const passedScores = scores.myFilter(score => score >= 70);
console.log(passedScores); // [80, 92]
\`\`\`

---

## 3. Реализация \`myReduce\`

\`myReduce\` аккумулирует значения слева направо. Важнейшая деталь — обработка начального значения (\`initialValue\`):
1. Если \`initialValue\` передан, свертка начинается с индекса \`0\`.
2. Если \`initialValue\` **не** передан, первым аккумулятором становится элемент с первым существующим индексом, а свертка начинается со следующего элемента.
3. Если массив пуст и \`initialValue\` не предоставлен — выбрасывается \`TypeError\`.

### Алгоритмический поток \`myReduce\`:

\`\`\`
┌────────────────────────────────────────────────────────────┐
│                    Вход: myReduce(cb, init)                │
└─────────────────────────────┬──────────────────────────────┘
                              │
               Is initialValue passed?
                 ├─── YES ───► accumulator = initialValue, startIndex = 0
                 └─── NO  ───► accumulator = arr[firstPresentIndex], startIndex = firstPresentIndex + 1
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│ Цикл for (i = startIndex; i < len; i++):                  │
│    accumulator = cb(accumulator, arr[i], i, arr)           │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
                      Return accumulator
\`\`\`

\`\`\`javascript
Array.prototype.myReduce = function (callback, initialValue) {
  if (this == null) {
    throw new TypeError('Array.prototype.myReduce called on null or undefined');
  }
  if (typeof callback !== 'function') {
    throw new TypeError(\`\${callback} is not a function\`);
  }

  const O = Object(this);
  const len = O.length >>> 0;
  let k = 0;
  let accumulator;

  if (arguments.length >= 2) {
    accumulator = initialValue;
  } else {
    // Ищем первый существующий индекс массива
    let kPresent = false;
    while (k < len && !(k in O)) {
      k++;
    }
    if (k >= len) {
      throw new TypeError('Reduce of empty array with no initial value');
    }
    accumulator = O[k++];
  }

  for (; k < len; k++) {
    if (k in O) {
      accumulator = callback(accumulator, O[k], k, O);
    }
  }

  return accumulator;
};

// Проверка:
const values = [10, 20, 30, 40];
const totalSum = values.myReduce((acc, curr) => acc + curr, 0);
console.log(totalSum); // 100
\`\`\`

---

## 4. Реализация \`myFlatMap\`

\`flatMap\` комбинирует вызов \`map\` и снижение вложенности на 1 уровень (\`flat(1)\`).

\`\`\`javascript
Array.prototype.myFlatMap = function (callback, thisArg) {
  if (this == null) {
    throw new TypeError('Array.prototype.myFlatMap called on null or undefined');
  }
  if (typeof callback !== 'function') {
    throw new TypeError(\`\${callback} is not a function\`);
  }

  const O = Object(this);
  const len = O.length >>> 0;
  const result = [];

  for (let i = 0; i < len; i++) {
    if (i in O) {
      const mappedValue = callback.call(thisArg, O[i], i, O);
      if (Array.isArray(mappedValue)) {
        result.push(...mappedValue);
      } else {
        result.push(mappedValue);
      }
    }
  }

  return result;
};

// Проверка:
const words = ["hello world", "custom array methods"];
const splitWords = words.myFlatMap(str => str.split(" "));
console.log(splitWords); // ['hello', 'world', 'custom', 'array', 'methods']
\`\`\`

---

## 5. Реализация \`myFind\`, \`myEvery\` и \`mySome\`

\`\`\`javascript
// myFind
Array.prototype.myFind = function (callback, thisArg) {
  if (this == null) throw new TypeError('Array.prototype.myFind called on null or undefined');
  if (typeof callback !== 'function') throw new TypeError(\`\${callback} is not a function\`);

  const O = Object(this);
  const len = O.length >>> 0;

  for (let i = 0; i < len; i++) {
    if (i in O) {
      if (callback.call(thisArg, O[i], i, O)) {
        return O[i];
      }
    }
  }
  return undefined;
};

// myEvery
Array.prototype.myEvery = function (callback, thisArg) {
  if (this == null) throw new TypeError('Array.prototype.myEvery called on null or undefined');
  if (typeof callback !== 'function') throw new TypeError(\`\${callback} is not a function\`);

  const O = Object(this);
  const len = O.length >>> 0;

  for (let i = 0; i < len; i++) {
    if (i in O) {
      if (!callback.call(thisArg, O[i], i, O)) {
        return false;
      }
    }
  }
  return true;
};

// mySome
Array.prototype.mySome = function (callback, thisArg) {
  if (this == null) throw new TypeError('Array.prototype.mySome called on null or undefined');
  if (typeof callback !== 'function') throw new TypeError(\`\${callback} is not a function\`);

  const O = Object(this);
  const len = O.length >>> 0;

  for (let i = 0; i < len; i++) {
    if (i in O) {
      if (callback.call(thisArg, O[i], i, O)) {
        return true;
      }
    }
  }
  return false;
};
\`\`\`

---

## 🧪 Комплексное тестирование всех кастомных методов

Запустим тест на соответствие поведения кастомных полифилов стандартным методам JavaScript:

\`\`\`javascript
const testData = [1, 2, 3, 4, 5];

// 1. myMap vs map
console.assert(
  JSON.stringify(testData.myMap(x => x * 3)) === JSON.stringify(testData.map(x => x * 3)),
  'myMap failed'
);

// 2. myFilter vs filter
console.assert(
  JSON.stringify(testData.myFilter(x => x % 2 === 0)) === JSON.stringify(testData.filter(x => x % 2 === 0)),
  'myFilter failed'
);

// 3. myReduce vs reduce
console.assert(
  testData.myReduce((acc, x) => acc + x, 10) === testData.reduce((acc, x) => acc + x, 10),
  'myReduce failed'
);

console.log('✅ Все тесты прототипов успешно пройдены!');
\`\`\`

---

## Резюме

Написание собственных полифилов помогает понять глубинную работу прототипов в JavaScript, особенности выравнивания типов (битовые сдвиги \`>>> 0\`), правила работы с разреженными массивами и тонкости вызова \`thisArg\`. Теперь эти методы готовы для тестирования модерации публикаций в админ-панели!`;

      const p2 = await Post.create({
        title: 'Как реализовать методы массива с нуля: пишем собственный Array.prototype',
        body: post2Body,
        categoryId,
        featuredImage: 'implement_array_methods_cover.png',
        userId: userId2,
        status: 'pending',
      });
      const tags2 = await tagService.findOrCreateTags('javascript, polyfills, algorithms, array-methods');
      await p2.setTags(tags2);
      console.log('Created Post 2 with ID:', p2.id);
    } else {
      console.log('Post 2 already exists ID:', existing2.id);
    }

  } catch (err) {
    console.error('Error seeding pending posts:', err);
  }
}

seedPendingPosts();
