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

/** Лист отрывного календаря: утро, роспись. */
function CalendarLeaf({ event }: { event: WeddingEvent }) {
  const [before, , after] = event.calendar
  return (
    <div className="leaf" role="img" aria-label={dateLabel(event)}>
      <div className="leaf__sheet" aria-hidden="true">
        <span className="leaf__holes" />
        <span className="leaf__month">
          {event.month} {event.year}
        </span>
        <span className="leaf__day">
          <HeartRing className="heart-ring" />
          <b>{event.day}</b>
        </span>
        <span className="leaf__weekday">{event.weekday}</span>
        <span className="leaf__neighbours">
          <i>{before.day}</i>
          <i>{after.day}</i>
        </span>
      </div>
    </div>
  )
}

/** Серебряный медальон-луна: вечер, венчание. */
function DateMoon({ event }: { event: WeddingEvent }) {
  return (
    <div className="moon" role="img" aria-label={dateLabel(event)}>
      <span className="moon__month" aria-hidden="true">
        {event.month}
      </span>
      <span className="moon__day" aria-hidden="true">
        <HeartRing className="heart-ring" />
        <b>{event.day}</b>
      </span>
      <span className="moon__weekday" aria-hidden="true">
        {event.weekday}
      </span>
      <span className="moon__year" aria-hidden="true">
        {event.year}
      </span>
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
        <div className="chapter__row">
          <Reveal variant="paper" className="chapter__date">
            <CalendarLeaf event={registry} />
          </Reveal>
          <Thread />
          <What event={registry} />
        </div>
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
        <div className="chapter__row chapter__row--mirrored">
          <What event={church} />
          <Thread />
          <Reveal variant="paper" className="chapter__date">
            <DateMoon event={church} />
          </Reveal>
        </div>
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
