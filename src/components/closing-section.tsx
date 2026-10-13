import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { invitation } from '../content/invitation'
import { sound } from '../lib/sound'
import { Spray, WaxSeal } from './flora'

/** Финал: записка выходит из того же конверта вслед за прокруткой и шуршит бумагой. */
export function ClosingSection() {
  const envelopeRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: envelopeRef, offset: ['start 0.95', 'start 0.45'] })
  const y = useTransform(scrollYProgress, [0, 1], ['44%', '0%'])
  const armed = useRef(true)

  // Лист шуршит один раз на каждое выдвижение; вернувшись в конверт, он снова готов.
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (reduceMotion) return
    if (progress > 0.14 && armed.current) {
      armed.current = false
      sound.play('slide', { gain: 0.3, rate: 0.94 })
    }
    if (progress < 0.02) armed.current = true
  })

  return (
    <section className="closing" aria-labelledby="closing-title">
      <div className="closing__envelope" ref={envelopeRef}>
        <div className="closing__slot">
          <motion.div className="closing__letter" style={reduceMotion ? undefined : { y }}>
            <h2 id="closing-title" className="script">
              {invitation.closing}
            </h2>
            <p>{invitation.dates}</p>
          </motion.div>
        </div>
        <div className="closing__pocket" aria-hidden="true">
          <Spray className="closing__spray" />
        </div>
        <WaxSeal className="closing__seal" uid="closing-seal" />
      </div>
    </section>
  )
}
