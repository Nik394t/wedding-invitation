// Раскадровка вскрытия конверта: серия кадров с отметкой времени после нажатия на печать.
// Запуск: node scripts/capture-opening.mjs [width height]
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173/'
const outDir = process.env.OUT_DIR ?? 'artifacts/screenshots/opening'
const width = Number(process.argv[2] ?? 390)
const height = Number(process.argv[3] ?? 844)

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)

await page.getByRole('button', { name: 'Открыть приглашение' }).click()
const started = Date.now()
const frames = []
while (Date.now() - started < 2300) {
  const at = Date.now() - started
  frames.push([at, await page.screenshot({ type: 'jpeg', quality: 80 })])
}
for (const [at, buffer] of frames) {
  await writeFile(`${outDir}/${width}-${String(at).padStart(4, '0')}ms.jpg`, buffer)
}
console.log(frames.map(([at]) => at).join(' '))
await browser.close()
