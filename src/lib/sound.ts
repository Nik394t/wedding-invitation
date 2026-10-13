/*
 * Звуки предметов: разлом сургуча, шорох и выдвижение бумаги, стирание серебра.
 * Файлы собирает scripts/make-sfx.py. Браузеры разрешают звук только после действия
 * гостя, поэтому аудиоконтекст создаётся в unlock(), который вызывают обработчики нажатий.
 */
export type SoundName = 'crack' | 'rustle' | 'slide' | 'scratch'

const FILES: Record<SoundName, string> = {
  crack: `${import.meta.env.BASE_URL}media/audio/sfx/seal-crack.mp3`,
  rustle: `${import.meta.env.BASE_URL}media/audio/sfx/paper-rustle.mp3`,
  slide: `${import.meta.env.BASE_URL}media/audio/sfx/paper-slide.mp3`,
  scratch: `${import.meta.env.BASE_URL}media/audio/sfx/foil-scratch.mp3`,
}

const NAMES = Object.keys(FILES) as SoundName[]

type PlayOptions = {
  gain?: number
  /** Задержка от момента вызова, секунды. */
  delay?: number
  rate?: number
  /** Обрезать звук с плавным затуханием, секунды. */
  duration?: number
}

type ContextConstructor = typeof AudioContext

class SoundEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private files = new Map<SoundName, Promise<ArrayBuffer>>()
  private buffers = new Map<SoundName, AudioBuffer>()
  private ready: Promise<void> | null = null
  private enabled = true
  private scratch: { source: AudioBufferSourceNode; gain: GainNode } | null = null
  private scratchTimer = 0

  /** Заранее скачивает маленькие файлы, чтобы первый щелчок печати не опоздал. */
  preload() {
    if (typeof fetch === 'undefined') return
    for (const name of NAMES) {
      if (!this.files.has(name)) {
        this.files.set(
          name,
          fetch(FILES[name]).then((response) => response.arrayBuffer()),
        )
      }
    }
  }

  /** Вызывать из обработчика нажатия или клавиши. Повторные вызовы безопасны. */
  unlock() {
    if (typeof window === 'undefined') return
    if (!this.context) {
      const Context: ContextConstructor | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: ContextConstructor }).webkitAudioContext
      if (!Context) return
      const context = new Context()
      const master = context.createGain()
      master.gain.value = this.enabled ? 1 : 0
      master.connect(context.destination)
      this.context = context
      this.master = master
      this.preload()
      this.ready = Promise.all(
        NAMES.map(async (name) => {
          const data = await this.files.get(name)!
          this.buffers.set(name, await context.decodeAudioData(data.slice(0)))
        }),
      ).then(
        () => undefined,
        () => undefined,
      )
    }
    if (this.context.state === 'suspended') void this.context.resume().catch(() => undefined)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(enabled ? 1 : 0, this.context.currentTime, 0.04)
    }
    if (!enabled) this.scratchStop()
  }

  play(name: SoundName, { gain = 1, delay = 0, rate = 1, duration }: PlayOptions = {}) {
    const { context, master, ready } = this
    if (!context || !master || !ready || !this.enabled) return
    const at = context.currentTime + delay

    void ready.then(() => {
      const buffer = this.buffers.get(name)
      // Если декодирование опоздало, звук уже не совпадёт с движением — лучше промолчать.
      if (!buffer || !this.enabled || context.currentTime - at > 0.25) return
      const start = Math.max(at, context.currentTime)
      const source = context.createBufferSource()
      const level = context.createGain()
      source.buffer = buffer
      source.playbackRate.value = rate
      level.gain.value = gain
      source.connect(level).connect(master)
      source.start(start)
      if (duration) {
        level.gain.setValueAtTime(gain, start + Math.max(duration - 0.14, 0))
        level.gain.linearRampToValueAtTime(0, start + duration)
        source.stop(start + duration + 0.02)
      }
    })
  }

  /** Начало стирания: тихая петля, громкость которой задаёт scratchMove(). */
  scratchStart() {
    const { context, master } = this
    const buffer = this.buffers.get('scratch')
    if (!context || !master || !buffer || !this.enabled || this.scratch) return
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = buffer
    source.loop = true
    source.loopStart = 0.1
    source.loopEnd = buffer.duration - 0.1
    gain.gain.value = 0
    source.connect(gain).connect(master)
    source.start(0, 0.1 + Math.random() * (buffer.duration - 0.4))
    this.scratch = { source, gain }
  }

  /** speed — скорость пальца от 0 до 1: чем быстрее, тем громче и выше трение. */
  scratchMove(speed: number) {
    const { context, scratch } = this
    if (!context || !scratch) return
    const level = Math.min(Math.max(speed, 0), 1)
    const now = context.currentTime
    scratch.gain.gain.setTargetAtTime(0.07 + 0.3 * level, now, 0.025)
    scratch.source.playbackRate.setTargetAtTime(0.88 + 0.34 * level, now, 0.05)
    window.clearTimeout(this.scratchTimer)
    this.scratchTimer = window.setTimeout(() => {
      if (this.scratch && this.context) {
        this.scratch.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.05)
      }
    }, 80)
  }

  scratchStop() {
    const { context, scratch } = this
    window.clearTimeout(this.scratchTimer)
    if (!context || !scratch) return
    this.scratch = null
    scratch.gain.gain.setTargetAtTime(0, context.currentTime, 0.04)
    scratch.source.stop(context.currentTime + 0.3)
  }
}

export const sound = new SoundEngine()
