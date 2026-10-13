import { Sparkle } from '@phosphor-icons/react'
import { invitation } from '../content/invitation'
import type { WeddingEvent } from '../content/invitation'
import { Reveal } from './reveal'
import { ScratchMedallion } from './scratch-medallion'

export function DatesSection({ events }: { events: readonly WeddingEvent[] }) {
  return (
    <section className="dates" aria-labelledby="dates-title">
      <Reveal as="h2" variant="script" id="dates-title" className="script dates__title">
        {invitation.times.title}
      </Reveal>
      <Reveal as="p" className="dates__hint">
        <Sparkle weight="fill" aria-hidden="true" />
        <span>{invitation.times.hint}</span>
        <Sparkle weight="fill" aria-hidden="true" />
      </Reveal>
      <ul className="dates__medals">
        {events.map((event, index) => (
          <Reveal as="li" variant="paper" delay={index * 0.14} className="dates__item" key={event.id}>
            <ScratchMedallion label={`время ${event.day} октября`}>
              <span className="medal__time">{event.time}</span>
              <span className="medal__what script">{event.ceremony}</span>
            </ScratchMedallion>
            <p className="dates__day">
              <strong>{event.day} октября</strong>
              <span>{event.weekday}</span>
            </p>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
