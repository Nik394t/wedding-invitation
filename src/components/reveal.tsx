import { useInView } from 'motion/react'
import { useRef } from 'react'
import type { CSSProperties, PropsWithChildren } from 'react'

/*
 * Единая грамматика появления, вся анимация — в CSS по атрибуту data-seen:
 * ink    — текст проступает, как краска на бумаге;
 * script — каллиграфия «пишется» слева направо;
 * paper  — бумажный лист поднимается из-за сгиба;
 * photo  — отпечаток проявляется из тёплой сепии.
 */
type Variant = 'ink' | 'script' | 'paper' | 'photo'

type RevealProps = PropsWithChildren<{
  variant?: Variant
  className?: string
  delay?: number
  as?: 'div' | 'p' | 'h2' | 'h3' | 'figure' | 'li' | 'header'
  id?: string
  testId?: string
}>

export function Reveal({ children, variant = 'ink', className, delay = 0, as = 'div', id, testId }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, margin: '0px 0px -12% 0px' })

  // Все варианты тега — обычные блочные элементы; для типов достаточно div.
  const Tag = as as 'div'

  return (
    <Tag
      ref={ref}
      id={id}
      className={`rv rv--${variant}${className ? ` ${className}` : ''}`}
      data-seen={seen}
      data-testid={testId}
      style={delay ? ({ '--rv-delay': `${delay}s` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}
