/*
  Six client events, authored so the standings computed by assess() land where the board
  needs them and every listed state is reachable:

    Solaro   retail pop up, 12 days out, caterer unconfirmed, a missed floor plan lock,
             behind and slipping. At risk. The fire.
    Lumen    store launch the same weekend as Solaro, fighting over the same crew. Behind.
    Verdant  partner dinner. Behind and the client is quiet, but exactly as Verdant always
             runs. Watch, marked behind but normal.
    Meridian 1,200 guest autumn gala, months out, on plan. On track, no open items.
    Halcyon  a summit that just happened, now in teardown and final invoicing.
    Corvus   corporate offsite six months out with almost nothing logged. Too new to read.

  Dates are day offsets from today. Nothing stores a standing.
*/

import type { EventRecord } from '../domain/types.ts'

const solaro: EventRecord = {
  id: 'solaro',
  client: 'Solaro',
  name: 'Solaro spring pop up',
  type: 'popup',
  guests: 200,
  kickoffDaysFromToday: -78,
  showDaysFromToday: 12,
  readiness: 0.6,
  readinessLastWeek: 0.58,
  clientReplyDays: 3,
  clientReplyDaysLastWeek: 2,
  budget: { cap: 120000, committed: 100000, spent: 70000 },
  committedLastWeek: 95000,
  crew: [
    { name: 'Dana', role: 'Producer', stretch: 1.1, collidesWith: 'Lumen store launch' },
    { name: 'Theo', role: 'Build lead', stretch: 1.0, collidesWith: 'Lumen store launch' },
    { name: 'Mara', role: 'Stylist', stretch: 0.8 },
  ],
  crewStretchLastWeek: 1.05,
  normal: { readinessGap: 0.06, clientReplyDays: 3, committedFraction: 0.8, crewStretch: 1.0 },
  locks: [
    { id: 's-l1', label: 'Permit filing', owner: 'Dana', daysFromToday: -9, locked: true, breaksIf: 'no pop up without it' },
    { id: 's-l2', label: 'Floor plan lock', owner: 'Theo', daysFromToday: -2, locked: false, breaksIf: 'rentals cannot ship in time' },
    { id: 's-l3', label: 'Menu lock', owner: 'Mara', daysFromToday: 3, locked: false, breaksIf: 'the caterer walks' },
    { id: 's-l4', label: 'Final headcount', owner: 'Dana', daysFromToday: 6, locked: false, breaksIf: 'venue overage fees' },
  ],
  vendors: [
    { id: 's-v1', name: 'Bloom and Co', role: 'Florist', contracted: true, depositPaid: true, lockDaysFromToday: -5 },
    { id: 's-v2', name: 'Grazed', role: 'Caterer', contracted: false, depositPaid: false, lockDaysFromToday: 3 },
    { id: 's-v3', name: 'Halo', role: 'Lighting', contracted: false, depositPaid: false, lockDaysFromToday: 8 },
    { id: 's-v4', name: 'Cartage', role: 'Rentals', contracted: true, depositPaid: true, lockDaysFromToday: -1 },
  ],
  openItems: [
    { id: 's-o1', kind: 'blocker', title: 'Caterer has not returned the signed contract', ageDays: 6, owner: 'Grazed', onClient: false },
    { id: 's-o2', kind: 'risk', title: 'Floor plan lock passed, rentals cannot be confirmed', ageDays: 2, owner: 'Theo', onClient: false },
    { id: 's-o3', kind: 'question', title: 'Client has not confirmed the final guest count', ageDays: 4, owner: 'Solaro', onClient: true },
  ],
  activity: [
    { id: 's-a1', daysAgo: 1, who: 'Theo', channel: 'team', text: 'Flagged the floor plan lock as passed' },
    { id: 's-a2', daysAgo: 2, who: 'Bloom and Co', channel: 'vendor', text: 'Confirmed the floral install window' },
    { id: 's-a3', daysAgo: 3, who: 'Solaro', channel: 'client', text: 'Asked to add a press preview hour' },
    { id: 's-a4', daysAgo: 6, who: 'Dana', channel: 'team', text: 'Chased Grazed for the signed contract' },
  ],
}

const lumen: EventRecord = {
  id: 'lumen',
  client: 'Lumen',
  name: 'Lumen store launch',
  type: 'launch',
  guests: 400,
  kickoffDaysFromToday: -50,
  showDaysFromToday: 14,
  readiness: 0.56,
  readinessLastWeek: 0.55,
  clientReplyDays: 6,
  clientReplyDaysLastWeek: 5,
  budget: { cap: 200000, committed: 150000, spent: 110000 },
  committedLastWeek: 145000,
  crew: [
    { name: 'Dana', role: 'Producer', stretch: 1.15, collidesWith: 'Solaro spring pop up' },
    { name: 'Theo', role: 'Build lead', stretch: 1.0, collidesWith: 'Solaro spring pop up' },
    { name: 'Iris', role: 'AV', stretch: 0.9 },
  ],
  crewStretchLastWeek: 1.05,
  normal: { readinessGap: 0.08, clientReplyDays: 4, committedFraction: 0.78, crewStretch: 1.0 },
  locks: [
    { id: 'l-l1', label: 'Creative sign off', owner: 'Iris', daysFromToday: -14, locked: true, breaksIf: 'nothing to build to' },
    { id: 'l-l2', label: 'AV plot lock', owner: 'Iris', daysFromToday: 8, locked: false, breaksIf: 'the stage cannot be built' },
    { id: 'l-l3', label: 'Run of show', owner: 'Dana', daysFromToday: 10, locked: false, breaksIf: 'talent timing slips' },
    { id: 'l-l4', label: 'Final headcount', owner: 'Dana', daysFromToday: 12, locked: false, breaksIf: 'venue overage fees' },
  ],
  vendors: [
    { id: 'l-v1', name: 'Northlight', role: 'Staging', contracted: true, depositPaid: true, lockDaysFromToday: -10 },
    { id: 'l-v2', name: 'Pulse', role: 'AV', contracted: false, depositPaid: false, lockDaysFromToday: 8 },
    { id: 'l-v3', name: 'Fete', role: 'Catering', contracted: true, depositPaid: true, lockDaysFromToday: -3 },
  ],
  openItems: [
    { id: 'l-o1', kind: 'risk', title: 'Dana and Theo double booked with Solaro the weekend of the 27th', ageDays: 3, owner: 'Ardent', onClient: false },
    { id: 'l-o2', kind: 'blocker', title: 'AV plot not locked, stage build cannot start', ageDays: 5, owner: 'Pulse', onClient: false },
  ],
  activity: [
    { id: 'l-a1', daysAgo: 1, who: 'Northlight', channel: 'vendor', text: 'Sent the revised staging drawings' },
    { id: 'l-a2', daysAgo: 3, who: 'Dana', channel: 'team', text: 'Raised the crew clash with Solaro' },
    { id: 'l-a3', daysAgo: 6, who: 'Lumen', channel: 'client', text: 'Approved the run of show draft' },
  ],
}

const verdant: EventRecord = {
  id: 'verdant',
  client: 'Verdant',
  name: 'Verdant partner dinner',
  type: 'dinner',
  guests: 80,
  kickoffDaysFromToday: -40,
  showDaysFromToday: 26,
  readiness: 0.33,
  readinessLastWeek: 0.31,
  clientReplyDays: 9,
  clientReplyDaysLastWeek: 8,
  budget: { cap: 60000, committed: 49000, spent: 30000 },
  committedLastWeek: 48000,
  crew: [
    { name: 'Mara', role: 'Stylist', stretch: 0.9 },
    { name: 'Iris', role: 'Coordinator', stretch: 0.7 },
  ],
  crewStretchLastWeek: 0.9,
  normal: { readinessGap: 0.25, clientReplyDays: 9, committedFraction: 0.82, crewStretch: 1.0 },
  locks: [
    { id: 'v-l1', label: 'Menu direction', owner: 'Mara', daysFromToday: -8, locked: true, breaksIf: 'the kitchen cannot plan' },
    { id: 'v-l2', label: 'Final menu', owner: 'Mara', daysFromToday: 12, locked: false, breaksIf: 'the caterer needs two weeks' },
    { id: 'v-l3', label: 'Seating plan', owner: 'Iris', daysFromToday: 18, locked: false, breaksIf: 'place settings slip' },
  ],
  vendors: [
    { id: 'v-v1', name: 'Verdure', role: 'Florist', contracted: true, depositPaid: true, lockDaysFromToday: -6 },
    { id: 'v-v2', name: 'Table Nine', role: 'Catering', contracted: true, depositPaid: false, lockDaysFromToday: 12 },
  ],
  openItems: [
    { id: 'v-o1', kind: 'question', title: 'Client has not signed off the menu, sitting 9 days', ageDays: 9, owner: 'Verdant', onClient: true },
  ],
  activity: [
    { id: 'v-a1', daysAgo: 2, who: 'Verdure', channel: 'vendor', text: 'Shared the centerpiece options' },
    { id: 'v-a2', daysAgo: 9, who: 'Verdant', channel: 'client', text: 'Last reply, said they would review the menu' },
    { id: 'v-a3', daysAgo: 12, who: 'Mara', channel: 'team', text: 'Sent the menu for sign off' },
  ],
}

const meridian: EventRecord = {
  id: 'meridian',
  client: 'Meridian',
  name: 'Meridian autumn gala',
  type: 'gala',
  guests: 1200,
  kickoffDaysFromToday: -120,
  showDaysFromToday: 60,
  readiness: 0.62,
  readinessLastWeek: 0.57,
  clientReplyDays: 2,
  clientReplyDaysLastWeek: 2,
  budget: { cap: 800000, committed: 600000, spent: 400000 },
  committedLastWeek: 580000,
  crew: [
    { name: 'Dana', role: 'Producer', stretch: 0.6 },
    { name: 'Mara', role: 'Design', stretch: 0.7 },
    { name: 'Theo', role: 'Build', stretch: 0.5 },
  ],
  crewStretchLastWeek: 0.6,
  normal: { readinessGap: 0.05, clientReplyDays: 3, committedFraction: 0.75, crewStretch: 1.0 },
  locks: [
    { id: 'm-l1', label: 'Venue contract', owner: 'Dana', daysFromToday: -100, locked: true, breaksIf: 'no room, no gala' },
    { id: 'm-l2', label: 'Floor plan lock', owner: 'Theo', daysFromToday: -20, locked: true, breaksIf: 'rentals cannot plan' },
    { id: 'm-l3', label: 'Menu lock', owner: 'Mara', daysFromToday: 25, locked: false, breaksIf: 'the caterer needs lead time' },
    { id: 'm-l4', label: 'Final headcount', owner: 'Dana', daysFromToday: 30, locked: false, breaksIf: 'venue overage fees' },
    { id: 'm-l5', label: 'Rentals ship', owner: 'Theo', daysFromToday: 45, locked: false, breaksIf: 'nothing on the floor' },
  ],
  vendors: [
    { id: 'm-v1', name: 'Grand Ballroom', role: 'Venue', contracted: true, depositPaid: true, lockDaysFromToday: -100 },
    { id: 'm-v2', name: 'Fleur', role: 'Florist', contracted: true, depositPaid: true, lockDaysFromToday: -30 },
    { id: 'm-v3', name: 'Prime', role: 'Catering', contracted: true, depositPaid: false, lockDaysFromToday: 25 },
    { id: 'm-v4', name: 'Skyline', role: 'AV', contracted: false, depositPaid: false, lockDaysFromToday: 40 },
  ],
  openItems: [],
  activity: [
    { id: 'm-a1', daysAgo: 1, who: 'Prime', channel: 'vendor', text: 'Sent the tasting menu for review' },
    { id: 'm-a2', daysAgo: 2, who: 'Meridian', channel: 'client', text: 'Approved the lighting direction' },
    { id: 'm-a3', daysAgo: 5, who: 'Mara', channel: 'team', text: 'Locked the floor plan with rentals' },
  ],
}

const halcyon: EventRecord = {
  id: 'halcyon',
  client: 'Halcyon',
  name: 'Halcyon summit',
  type: 'conference',
  guests: 300,
  kickoffDaysFromToday: -90,
  showDaysFromToday: -4,
  readiness: 1.0,
  readinessLastWeek: 0.95,
  clientReplyDays: 1,
  clientReplyDaysLastWeek: 1,
  budget: { cap: 300000, committed: 290000, spent: 285000 },
  committedLastWeek: 288000,
  crew: [{ name: 'Theo', role: 'Strike lead', stretch: 0.4 }],
  crewStretchLastWeek: 0.7,
  normal: { readinessGap: 0.05, clientReplyDays: 2, committedFraction: 0.95, crewStretch: 1.0 },
  phase: 'teardown',
  locks: [
    { id: 'h-l1', label: 'Load out', owner: 'Theo', daysFromToday: -3, locked: true, breaksIf: 'venue holds the deposit' },
    { id: 'h-l2', label: 'Vendor final payments', owner: 'Dana', daysFromToday: 5, locked: false, breaksIf: 'vendors start chasing' },
    { id: 'h-l3', label: 'Client wrap report', owner: 'Dana', daysFromToday: 9, locked: false, breaksIf: 'the renewal stalls' },
  ],
  vendors: [
    { id: 'h-v1', name: 'Metro Hall', role: 'Venue', contracted: true, depositPaid: true, lockDaysFromToday: -90 },
    { id: 'h-v2', name: 'Prime', role: 'Catering', contracted: true, depositPaid: true, lockDaysFromToday: -20 },
  ],
  openItems: [
    { id: 'h-o1', kind: 'question', title: 'Final invoice from the caterer still pending', ageDays: 3, owner: 'Prime', onClient: false },
  ],
  activity: [
    { id: 'h-a1', daysAgo: 1, who: 'Theo', channel: 'team', text: 'Completed the strike and load out' },
    { id: 'h-a2', daysAgo: 3, who: 'Halcyon', channel: 'client', text: 'Sent a thank you and asked about next year' },
    { id: 'h-a3', daysAgo: 4, who: 'Ardent', channel: 'system', text: 'Event completed' },
  ],
}

const corvus: EventRecord = {
  id: 'corvus',
  client: 'Corvus',
  name: 'Corvus corporate offsite',
  type: 'offsite',
  guests: 150,
  kickoffDaysFromToday: -6,
  showDaysFromToday: 180,
  readiness: 0.05,
  readinessLastWeek: 0.03,
  clientReplyDays: 4,
  clientReplyDaysLastWeek: 4,
  budget: { cap: 150000, committed: 15000, spent: 0 },
  committedLastWeek: 10000,
  crew: [{ name: 'Dana', role: 'Producer', stretch: 0.2 }],
  crewStretchLastWeek: 0.2,
  normal: { readinessGap: 0.05, clientReplyDays: 5, committedFraction: 0.1, crewStretch: 1.0 },
  locks: [
    { id: 'c-l1', label: 'Venue shortlist', owner: 'Dana', daysFromToday: 30, locked: false, breaksIf: 'dates slip out of reach' },
    { id: 'c-l2', label: 'Save the date', owner: 'Dana', daysFromToday: 45, locked: false, breaksIf: 'attendance drops' },
  ],
  vendors: [],
  openItems: [],
  activity: [
    { id: 'c-a1', daysAgo: 5, who: 'Dana', channel: 'team', text: 'Opened the brief and started a venue longlist' },
    { id: 'c-a2', daysAgo: 6, who: 'Corvus', channel: 'client', text: 'Shared the headcount and rough budget' },
  ],
}

export const events: EventRecord[] = [solaro, lumen, verdant, meridian, halcyon, corvus]

export const eventById = (id: string): EventRecord | undefined => events.find((e) => e.id === id)
