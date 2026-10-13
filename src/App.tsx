import { useEffect, useRef, useState } from 'react'
import { ClosingSection } from './components/closing-section'
import { DatesSection } from './components/dates-section'
import { DayChapters } from './components/day-chapters'
import { DressCode } from './components/dress-code'
import { EnvelopeCover } from './components/envelope-cover'
import { HeroSection } from './components/hero-section'
import { MusicToggle } from './components/music-toggle'
import { invitation } from './content/invitation'
import { sound } from './lib/sound'
import './App.css'

type Phase = 'closed' | 'opening' | 'open'

export default function App() {
  const [phase, setPhase] = useState<Phase>('closed')
  // Одна кнопка «Звук» управляет и мелодией, и звуками предметов.
  const [soundOn, setSoundOn] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  // Гость сам решает, нужна ли музыка: после его «выключить» она больше не включается сама.
  const wantsMusic = useRef(false)

  useEffect(() => {
    document.body.dataset.invitation = phase
    if (phase === 'open') mainRef.current?.focus({ preventScroll: true })
  }, [phase])

  function playMusic() {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = invitation.music.volume
    audio.play().catch(() => undefined)
  }

  // Браузеры разрешают звук только в ответ на действие гостя — поэтому мелодия
  // стартует прямо в обработчике нажатия на печать.
  function startStory() {
    setPhase('opening')
    wantsMusic.current = true
    setSoundOn(true)
    sound.setEnabled(true)
    playMusic()
  }

  function toggleSound() {
    const next = !soundOn
    wantsMusic.current = next
    setSoundOn(next)
    sound.unlock()
    sound.setEnabled(next)
    if (next) playMusic()
    else audioRef.current?.pause()
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Свернули вкладку или заблокировали телефон — мелодия замолкает и возвращается вместе с гостем.
    const onVisibility = () => {
      if (document.hidden) audio.pause()
      else if (wantsMusic.current) {
        audio.volume = invitation.music.volume
        audio.play().catch(() => undefined)
      }
    }
    // Файлы звуков скачиваются заранее, а контекст просыпается с первым касанием или клавишей.
    const wake = () => sound.unlock()

    sound.preload()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pointerdown', wake, { passive: true })
    window.addEventListener('keydown', wake)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
    }
  }, [])

  return (
    <>
      <audio ref={audioRef} src={invitation.music.src} preload="none" loop />
      {phase !== 'open' && <EnvelopeCover onOpenStart={startStory} onOpened={() => setPhase('open')} />}
      {phase !== 'closed' && <MusicToggle playing={soundOn} onToggle={toggleSound} />}
      <main
        ref={mainRef}
        className="invitation"
        data-phase={phase}
        tabIndex={-1}
        inert={phase === 'closed' ? true : undefined}
        aria-hidden={phase === 'closed' ? true : undefined}
      >
        <HeroSection />
        <DatesSection events={invitation.events} />
        <DayChapters events={invitation.events} />
        <DressCode />
        <ClosingSection />
      </main>
    </>
  )
}
