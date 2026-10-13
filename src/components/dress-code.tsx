import { useInView } from 'motion/react'
import { useRef } from 'react'
import type { CSSProperties } from 'react'
import { invitation } from '../content/invitation'
import { Reveal } from './reveal'

const swatches = [
  { color: 'var(--swatch-graphite)', label: 'дымчатый графит' },
  { color: 'var(--swatch-dusty-rose)', label: 'припылённая роза' },
  { color: 'var(--swatch-soft-rose)', label: 'мягкий розовый' },
  { color: 'var(--swatch-powder)', label: 'пудровый' },
  { color: 'var(--swatch-light-powder)', label: 'светлая пудра' },
  { color: 'var(--swatch-rose-accent)', label: 'розовый акцент' },
  { color: 'var(--swatch-coral)', label: 'приглушённый коралл' },
  { color: 'var(--swatch-burgundy)', label: 'глубокий бордовый' },
]

export function DressCode() {
  const fanRef = useRef<HTMLUListElement>(null)
  const open = useInView(fanRef, { once: true, margin: '0px 0px -18% 0px' })

  return (
    <section className="dress" aria-labelledby="dress-title">
      <Reveal as="h2" variant="script" id="dress-title" className="script">
        {invitation.dressCode.title}
      </Reveal>
      <Reveal as="p" className="dress__lead">
        {invitation.dressCode.lead}
      </Reveal>

      {/* Веер образцов ткани на серебряной заклёпке. */}
      <ul ref={fanRef} className="fan" data-open={open} aria-label="Палитра «пыльная роза»">
        {swatches.map((swatch, index) => (
          <li
            className="fan__blade"
            key={swatch.label}
            style={
              {
                '--tone': swatch.color,
                '--angle': `${((index - (swatches.length - 1) / 2) * 13).toFixed(1)}deg`,
                '--order': index,
              } as CSSProperties
            }
          >
            <span className="sr-only">{swatch.label}</span>
          </li>
        ))}
        <li className="fan__rivet" aria-hidden="true" />
      </ul>

      <Reveal as="p" className="dress__body">
        {invitation.dressCode.body}
      </Reveal>
    </section>
  )
}
