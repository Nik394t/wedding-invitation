import type { ReactNode } from 'react'

/*
 * Авторская флористика приглашения. Один набор геометрии в двух материалах:
 * слепое тиснение (все тона равны цвету бумаги) и бумажные розы пыльной палитры.
 * Рельеф собирается из трёх копий слоя: блик, тень и лицевая сторона.
 */

const PETAL = 'M0 0C-6.5-3-9.6-11-6.2-17.4C-4.1-21.2 4.1-21.2 6.2-17.4C9.6-11 6.5-3 0 0Z'
const LEAF = 'M0 0C5.4-5.2 6.4-15.5 0-25C-6.4-15.5-5.4-5.2 0 0Z'
const VEIN = 'M0-2.5V-20'

type Tone = 1 | 2 | 3 | 4 | 5

function Relief({ children, tone }: { children: ReactNode; tone?: Tone }) {
  return (
    <g>
      <g className="relief-hi" transform="translate(-0.7 -0.9)">
        {children}
      </g>
      <g className="relief-lo" transform="translate(0.9 1.3)">
        {children}
      </g>
      <g className={tone ? `relief-face relief-face--${tone}` : 'relief-face'}>{children}</g>
    </g>
  )
}

type Placed = { x: number; y: number; r?: number; s?: number }

function turnPoint(item: Placed, angle: number): Required<Placed> {
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    x: +(item.x * cos - item.y * sin).toFixed(2),
    y: +(item.x * sin + item.y * cos).toFixed(2),
    r: (item.r ?? 0) + angle,
    s: item.s ?? 1,
  }
}

function mirror(items: Placed[]): Placed[] {
  return items.flatMap((item) =>
    item.x === 0 ? [item] : [item, { ...item, x: -item.x, r: -(item.r ?? 0) }],
  )
}

function place(item: Required<Placed>, extra = '') {
  return `translate(${item.x} ${item.y}) rotate(${item.r})${extra} scale(${item.s})`
}

function roseRings(rose: Required<Placed>, id: string) {
  const ring = (count: number, scale: number, offset: number, lift: number) =>
    Array.from({ length: count }, (_, index) => {
      const wobble = 1 + (((index * 37) % 11) - 5) * 0.013
      const size = (rose.s * scale * wobble).toFixed(3)
      const angle = rose.r + offset + (360 / count) * index
      return (
        <path
          key={`${id}-${count}-${index}`}
          d={PETAL}
          transform={`translate(${rose.x} ${rose.y}) rotate(${angle.toFixed(1)}) translate(0 ${(-lift * rose.s).toFixed(2)}) scale(${size})`}
        />
      )
    })

  return (
    <g key={id}>
      <Relief tone={1}>{ring(8, 1, 0, 1.6)}</Relief>
      <Relief tone={2}>{ring(6, 0.74, 24, 0.9)}</Relief>
      <Relief tone={3}>{ring(5, 0.5, 8, 0.3)}</Relief>
      <Relief tone={4}>
        <circle cx={rose.x} cy={rose.y} r={3.3 * rose.s} />
      </Relief>
    </g>
  )
}

const LEAVES: Placed[] = mirror([
  { x: 0, y: -15, r: 0, s: 1.05 },
  { x: 0, y: 13, r: 180, s: 0.85 },
  { x: 13, y: -13, r: 34, s: 1.15 },
  { x: 23, y: -5, r: 68, s: 1.25 },
  { x: 21, y: 9, r: 112, s: 1.1 },
  { x: 10, y: 15, r: 152, s: 0.95 },
  { x: 37, y: -12, r: 52, s: 0.92 },
  { x: 39, y: 6, r: 98, s: 0.98 },
])

const ROSES: Placed[] = mirror([
  { x: 27, y: 4, r: 18, s: 0.8 },
  { x: 47, y: -3, r: 40, s: 0.5 },
  { x: 0, y: 0, r: 0, s: 1.22 },
])

const SPRIG_LEAVES: Placed[] = mirror([
  { x: 49, y: -9, r: 28, s: 0.5 },
  { x: 55, y: -5, r: 118, s: 0.46 },
  { x: 60, y: -14, r: 22, s: 0.46 },
  { x: 66, y: -10, r: 112, s: 0.42 },
  { x: 71, y: -20, r: 30, s: 0.4 },
  { x: 50, y: 13, r: 150, s: 0.46 },
  { x: 58, y: 12, r: 52, s: 0.44 },
  { x: 67, y: 16, r: 146, s: 0.4 },
])

const BLOSSOMS: Placed[] = mirror([
  { x: 80, y: -25, s: 0.8 },
  { x: 77, y: 15, s: 1 },
  { x: 62, y: 21, s: 0.75 },
])

const DOTS: Placed[] = mirror([
  { x: 88, y: -17 },
  { x: 86, y: 6 },
  { x: 70, y: -29 },
  { x: 47, y: 23 },
  { x: 90, y: -30 },
])

const STEMS = ['M33 0C47-3 63-10 78-24', 'M31 8C45 13 60 18 76 15', 'M52 16C55 18 58 20 62 21']

type SprayProps = {
  /** Поворот композиции: 0 — горизонтальная гирлянда, 90 — вертикальная. */
  angle?: number
  className?: string
}

export function Spray({ angle = 0, className }: SprayProps) {
  const at = (item: Placed) => turnPoint(item, angle)
  const viewBox =
    angle % 180 === 0 ? '-98 -40 196 80' : angle % 90 === 0 ? '-40 -98 80 196' : '-98 -98 196 196'
  const stemTransform = (flip: boolean) => `rotate(${angle})${flip ? ' scale(-1 1)' : ''}`

  return (
    <svg className={className ? `spray ${className}` : 'spray'} viewBox={viewBox} aria-hidden="true" focusable="false">
      <Relief tone={5}>
        {[false, true].map((flip) =>
          STEMS.map((d) => <path key={`${d}-${flip}`} className="stem" d={d} transform={stemTransform(flip)} />),
        )}
        {SPRIG_LEAVES.map(at).map((leaf, index) => (
          <path key={`sprig-${index}`} d={LEAF} transform={place(leaf)} />
        ))}
        {LEAVES.map(at).map((leaf, index) => (
          <path key={`leaf-${index}`} d={LEAF} transform={place(leaf)} />
        ))}
        {DOTS.map(at).map((dot, index) => (
          <circle key={`dot-${index}`} cx={dot.x} cy={dot.y} r="1.15" />
        ))}
      </Relief>
      <g className="relief-vein">
        {LEAVES.map(at).map((leaf, index) => (
          <path key={`vein-${index}`} d={VEIN} transform={place(leaf)} />
        ))}
      </g>
      <Relief tone={2}>
        {BLOSSOMS.map(at).flatMap((blossom, index) =>
          Array.from({ length: 5 }, (_, petal) => (
            <circle
              key={`blossom-${index}-${petal}`}
              r={2.9 * blossom.s}
              transform={`translate(${blossom.x} ${blossom.y}) rotate(${petal * 72 + index * 20}) translate(0 ${-3.5 * blossom.s})`}
            />
          )),
        )}
      </Relief>
      <Relief tone={4}>
        {BLOSSOMS.map(at).map((blossom, index) => (
          <circle key={`eye-${index}`} cx={blossom.x} cy={blossom.y} r={1.5 * blossom.s} />
        ))}
      </Relief>
      {ROSES.map(at).map((rose, index) => roseRings(rose, `rose-${index}`))}
    </svg>
  )
}

function waxOutline() {
  const points = Array.from({ length: 72 }, (_, index) => {
    const angle = (index / 72) * Math.PI * 2
    const radius =
      50 + 3.1 * Math.sin(5 * angle + 0.6) + 2 * Math.sin(9 * angle + 2) + 1.1 * Math.sin(13 * angle)
    return [+(Math.cos(angle) * radius).toFixed(2), +(Math.sin(angle) * radius).toFixed(2)] as const
  })
  const mid = (a: readonly [number, number], b: readonly [number, number]) =>
    `${((a[0] + b[0]) / 2).toFixed(2)} ${((a[1] + b[1]) / 2).toFixed(2)}`
  let d = `M${mid(points[71], points[0])}`
  points.forEach((point, index) => {
    d += `Q${point[0]} ${point[1]} ${mid(point, points[(index + 1) % 72])}`
  })
  return `${d}Z`
}

const WAX = waxOutline()
const HEART = 'M0 12C-19-2-16-17-7.4-17C-3.3-17-0.8-14 0-11C0.8-14 3.3-17 7.4-17C16-17 19-2 0 12Z'

/** Сургучная печать с оттиснутым сердцем. */
export function WaxSeal({ className, uid = 'wax' }: { className?: string; uid?: string }) {
  return (
    <svg className={className} viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${uid}-body`} cx="36%" cy="28%" r="78%">
          <stop offset="0" stopColor="#a54f5a" />
          <stop offset="0.5" stopColor="#7a2f38" />
          <stop offset="1" stopColor="#521d27" />
        </radialGradient>
        <radialGradient id={`${uid}-well`} cx="42%" cy="36%" r="70%">
          <stop offset="0" stopColor="#7d313b" />
          <stop offset="1" stopColor="#5e222c" />
        </radialGradient>
        <linearGradient id={`${uid}-lip`} x1="0.15" y1="0.1" x2="0.85" y2="0.9">
          <stop offset="0" stopColor="#2c0a11" stopOpacity="0.7" />
          <stop offset="0.5" stopColor="#2c0a11" stopOpacity="0.05" />
          <stop offset="1" stopColor="#f3c7c9" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <path d={WAX} fill="#3d141c" opacity="0.45" transform="translate(1.2 1.8)" />
      <path d={WAX} fill={`url(#${uid}-body)`} />
      <path d={WAX} fill="none" stroke="#f0bfc3" strokeOpacity="0.35" strokeWidth="1.1" transform="translate(-0.7 -0.9) scale(0.985)" />
      <circle r="36" fill={`url(#${uid}-well)`} />
      <circle r="36" fill="none" stroke={`url(#${uid}-lip)`} strokeWidth="2.2" />
      <circle r="30.5" fill="none" stroke="#b56a74" strokeOpacity="0.75" strokeWidth="1.5" strokeDasharray="0.1 4.16" strokeLinecap="round" />
      <path d={HEART} fill="#f1c4c7" fillOpacity="0.5" transform="translate(-0.8 -1) scale(1.12)" />
      <path d={HEART} fill="#2c0a11" fillOpacity="0.55" transform="translate(1 1.4) scale(1.12)" />
      <path d={HEART} fill="#8c3944" transform="scale(1.12)" />
      <ellipse cx="-19" cy="-27" rx="17" ry="8" fill="#fff" opacity="0.13" transform="rotate(-32 -19 -27)" />
    </svg>
  )
}

/** Сердце, обведённое от руки вокруг даты. */
export function HeartRing({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 92" aria-hidden="true" focusable="false">
      <path
        d="M51 86C22 64 5 46 8 27C10 12 26 4 39 11C45 14.5 49 21 51 28C53 20 58 13 65 10C78 5 92 14 93 29C94 47 77 66 47 88"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  )
}

export const KEEL_PATH =
  'M0 100V42C0 23 17 12.5 34 7.5C42.5 5 47.5 3 50 0C52.5 3 57.5 5 66 7.5C83 12.5 100 23 100 42V100Z'

/** Серебряная фольгированная линия по контуру килевидной арки. */
export function KeelFoil({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f4f2" />
          <stop offset="0.3" stopColor="#a39d9b" />
          <stop offset="0.52" stopColor="#efecea" />
          <stop offset="0.76" stopColor="#8f8987" />
          <stop offset="1" stopColor="#dedad8" />
        </linearGradient>
      </defs>
      <path d={KEEL_PATH} fill="none" stroke={`url(#${id})`} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
