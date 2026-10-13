import { CaretDown } from '@phosphor-icons/react'
import { invitation } from '../content/invitation'
import { KeelFoil, Spray } from './flora'
import { ResponsivePicture } from './responsive-picture'
import { Reveal } from './reveal'

export function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <Spray className="hero__emboss hero__emboss--left" angle={90} />
      <Spray className="hero__emboss hero__emboss--right" angle={90} />
      <div className="hero__stage">
        <h1 id="hero-title" className="hero__title script">
          {invitation.greeting}
        </h1>

        <figure className="arch arch--hero">
          <div className="arch__mat">
            <div className="arch__inner">
              <ResponsivePicture image={invitation.childhood.image} className="arch__photo" eager />
            </div>
            <KeelFoil id="foil-hero" className="arch__foil" />
            <Spray className="arch__garland flora--rose" />
          </div>
          <figcaption className="script">{invitation.childhood.caption}</figcaption>
        </figure>

        <Reveal as="p" className="hero__intro">
          {invitation.intro}
        </Reveal>

        <p className="hero__scroll" aria-hidden="true">
          <span>{invitation.scrollHint}</span>
          <CaretDown weight="light" />
        </p>
      </div>
    </section>
  )
}
