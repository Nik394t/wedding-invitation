import { expect, test, type Page } from '@playwright/test'

const openButton = (page: Page) => page.getByRole('button', { name: 'Открыть приглашение' })

async function openInvitation(page: Page) {
  await openButton(page).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('cover presents the letter with title, dates and one action', async ({ page }) => {
  const cover = page.getByRole('dialog', { name: 'Приглашение на нашу свадьбу' })
  await expect(cover).toBeVisible()
  await expect(cover.getByText('23 и 24 октября 2026')).toBeVisible()
  await expect(openButton(page)).toBeVisible()
  const box = await openButton(page).boundingBox()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test('opens with the pointer and exposes confirmed details', async ({ page }) => {
  await openInvitation(page)

  await expect(page.getByRole('heading', { level: 1, name: 'Дорогие родные и друзья!' })).toBeVisible()
  const main = page.getByRole('main')
  await expect(main.getByText('Когда-то мы были такими…')).toBeVisible()
  await expect(main.getByText(/приглашаем вас разделить с нами два особенных дня/)).toBeAttached()
  for (const fact of [
    'Роспись в ЗАГСе',
    'Венчание',
    'Церковь «Скиния Давида»',
    'г. Горячий Ключ, ул. Ленина, д. 195А',
    'г. Краснодар, ул. Вишняковой, 2А',
  ]) {
    await expect(main.getByText(fact, { exact: true }).first()).toBeAttached()
  }
  await expect(main.locator('time[datetime="2026-10-23T12:30:00+03:00"]')).toHaveText('12:30')
  await expect(main.locator('time[datetime="2026-10-24T16:00:00+03:00"]')).toHaveText('16:00')
  await expect(main.getByRole('img', { name: '23 октября 2026 года, пятница' })).toBeAttached()
  await expect(main.getByRole('img', { name: '24 октября 2026 года, суббота' })).toBeAttached()
  await expect(main.getByText(/палитре в стиле «пыльная роза»/)).toBeAttached()
  await expect(main.getByRole('heading', { name: 'Будем рады разделить эти дни с вами.' })).toBeAttached()
  await expect(page.getByText(/тили-тили/i)).toHaveCount(0)
})

test('opens from the keyboard, moves focus into the story and removes the cover', async ({ page }) => {
  await page.keyboard.press('Tab')
  await expect(openButton(page)).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.cover')).toHaveCount(0)
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page.getByRole('main')).not.toHaveAttribute('inert', /.*/)
  await expect(page.getByRole('main')).not.toHaveAttribute('aria-hidden', /.*/)
})

test('story is hidden from assistive technology while the cover is closed', async ({ page }) => {
  await expect(page.locator('main')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByRole('link', { name: /Открыть на карте/ })).toHaveCount(0)
})

test('background melody starts with the seal and can be switched off', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Звук', exact: true })
  const paused = () => page.evaluate(() => document.querySelector('audio')!.paused)

  await expect(toggle).toHaveCount(0)
  expect(await paused()).toBe(true)
  const melody = await page.request.get('/media/audio/love-divine.mp3')
  expect(melody.ok()).toBe(true)
  expect(melody.headers()['content-type']).toContain('audio')
  expect((await melody.body()).byteLength).toBeGreaterThan(200_000)

  await openInvitation(page)
  await expect(toggle).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(paused).toBe(false)
  expect(await page.evaluate(() => document.querySelector('audio')!.loop)).toBe(true)
  expect(await page.evaluate(() => document.querySelector('audio')!.volume)).toBeLessThanOrEqual(0.6)

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect.poll(paused).toBe(true)

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(paused).toBe(false)
  const box = (await toggle.boundingBox())!
  expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44)
})

test('object sounds are served and the story runs without script errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  for (const name of ['seal-crack', 'paper-rustle', 'paper-slide', 'foil-scratch']) {
    const response = await page.request.get(`/media/audio/sfx/${name}.mp3`)
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('audio')
  }

  await openInvitation(page)
  const foil = page.getByRole('button', { name: /Стереть серебро/ }).first()
  await foil.scrollIntoViewIfNeeded()
  const box = (await foil.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.55, { steps: 5 })
  await page.mouse.up()
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  await page.waitForTimeout(400)
  expect(errors).toEqual([])
})

test('the closing letter slides out of its envelope as the page scrolls', async ({ page }) => {
  await openInvitation(page)
  const letter = page.locator('.closing__letter')
  const offset = () => letter.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m42)

  await page.locator('.closing').evaluate((node) => {
    const top = node.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.98
    window.scrollTo({ top, behavior: 'instant' })
  })
  await expect.poll(offset).toBeGreaterThan(40)

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  await expect.poll(offset).toBeLessThan(30)
  await expect(page.getByRole('heading', { name: 'Будем рады разделить эти дни с вами.' })).toBeVisible()
})

test('both chapters show the same three days with the heart on their own date', async ({ page }) => {
  await openInvitation(page)
  const calendars = page.locator('.calendar')
  await expect(calendars).toHaveCount(2)
  for (const [index, active] of [
    [0, '23'],
    [1, '24'],
  ] as const) {
    const calendar = calendars.nth(index)
    await expect(calendar.locator('.calendar__number b')).toHaveText(['22', '23', '24'])
    await expect(calendar.locator('.calendar__weekday')).toHaveText(['четверг', 'пятница', 'суббота'])
    await expect(calendar.locator('.calendar__day--active b')).toHaveText(active)
    await expect(calendar.locator('.heart-ring')).toHaveCount(1)
  }
})

test('round and arched shapes keep their proportions and scratching holds the page still', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openInvitation(page)
  const shapes = await page.evaluate(() => {
    const ratio = (selector: string) =>
      [...document.querySelectorAll<HTMLElement>(selector)].map((node) => node.offsetWidth / node.offsetHeight)
    return {
      medals: ratio('.medal'),
      heroArch: ratio('.arch--hero .arch__mat'),
      churchArch: ratio('.arch--church .arch__mat'),
      envelope: ratio('.closing__envelope'),
      touchAction: getComputedStyle(document.querySelector('.medal__foil')!).touchAction,
    }
  })
  for (const value of shapes.medals) expect(value).toBeCloseTo(1, 2)
  expect(shapes.heroArch[0]).toBeCloseTo(4 / 5, 2)
  expect(shapes.churchArch[0]).toBeCloseTo(3 / 4, 2)
  expect(shapes.envelope[0]).toBeCloseTo(1 / 1.28, 2)
  expect(shapes.touchAction).toBe('none')

  // Стирание пальцем не должно прокручивать страницу.
  const foil = page.getByRole('button', { name: /Стереть серебро/ }).first()
  await foil.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => window.scrollY)
  const box = (await foil.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.8, { steps: 8 })
  await page.mouse.up()
  expect(await page.evaluate(() => window.scrollY)).toBe(before)
})

test('a stale cached page reloads itself once when a newer build is published', async ({ page }) => {
  const version = await (await page.request.get('/version.json')).json()
  expect(await page.locator('meta[name="build"]').getAttribute('content')).toBe(version.build)
  // Свежая страница себя не перезагружает.
  expect(new URL(page.url()).searchParams.get('v')).toBeNull()

  // Имитация старой копии в кэше: сервер сообщает о более новой сборке.
  await page.route('**/version.json*', (route) => route.fulfill({ json: { build: 'newer-build' } }))
  await page.goto('/')
  await expect.poll(() => new URL(page.url()).searchParams.get('v')).toBe('newer-build')
  await expect(page.getByRole('button', { name: 'Открыть приглашение' })).toBeVisible()
  // Повторной перезагрузки нет: защита от зацикливания.
  await page.waitForTimeout(700)
  expect(new URL(page.url()).searchParams.get('v')).toBe('newer-build')
  await openInvitation(page)
})

test('map links are safe external links to the confirmed addresses', async ({ page }) => {
  await openInvitation(page)
  const links = page.getByRole('link', { name: /Открыть на карте:/ })
  await expect(links).toHaveCount(2)
  const addresses = ['г. Горячий Ключ, ул. Ленина, д. 195А', 'г. Краснодар, ул. Вишняковой, 2А']
  for (let index = 0; index < 2; index += 1) {
    const link = links.nth(index)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
    await expect(link).toHaveAttribute(
      'href',
      `https://yandex.ru/maps/?text=${encodeURIComponent(addresses[index])}`,
    )
    const box = await link.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
})

test('silver medallions reveal the time by keyboard and by scratching', async ({ page }) => {
  await openInvitation(page)
  const foils = page.getByRole('button', { name: /Стереть серебро/ })
  await expect(foils).toHaveCount(2)

  await foils.first().focus()
  await page.keyboard.press('Enter')
  await expect(foils).toHaveCount(1)

  const foil = foils.first()
  await foil.scrollIntoViewIfNeeded()
  const box = (await foil.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3)
  await page.mouse.down()
  for (let row = 0; row < 5; row += 1) {
    const y = box.y + box.height * (0.25 + row * 0.13)
    await page.mouse.move(box.x + box.width * 0.85, y, { steps: 6 })
    await page.mouse.move(box.x + box.width * 0.15, y + box.height * 0.06, { steps: 6 })
  }
  await page.mouse.up()
  await expect(foils).toHaveCount(0)
  await expect(page.locator('.medal__time')).toHaveText(['12:30', '16:00'])
})

test('layout has no horizontal overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await openInvitation(page)
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
})

test('addresses and weekdays are set at 15px or larger', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await openInvitation(page)
  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll('address, .calendar__weekday, .dates__day span')].map((node) =>
      parseFloat(getComputedStyle(node).fontSize),
    ),
  )
  expect(sizes.length).toBeGreaterThanOrEqual(6)
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(15)
})

test('reduced motion keeps every fact and reveals the medallions without scratching', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await openInvitation(page)

  await expect(page.getByRole('button', { name: /Стереть серебро/ })).toHaveCount(0)
  await expect(page.locator('.medal__time')).toHaveText(['12:30', '16:00'])
  for (const heading of ['Дорогие родные и друзья!', 'Два дня', 'Будем ждать вас', 'Роспись в ЗАГСе', 'Венчание', 'Дресс-код']) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }
  await expect(page.getByRole('link', { name: /Открыть на карте:/ })).toHaveCount(2)
})

test('provided photographs are loaded and never stretched', async ({ page }) => {
  await openInvitation(page)

  const photos = [
    { alt: 'Жених и невеста в детстве', ratio: 1178 / 1181 },
    { alt: 'Здание ЗАГСа в Горячем Ключе', ratio: 1155 / 734 },
    { alt: 'Жених обнимает невесту, оба улыбаются', ratio: 1060 / 1181 },
  ]

  for (const photo of photos) {
    const image = page.getByRole('img', { name: photo.alt })
    await image.scrollIntoViewIfNeeded()
    await expect(image).toBeVisible()
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0)
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.currentSrc)).toContain('.webp')

    // Размер берётся из раскладки (offset*), чтобы лёгкий наклон открытки не влиял на замер.
    const state = await image.evaluate((node: HTMLImageElement) => ({
      natural: node.naturalWidth / node.naturalHeight,
      box: node.offsetWidth / node.offsetHeight,
      fit: getComputedStyle(node).objectFit,
    }))
    expect(state.natural).toBeCloseTo(photo.ratio, 1)
    // Пропорции сохраняются: либо рамка совпадает с кадром, либо кадр вписан через cover.
    const sameShape = Math.abs(state.box - state.natural) < 0.03
    expect(sameShape || state.fit === 'cover').toBe(true)
  }
})

test('the couple portrait leads the 24 October chapter on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openInvitation(page)
  const photo = page.getByRole('img', { name: 'Жених обнимает невесту, оба улыбаются' })
  await photo.scrollIntoViewIfNeeded()
  const box = (await photo.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(390 * 0.78)
  expect(box.height).toBeGreaterThanOrEqual(844 * 0.4)
  await expect(page.getByTestId('church-photo')).toBeVisible()
})
