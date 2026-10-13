import { describe, expect, it } from 'vitest'
import { invitation } from '../content/invitation'
import { createMapLink } from '../lib/map-links'

describe('invitation content', () => {
  it('keeps the confirmed event facts', () => {
    expect(invitation.events).toHaveLength(2)
    expect(invitation.events[0]).toMatchObject({
      day: '23',
      time: '12:30',
      address: 'г. Горячий Ключ, ул. Ленина, д. 195А',
    })
    expect(invitation.events[1]).toMatchObject({
      day: '24',
      time: '16:00',
      venue: 'Церковь «Скиния Давида»',
      address: 'г. Краснодар, ул. Вишняковой, 2А',
    })
  })

  it('uses the assigned images for both locations', () => {
    expect(invitation.events[0].image.fallback).toContain('registry-office')
    expect(invitation.events[1].image.fallback).toContain('couple')
  })

  it('creates encoded map links', () => {
    const link = createMapLink(invitation.events[0].address)
    expect(link).toContain('https://yandex.ru/maps/?text=')
    expect(link).toContain('%D0%B3.')
  })

  it('keeps the confirmed dress-code wording', () => {
    expect(invitation.dressCode.lead).toBe(
      'Атмосфера нашей свадьбы наполнена лёгким винтажным шармом и романтикой прошлых эпох.',
    )
    expect(invitation.dressCode.body).toContain(
      'палитре в стиле «пыльная роза»: приглушённым розовым, пудровым, серо-розовым и мягким пастельным оттенкам',
    )
  })

  it('splits event titles for typography without changing them', () => {
    for (const event of invitation.events) {
      const typeset = [event.titleScript, 'titleTail' in event ? event.titleTail : undefined]
        .filter(Boolean)
        .join(' ')
      expect(typeset).toBe(event.title)
    }
  })

  it('reads the childhood caption and the invitation as one sentence', () => {
    expect(invitation.childhood.caption.endsWith('…')).toBe(true)
    expect(invitation.intro.startsWith('…')).toBe(true)
  })

  it('keeps the background melody quiet', () => {
    expect(invitation.music.src).toMatch(/media\/audio\/.+\.mp3$/)
    expect(invitation.music.volume).toBeGreaterThan(0)
    expect(invitation.music.volume).toBeLessThanOrEqual(0.6)
  })

  it('does not use the rejected opening phrase', () => {
    expect(JSON.stringify(invitation).toLocaleLowerCase('ru')).not.toContain('тили-тили тесто')
  })
})
