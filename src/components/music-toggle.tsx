import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { invitation } from '../content/invitation'

type MusicToggleProps = {
  playing: boolean
  onToggle: () => void
}

/** Маленькая «печать» в углу: включает и выключает фоновую мелодию. */
export function MusicToggle({ playing, onToggle }: MusicToggleProps) {
  return (
    <button
      type="button"
      className="music"
      aria-pressed={playing}
      aria-label={invitation.music.label}
      title={playing ? invitation.music.turnOff : invitation.music.turnOn}
      onClick={onToggle}
    >
      {playing ? (
        <SpeakerHigh weight="light" aria-hidden="true" />
      ) : (
        <SpeakerSlash weight="light" aria-hidden="true" />
      )}
    </button>
  )
}
