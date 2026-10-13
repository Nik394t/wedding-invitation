/** Путь к файлу из public/ с учётом базы сборки (корень домена или подпапка). */
const media = (path: string) => `${import.meta.env.BASE_URL}media/${path}`

export type WeddingEvent = {
  id: 'registry' | 'church'
  dateIso: string
  day: string
  month: string
  year: string
  weekday: string
  time: string
  title: string
  /** Часть названия для каллиграфии и хвост, который набирается антиквой. */
  titleScript: string
  titleTail?: string
  ceremony: string
  place: string
  venue?: string
  address: string
  image: {
    avif: string
    webp: string
    fallback: string
    width: number
    height: number
    alt: string
  }
  calendar: Array<{ weekday: string; day: string; active?: boolean }>
}

/*
 * Все фразы приглашения собраны здесь и читаются как одно письмо:
 * обращение → подпись к детскому фото → приглашение → два дня → дресс-код → прощание.
 * Подпись к фото и вступление — одно предложение, разорванное фотографией.
 */
export const invitation = {
  title: 'Приглашение на нашу свадьбу',
  dates: '23 и 24 октября 2026',
  openLabel: 'Открыть приглашение',
  greeting: 'Дорогие родные и друзья!',
  intro: '…а теперь выросли и приглашаем вас разделить с нами два особенных дня, когда мы станем семьёй.',
  scrollHint: 'листайте',
  times: {
    title: 'Два дня',
    hint: 'Сотрите серебро, чтобы узнать время',
  },
  days: {
    title: 'Будем ждать вас',
    lead: 'в пятницу — в ЗАГСе, в субботу — в церкви',
  },
  mapLabel: 'Открыть на карте',
  // Фоновая мелодия: напев HYFRYDOL (Р. Причард, 1830, общественное достояние), на который
  // поют гимн о любви «Love Divine, All Loves Excelling». Файл собирает scripts/make-music.py.
  // Чтобы поставить свою запись, замените mp3-файл или путь ниже.
  music: {
    src: media('audio/love-divine.mp3'),
    volume: 0.6,
    label: 'Звук',
    turnOn: 'Включить звук',
    turnOff: 'Выключить звук',
  },
  childhood: {
    caption: 'Когда-то мы были такими…',
    image: {
      avif: media('optimized/childhood.avif'),
      webp: media('optimized/childhood.webp'),
      fallback: media('originals/childhood.jpg'),
      width: 1178,
      height: 1181,
      alt: 'Жених и невеста в детстве',
    },
  },
  events: [
    {
      id: 'registry',
      dateIso: '2026-10-23T12:30:00+03:00',
      day: '23',
      month: 'Октябрь',
      year: '2026',
      weekday: 'пятница',
      time: '12:30',
      title: 'Роспись в ЗАГСе',
      titleScript: 'Роспись',
      titleTail: 'в ЗАГСе',
      ceremony: 'роспись',
      place: 'Горячий Ключ',
      address: 'г. Горячий Ключ, ул. Ленина, д. 195А',
      image: {
        avif: media('optimized/registry-office.avif'),
        webp: media('optimized/registry-office.webp'),
        fallback: media('originals/registry-office.jpg'),
        width: 1155,
        height: 734,
        alt: 'Здание ЗАГСа в Горячем Ключе',
      },
      calendar: [
        { weekday: 'четверг', day: '22' },
        { weekday: 'пятница', day: '23', active: true },
        { weekday: 'суббота', day: '24' },
      ],
    },
    {
      id: 'church',
      dateIso: '2026-10-24T16:00:00+03:00',
      day: '24',
      month: 'Октябрь',
      year: '2026',
      weekday: 'суббота',
      time: '16:00',
      title: 'Венчание',
      titleScript: 'Венчание',
      ceremony: 'венчание',
      place: 'Краснодар',
      venue: 'Церковь «Скиния Давида»',
      address: 'г. Краснодар, ул. Вишняковой, 2А',
      image: {
        avif: media('optimized/couple.avif'),
        webp: media('optimized/couple.webp'),
        fallback: media('originals/couple.jpg'),
        width: 1060,
        height: 1181,
        alt: 'Жених обнимает невесту, оба улыбаются',
      },
      calendar: [
        { weekday: 'пятница', day: '23' },
        { weekday: 'суббота', day: '24', active: true },
        { weekday: 'воскресенье', day: '25' },
      ],
    },
  ] satisfies WeddingEvent[],
  dressCode: {
    title: 'Дресс-код',
    lead: 'Атмосфера нашей свадьбы наполнена лёгким винтажным шармом и романтикой прошлых эпох.',
    body: 'Будем искренне признательны, если при выборе праздничного образа вы отдадите предпочтение палитре в стиле «пыльная роза»: приглушённым розовым, пудровым, серо-розовым и мягким пастельным оттенкам.',
  },
  closing: 'Будем рады разделить эти дни с вами.',
} as const
