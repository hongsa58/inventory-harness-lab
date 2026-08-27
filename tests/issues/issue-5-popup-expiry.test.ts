import { describe, expect, it } from 'vitest'
import { popupEnded } from '@/lib/popup'
import { dateOnly } from '@/lib/date'

describe('Issue #5 — 팝업 종료일 경계', () => {
  it('종료일 당일까지 진행 중이고 다음 날부터 종료로 표시한다', () => {
    const endDate = dateOnly('2026-08-25')

    expect(popupEnded(endDate, dateOnly('2026-08-24'))).toBe(false)
    expect(popupEnded(endDate, dateOnly('2026-08-25'))).toBe(false)
    expect(popupEnded(endDate, dateOnly('2026-08-26'))).toBe(true)
  })

  it('시간이 달라도 날짜만 비교한다', () => {
    const endDate = new Date('2026-08-25T23:59:59.999Z')
    const sameDay = new Date('2026-08-25T00:00:00.001Z')
    const nextDay = new Date('2026-08-26T00:00:00.001Z')

    expect(popupEnded(endDate, sameDay)).toBe(false)
    expect(popupEnded(endDate, nextDay)).toBe(true)
  })
})
