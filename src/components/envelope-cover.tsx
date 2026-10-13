import { Sparkle } from '@phosphor-icons/react'
import { stagger, useAnimate, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { invitation } from '../content/invitation'
import { easeFold } from '../lib/motion'
import { sound } from '../lib/sound'
import { Spray, WaxSeal } from './flora'

type EnvelopeCoverProps = {
  onOpenStart: () => void
  onOpened: () => void
}

const sparkles = [
  { x: -34, y: -30, size: 15 },
  { x: 36, y: -22, size: 11 },
  { x: -42, y: 14, size: 10 },
  { x: 40, y: 26, size: 16 },
  { x: -8, y: -44, size: 9 },
  { x: 12, y: 44, size: 12 },
]

export function EnvelopeCover({ onOpenStart, onOpened }: EnvelopeCoverProps) {
  const reduceMotion = useReducedMotion()
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const [opening, setOpening] = useState(false)

  async function open() {
    if (opening) return
    setOpening(true)
    onOpenStart()

    // Звук идёт за движением: сургуч ломается под пальцем, затем шуршат створки и выходит лист.
    sound.unlock()
    sound.play('crack', { gain: 0.55 })

    if (reduceMotion) {
      await animate(scope.current, { opacity: 0 }, { duration: 0.2 })
      onOpened()
      return
    }

    sound.play('rustle', { gain: 0.4, delay: 0.3 })
    sound.play('slide', { gain: 0.32, delay: 0.72 })

    // Одна поставленная последовательность ≈1.34 с: печать ломается → блик → свет → створки.
    await animate([
      ['.seal__art', { scale: [1, 0.93, 1] }, { duration: 0.16, ease: 'easeOut' }],
      ['.seal__whole', { opacity: 0 }, { duration: 0.01, at: 0.13 }],
      [
        '.seal__half--a',
        { opacity: [1, 1, 0], x: ['0%', '-12%'], y: ['0%', '5%'], rotate: [0, -11] },
        { duration: 0.46, at: 0.13, ease: 'easeOut' },
      ],
      [
        '.seal__half--b',
        { opacity: [1, 1, 0], x: ['0%', '12%'], y: ['0%', '8%'], rotate: [0, 9] },
        { duration: 0.46, at: 0.13, ease: 'easeOut' },
      ],
      ['.cover__sparkle', { opacity: [0, 1, 0], scale: [0.2, 1, 0.5] }, { duration: 0.62, at: 0.04, delay: stagger(0.04) }],
      ['.cover__shimmer', { x: ['-115%', '115%'], opacity: [0, 1, 1, 0] }, { duration: 0.72, at: 0.04, ease: 'easeInOut' }],
      ['.cover__glow', { opacity: [0, 1], scale: [0.35, 1] }, { duration: 0.5, at: 0.2, ease: 'easeOut' }],
      ['.cover__type', { opacity: 0 }, { duration: 0.28, at: 0.2 }],
      ['.cover__back', { opacity: 0 }, { duration: 0.22, at: 0.3 }],
      ['.flap--top', { rotateX: 112 }, { duration: 0.88, at: 0.32, ease: easeFold }],
      ['.flap--left', { rotateY: -112 }, { duration: 0.88, at: 0.4, ease: easeFold }],
      ['.flap--right', { rotateY: 112 }, { duration: 0.88, at: 0.4, ease: easeFold }],
      ['.flap--bottom', { rotateX: -112 }, { duration: 0.88, at: 0.46, ease: easeFold }],
      ['.cover__glow', { opacity: 0 }, { duration: 0.42, at: 0.92 }],
    ])
    onOpened()
  }

  return (
    <div
      ref={scope}
      className="cover"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-title"
      aria-hidden={opening ? true : undefined}
      inert={opening ? true : undefined}
      data-opening={opening}
    >
      <div className="cover__back" aria-hidden="true" />
      <div className="cover__glow" aria-hidden="true" />
      <div className="flap flap--bottom" aria-hidden="true">
        <div className="flap__paper">
          <Spray className="flap__spray" />
        </div>
      </div>
      <div className="flap flap--left" aria-hidden="true">
        <div className="flap__paper">
          <Spray className="flap__spray" angle={90} />
        </div>
      </div>
      <div className="flap flap--right" aria-hidden="true">
        <div className="flap__paper">
          <Spray className="flap__spray" angle={90} />
        </div>
      </div>
      <div className="flap flap--top" aria-hidden="true">
        <div className="flap__paper">
          <Spray className="flap__spray" />
        </div>
      </div>
      <div className="cover__shimmer" aria-hidden="true" />

      <div className="cover__type">
        <h1 id="cover-title" className="cover__title">
          <span className="script">Приглашение</span> <span className="caps">на нашу свадьбу</span>
        </h1>
        <p className="cover__dates">{invitation.dates}</p>
      </div>

      <div className="seal-anchor">
        {sparkles.map((sparkle) => (
          <Sparkle
            key={`${sparkle.x}-${sparkle.y}`}
            className="cover__sparkle"
            weight="fill"
            size={sparkle.size}
            style={{ left: `calc(50% + ${sparkle.x}%)`, top: `calc(50% + ${sparkle.y}%)` }}
            aria-hidden="true"
          />
        ))}
        <button type="button" className="seal" onClick={open}>
          <span className="seal__halo" aria-hidden="true" />
          <span className="seal__art">
            <WaxSeal className="seal__whole" uid="seal" />
            <WaxSeal className="seal__half seal__half--a" uid="seal-a" />
            <WaxSeal className="seal__half seal__half--b" uid="seal-b" />
          </span>
          <span className="seal__label">{invitation.openLabel}</span>
        </button>
      </div>
    </div>
  )
}
