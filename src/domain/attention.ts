import type { AttentionDay } from './types.ts'

/** Days of silence between the last touch and today. The gap on the chart. */
export const attentionGap = (days: AttentionDay[]): number => {
  let gap = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].volume > 0) break
    gap++
  }
  return gap
}

/** No activity at all in the window. */
export const isFullySilent = (days: AttentionDay[]): boolean => days.every((d) => d.volume === 0)

/** Index of the most recent active day, or -1 when fully silent. */
export const lastActiveIndex = (days: AttentionDay[]): number => {
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].volume > 0) return i
  }
  return -1
}

export const maxVolume = (days: AttentionDay[]): number =>
  days.reduce((m, d) => Math.max(m, d.volume), 0)
