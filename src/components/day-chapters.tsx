import { ArrowUpRight, Heart, MapPin } from '@phosphor-icons/react'
import { invitation } from '../content/invitation'
import type { WeddingEvent } from '../content/invitation'
import { createMapLink } from '../lib/map-links'
import { HeartRing, KeelFoil, Spray } from './flora'
import { ResponsivePicture } from './responsive-picture'
import { Reveal } from './reveal'

function Thread({ className }: { className?: string }) {
  return (
    <Reveal className={className ? `thread ${className}` : 'thread'} variant="paper">
      <span className="thread__line" aria-hidden="true" />
      <Heart className="thread__knot" weight="fill" aria-hidden="true" />
    </Reveal>
  )
}

function dateLabel(event: WeddingEvent) {
  return `${event.day} октября ${event.year} года, ${event.weekday}`
}

/** Календарь из трёх дней: нужная дата обведена сердцем от руки. */
function CalendarStrip({ event }: { event: WeddingEvent }) {
  return (
    <div className="calendar" role="img" aria-label={dateLabel(event)}>
      <div className="calendar__head script" aria-hidden="true">
        <span>{event.month}</span>
        <span>{event.year}</span>
      </div>
      <div className="calendar__days" aria-hidden="true">
        {event.calendar.map((item) => (
          <div
            className={item.active ? 'calendar__day calendar__day--active' : 'calendar__day'}
            key={item.day}
          >
            <span className="calendar__weekday">{item.weekday}</span>
            <span className="calendar__number">
              {item.active && <HeartRing className="heart-ring" />}
              <b>{item.day}</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Where({ event }: { event: WeddingEvent }) {
  return (
    <Reveal className="chapter__where">
      <address>
        <MapPin weight="light" aria-hidden="true" />
        <span>{event.address}</span>
      </address>
      <a
        className="map-link"
        href={createMapLink(event.address)}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${invitation.mapLabel}: ${event.address}`}
      >
        <span>{invitation.mapLabel}</span>
        <ArrowUpRight weight="light" aria-hidden="true" />
      </a>
    </Reveal>
  )
}

function What({ event }: { event: WeddingEvent }) {
  return (
    <Reveal className="chapter__what">
      <p className="chapter__time">
        <time dateTime={event.dateIso}>{event.time}</time>
      </p>
      <h3 id={`${event.id}-title`}>
        <span className="script">{event.titleScript}</span>
        {event.titleTail && <span className="chapter__tail"> {event.titleTail}</span>}
      </h3>
      {event.venue && <p className="chapter__venue">{event.venue}</p>}
    </Reveal>
  )
}

export function DayChapters({ events }: { events: readonly WeddingEvent[] }) {
  const [registry, church] = events

  return (
    <section className="days" aria-labelledby="days-title">
      <header className="days__head">
        <Reveal as="h2" variant="script" id="days-title" className="script">
          {invitation.days.title}
        </Reveal>
        <Reveal as="p">{invitation.days.lead}</Reveal>
      </header>

      <article className="chapter chapter--registry" aria-labelledby="registry-title">
        <Reveal variant="paper" className="chapter__calendar">
          <CalendarStrip event={registry} />
        </Reveal>
        <Thread />
        <What event={registry} />
        <figure className="postcard">
          <div className="postcard__card">
            <Reveal variant="photo" className="postcard__print">
              <ResponsivePicture image={registry.image} className="postcard__photo" />
            </Reveal>
            <figcaption className="script">{registry.place}</figcaption>
          </div>
          <span className="postcard__corner postcard__corner--a" aria-hidden="true" />
          <span className="postcard__corner postcard__corner--b" aria-hidden="true" />
        </figure>
        <Where event={registry} />
      </article>

      <article className="chapter chapter--church" aria-labelledby="church-title">
        <Thread className="thread--bridge" />
        <Reveal variant="paper" className="chapter__calendar">
          <CalendarStrip event={church} />
        </Reveal>
        <Thread />
        <What event={church} />
        <figure className="arch arch--church" data-testid="church-photo">
          <div className="arch__mat">
            <Reveal variant="photo" className="arch__inner">
              <ResponsivePicture image={church.image} className="arch__photo" />
            </Reveal>
            <KeelFoil id="foil-church" className="arch__foil" />
            <Spray className="arch__garland flora--dusk" />
          </div>
          <figcaption className="script">{church.place}</figcaption>
        </figure>
        <Where event={church} />
      </article>
    </section>
  )
}
