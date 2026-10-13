// Снимает ключевые сцены приглашения. Запуск: node scripts/capture.mjs [mobile desktop small tablet]
// BASE_URL по умолчанию — preview-сборка (npm run preview -- --host 127.0.0.1).
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173/'
const outDir = process.env.OUT_DIR ?? 'artifacts/screenshots'

const allCaptures = {
  small: { width: 320, height: 568, scale: 2 },
  mobile: { width: 390, height: 844, scale: 2 },
  tablet: { width: 768, height: 1024, scale: 1 },
  desktop: { width: 1440, height: 900, scale: 1 },
}
const wanted = process.argv.slice(2)
const names = wanted.length ? wanted : Object.keys(allCaptures)

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()

for (const name of names) {
  const capture = allCaptures[name]
  const context = await browser.newContext({
    viewport: { width: capture.width, height: capture.height },
    deviceScaleFactor: capture.scale,
    hasTouch: capture.width < 800,
  })
  const page = await context.newPage()
  const shot = (scene) => page.screenshot({ path: `${outDir}/${name}-${scene}.png` })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  await shot('01-cover')

  await page.getByRole('button', { name: 'Открыть приглашение' }).click()
  await page.waitForTimeout(430)
  await shot('02-opening-a')
  await page.waitForTimeout(330)
  await shot('03-opening-b')
  await page.waitForTimeout(2600)
  await shot('04-hero')

  // Прокрутить всю страницу, чтобы сработали все появления.
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let top = 0; top < pageHeight; top += Math.round(capture.height * 0.6)) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top)
    await page.waitForTimeout(160)
  }
  await page.waitForTimeout(1500)

  const scenes = [
    ['05-dates-foil', '#dates-title', 0.12],
    ['07-registry', '#registry-title', 0.3],
    ['08-registry-photo', '.postcard', 0.12],
    ['09-church', '#church-title', 0.3],
    ['10-church-photo', '.arch--church', 0.06],
    ['11-dress', '#dress-title', 0.1],
    ['12-closing', '.closing__envelope', 0.14],
  ]
  for (const [scene, selector, offset] of scenes) {
    await page.evaluate(
      ([sel, share]) => {
        const node = document.querySelector(sel)
        const top = node.getBoundingClientRect().top + window.scrollY - window.innerHeight * share
        window.scrollTo({ top, behavior: 'instant' })
      },
      [selector, offset],
    )
    await page.waitForTimeout(350)
    await shot(scene)
    if (scene === '05-dates-foil') {
      for (const foil of await page.getByRole('button', { name: /Стереть серебро/ }).all()) {
        await foil.click()
      }
      await page.waitForTimeout(900)
      await shot('06-dates-open')
    }
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${outDir}/${name}-full.png`, fullPage: true })
  await context.close()
}

await browser.close()
