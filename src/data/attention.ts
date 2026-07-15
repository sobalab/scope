/*
  Daily attention per project, the source for the attention-trails chart. Day 0 is the
  oldest, the last entry is today. volume 0 means nobody touched the project that day,
  and a trailing run of zeros is the silence gap.

  Gaps are authored to tell a clear story and to match each project's pulse and activity:
    Keystone   fully silent for 14 days. Abandoned. The chart's whole thesis.
    Hartwell   went quiet 5 days ago, momentum already fading before it stopped.
    Ferrous    steady work, quiet the last 2 days.
    Cobalt     chronically low but present, reaching to yesterday. Low is not silence.
    Alder      healthy, working through today.
    Ovid       twelve days old, a short trail from kickoff with no gap.
*/

import type { AttentionDay } from '../domain/types.ts'

const a = (volume: number, note: string): AttentionDay => ({ volume, note })
const off: AttentionDay = { volume: 0, note: null }

const hartwell: AttentionDay[] = [
  a(4, '6 commits and a staging deploy'),
  a(5, 'design review with the client'),
  a(3, '4 commits'),
  a(6, '9 commits, 6h logged'),
  a(2, '2 messages'),
  a(4, '4 commits, 3h logged'),
  a(3, '2 commits'),
  a(2, '1 message'),
  a(1, 'shipped the saved payments view'),
  off,
  off,
  off,
  off,
  off,
]

const keystone: AttentionDay[] = Array.from({ length: 14 }, () => off)

const ferrous: AttentionDay[] = [
  a(5, 'schema mapping merged'),
  a(4, '6 commits'),
  a(3, '2 commits'),
  a(5, '8 commits, 5h logged'),
  a(4, 'dry run rehearsal'),
  a(6, '11 commits'),
  a(4, '4 commits'),
  a(5, '6 commits, 4h logged'),
  a(3, '2 commits'),
  a(4, '3 commits'),
  a(5, '6 commits'),
  a(3, 'shipped the orders extract'),
  off,
  off,
]

const cobalt: AttentionDay[] = [
  a(1, 'routine check in'),
  a(2, '2 commits'),
  off,
  a(1, '1 message'),
  a(1, '1 commit'),
  off,
  a(2, 'shipped the controls export'),
  a(1, '1 commit'),
  off,
  a(1, 'check in from the PMO'),
  a(1, '1 commit'),
  a(2, 'legal review follow up'),
  a(1, 'small config fix'),
  off,
]

const alder: AttentionDay[] = [
  a(4, '6 commits'),
  a(5, 'design QA fixes'),
  a(4, '4 commits'),
  a(6, 'design QA sign off'),
  a(5, '7 commits, 5h logged'),
  a(4, '3 commits'),
  a(5, 'shipped a landing page'),
  a(4, '4 commits'),
  a(3, '2 commits'),
  a(5, '6 commits'),
  a(4, 'launch checklist review'),
  a(5, 'client approved the checklist'),
  a(4, '3 commits'),
  a(3, 'shipped the last landing page'),
]

const ovid: AttentionDay[] = [
  a(3, 'project kicked off'),
  a(2, '2 commits'),
  a(1, '1 message'),
  a(2, '3 commits'),
  off,
  a(1, '1 commit'),
  a(2, 'kickoff workshop'),
  a(1, '1 commit'),
  a(2, '3 commits'),
  a(1, '1 message'),
  a(2, 'shared the first onboarding screens'),
  a(1, '2 commits'),
]

export const attention: Record<string, AttentionDay[]> = {
  hartwell,
  keystone,
  ferrous,
  cobalt,
  alder,
  ovid,
}
