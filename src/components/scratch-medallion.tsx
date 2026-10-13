import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { sound } from '../lib/sound'

type ScratchMedallionProps = {
  /** Что откроется под серебром — для подписи кнопки. */
  label: string
  children: ReactNode
}

type Phase = 'foil' | 'fading' | 'open'

const HEART = [
  [0.5, 0.66],
  [0.3, 0.5, 0.31, 0.36, 0.41, 0.36],
  [0.46, 0.36, 0.49, 0.39, 0.5, 0.43],
  [0.51, 0.39, 0.54, 0.36, 0.59, 0.36],
  [0.69, 0.36, 0.7, 0.5, 0.5, 0.66],
] as const

function traceHeart(ctx: CanvasRenderingContext2D, size: number, dx: number, dy: number) {
  ctx.beginPath()
  ctx.moveTo(HEART[0][0] * size + dx, HEART[0][1] * size + dy)
  for (const [a, b, c, d, e, f] of HEART.slice(1) as ReadonlyArray<readonly number[]>) {
    ctx.bezierCurveTo(a * size + dx, b * size + dy, c * size + dx, d * size + dy, e * size + dx, f * size + dy)
  }
}

function paintFoil(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = canvas.width

  const sheen = ctx.createLinearGradient(0, 0, size, size)
  sheen.addColorStop(0, '#ebe8e6')
  sheen.addColorStop(0.26, '#b4aeac')
  sheen.addColorStop(0.5, '#f5f3f1')
  sheen.addColorStop(0.74, '#a49e9c')
  sheen.addColorStop(1, '#d9d5d3')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, size, size)

  // Шлифованный металл: тонкие горизонтальные штрихи и зерно с фиксированным зерном генератора.
  let seed = 20261023
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  for (let y = 0; y < size; y += 2) {
    ctx.fillStyle = `rgba(255,255,255,${(random() * 0.1).toFixed(3)})`
    ctx.fillRect(0, y, size, 1)
  }
  for (let index = 0; index < size * 5; index += 1) {
    ctx.fillStyle = `rgba(70,62,60,${(0.04 + random() * 0.1).toFixed(3)})`
    ctx.fillRect(random() * size, random() * size, 1.2, 1.2)
  }

  // Оттиснутое сердце.
  ctx.lineWidth = Math.max(1.5, size * 0.012)
  ctx.lineJoin = 'round'
  traceHeart(ctx, size, -1.2, -1.4)
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'
  ctx.stroke()
  traceHeart(ctx, size, 1.2, 1.5)
  ctx.strokeStyle = 'rgba(84,76,74,0.42)'
  ctx.stroke()
}

export function ScratchMedallion({ label, children }: ScratchMedallionProps) {
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('foil')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const faceRef = useRef<HTMLDivElement>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const travelled = useRef(0)
  const moves = useRef(0)
  const lastMoveAt = useRef(0)
  const revealed = phase !== 'foil' || Boolean(reduceMotion)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const side = Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2))
    canvas.width = side
    canvas.height = side
    paintFoil(canvas)
  }, [reduceMotion])

  function finish(moveFocus: boolean) {
    if (phase !== 'foil') return
    sound.scratchStop()
    setPhase('fading')
    window.setTimeout(() => {
      setPhase('open')
      if (moveFocus) faceRef.current?.focus({ preventScroll: true })
    }, 520)
  }

  function pointOf(event: ReactPointerEvent<HTMLButtonElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width
    return { x: (event.clientX - rect.left) * scale, y: (event.clientY - rect.top) * scale }
  }

  function scratch(to: { x: number; y: number }) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const from = last.current ?? to
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = canvas.width * 0.24
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x + 0.01, to.y + 0.01)
    ctx.stroke()
    travelled.current += Math.hypot(to.x - from.x, to.y - from.y)
    last.current = to
  }

  function clearedShare() {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const probe = document.createElement('canvas')
    probe.width = 24
    probe.height = 24
    const ctx = probe.getContext('2d', { willReadFrequently: true })
    if (!ctx) return 0
    ctx.drawImage(canvas, 0, 0, 24, 24)
    const { data } = ctx.getImageData(0, 0, 24, 24)
    let clear = 0
    for (let index = 3; index < data.length; index += 4) if (data[index] < 80) clear += 1
    return clear / (data.length / 4)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    const point = pointOf(event)
    if (!point) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    last.current = null
    travelled.current = 0
    lastMoveAt.current = event.timeStamp
    sound.unlock()
    sound.scratchStart()
    scratch(point)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!last.current) return
    const point = pointOf(event)
    if (!point) return
    const canvas = canvasRef.current
    if (canvas) {
      // Скорость в долях медальона за 100 мс: быстрый штрих звучит громче и выше.
      const elapsed = Math.max(event.timeStamp - lastMoveAt.current, 1)
      const distance = Math.hypot(point.x - last.current.x, point.y - last.current.y) / canvas.width
      sound.scratchMove((distance / elapsed) * 100 * 2.2)
      lastMoveAt.current = event.timeStamp
    }
    scratch(point)
    moves.current += 1
    if (moves.current % 6 === 0 && clearedShare() > 0.46) finish(false)
  }

  function onPointerEnd() {
    sound.scratchStop()
    if (last.current && clearedShare() > 0.46) finish(false)
    last.current = null
  }

  // Клавиатура и простое касание без движения открывают медальон целиком.
  function onClick() {
    const canvas = canvasRef.current
    const wasTap = !canvas || travelled.current < canvas.width * 0.12
    if (wasTap) {
      sound.unlock()
      sound.play('scratch', { gain: 0.26, duration: 0.42, rate: 1.1 })
      finish(true)
    }
    travelled.current = 0
  }

  return (
    <div className="medal" data-phase={revealed && phase === 'foil' ? 'open' : phase}>
      <div className="medal__face" ref={faceRef} tabIndex={-1}>
        {children}
      </div>
      {!reduceMotion && phase !== 'open' && (
        <button
          type="button"
          className="medal__foil"
          aria-label={`Стереть серебро: ${label}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClick={onClick}
        >
          <canvas ref={canvasRef} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
