export const USD_TO_UAH = 41.5;

export const warehouses = [
  {
    name: 'Центральный склад',
    city: 'Киев',
    address: 'ул. Крещатик, 22',
    latitude: 50.4501,
    longitude: 30.5234,
  },
  {
    name: 'Склад «Днепр-Север»',
    city: 'Днепр',
    address: 'пр. Яворницкого, 75',
    latitude: 48.4647,
    longitude: 35.0462,
  },
  {
    name: 'Западный склад',
    city: 'Львов',
    address: 'ул. Городоцкая, 120',
    latitude: 49.8397,
    longitude: 24.0297,
  },
  {
    name: 'Склад «Слобожанский»',
    city: 'Харьков',
    address: 'пр. Науки, 14',
    latitude: 49.9935,
    longitude: 36.2304,
  },
  {
    name: 'Южный склад',
    city: 'Одесса',
    address: 'ул. Дерибасовская, 9',
    latitude: 46.4825,
    longitude: 30.7233,
  },
];

export const productTypes = [
  {
    name: 'Monitors',
    photo: '/products/monitors.svg',
    usd: [150, 900],
    titles: [
      'Dell UltraSharp U2723QE',
      'LG UltraGear 27GP850-B',
      'Samsung Odyssey G5 C32G55T',
      'ASUS ProArt PA278QV',
      'Philips 242V8LA',
      'AOC Q27G2U',
    ],
    specifications: ['27" IPS, 3840×2160', '24" IPS, 1920×1080', '32" VA, 2560×1440'],
  },
  {
    name: 'Laptops',
    photo: '/products/laptops.svg',
    usd: [600, 2500],
    titles: [
      'Lenovo ThinkPad T14 Gen 4',
      'Apple MacBook Air 13 M3',
      'ASUS ZenBook 14 OLED',
      'HP EliteBook 840 G10',
      'Dell Latitude 5440',
      'Acer Swift Go 14',
    ],
    specifications: [
      'Intel Core i7, 16 ГБ, 512 ГБ SSD',
      'Intel Core i5, 8 ГБ, 256 ГБ SSD',
      'Apple M3, 16 ГБ, 512 ГБ SSD',
    ],
  },
  {
    name: 'Phones',
    photo: '/products/phones.svg',
    usd: [300, 1200],
    titles: [
      'Apple iPhone 15',
      'Samsung Galaxy S24',
      'Google Pixel 8',
      'Xiaomi 14',
      'Motorola Edge 40',
    ],
    specifications: ['128 ГБ, 6.1"', '256 ГБ, 6.7"', '128 ГБ, 6.2"'],
  },
  {
    name: 'Printers',
    photo: '/products/printers.svg',
    usd: [150, 700],
    titles: [
      'HP LaserJet Pro M404dn',
      'Canon i-SENSYS MF453dw',
      'Epson EcoTank L3250',
      'Brother HL-L2350DW',
      'Xerox B230',
    ],
    specifications: ['Лазерный, ч/б, A4', 'Струйный, цветной, A4', 'МФУ лазерное, A4'],
  },
  {
    name: 'Keyboards',
    photo: '/products/keyboards.svg',
    usd: [30, 200],
    titles: [
      'Logitech MX Keys S',
      'Keychron K8 Pro',
      'Microsoft Ergonomic Keyboard',
      'Razer BlackWidow V4',
      'A4Tech Bloody B820R',
    ],
    specifications: [
      'Беспроводная, тихие клавиши',
      'Механическая, TKL',
      'Проводная, полноразмерная',
    ],
  },
  {
    name: 'Mice',
    photo: '/products/mice.svg',
    usd: [20, 150],
    titles: [
      'Logitech MX Master 3S',
      'Razer DeathAdder V3',
      'Logitech Lift Vertical',
      'Microsoft Arc Mouse',
      'SteelSeries Rival 3',
    ],
    specifications: ['Беспроводная, 8000 DPI', 'Проводная, 16000 DPI', 'Вертикальная, Bluetooth'],
  },
];

export const productGroups = [
  {
    title: 'Оборудование отдела продаж и работы с ключевыми клиентами',
    description: 'Рабочие места менеджеров и демонстрационная техника',
  },
  { title: 'Рабочие места бухгалтерии', description: 'Компьютеры и периферия финансового отдела' },
  {
    title: 'Техника для удалённых сотрудников',
    description: 'Комплекты, выдаваемые на руки для работы из дома',
  },
  {
    title: 'Переговорные комнаты главного офиса',
    description: 'Мониторы и устройства для конференций',
  },
  {
    title: 'Резервный фонд и подменное оборудование',
    description: 'Техника на замену во время ремонта',
  },
];

export const staff = [
  { name: 'Христорождественский Александр', email: 'a.khristorozhdestvensky@dzen.test' },
  { name: 'Коваленко Мария', email: 'm.kovalenko@dzen.test' },
  { name: 'Шевченко Дмитрий', email: 'd.shevchenko@dzen.test' },
  { name: 'Бондаренко Ольга', email: 'o.bondarenko@dzen.test' },
  { name: 'Ткаченко Сергей', email: 's.tkachenko@dzen.test' },
  { name: 'Кравченко Анна', email: 'a.kravchenko@dzen.test' },
  { name: 'Мельник Виктор', email: 'v.melnyk@dzen.test' },
  { name: 'Олейник Екатерина', email: 'e.oleynik@dzen.test' },
];

export const orderTitles = [
  'Поставка мониторов для отдела продаж',
  'Плановое обновление ноутбуков бухгалтерии',
  'Периферия для нового офиса во Львове',
  'Корпоративные смартфоны для менеджеров',
  'Оснащение переговорных комнат главного офиса',
  'Замена принтеров на складе в Днепре',
  'Длинное предлинное длиннючее название прихода с техникой для удалённой команды',
  'Резервный фонд техники на первый квартал',
  'Клавиатуры и мыши для колл-центра',
  'Ноутбуки для стажёров летнего набора',
  'Поставка по договору № 47/2025 от дистрибьютора',
  'Мониторы для дизайнеров и видеомонтажа',
  'Обновление парка МФУ в региональных филиалах',
  'Смартфоны для курьерской службы',
  'Комплекты для удалённых сотрудников: ноутбук, мышь, клавиатура',
  'Возврат техники из ремонта и подменный фонд',
  'Оборудование для открытия склада в Харькове',
  'Внеплановая закупка после аудита рабочих мест',
  'Поставка периферии по тендеру',
  'Ноутбуки для руководителей направлений',
  'Принтеры для бухгалтерии и юридического отдела',
  'Мониторы второго экрана для аналитиков',
  'Техника для нового офиса в Одессе',
  'Годовое обновление клавиатур и мышей',
  'Поставка демонстрационных образцов для выставки',
];

export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
