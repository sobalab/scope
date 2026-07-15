/*
  Six client projects with 14 days of authored vitals each (Ovid has 12, it is new).
  The archetypes are deliberate. Acuity is never written here; it is computed by
  assess() from these trends. If you change a trend, the acuity can change, which is
  the point.

    Hartwell   acute, featured. Pulse deteriorated hard this week.
    Keystone   critical, seeded snoozed, and fully silent on the trail. Abandoned.
    Ferrous    watch. Budget running ahead of scope with weeks of runway.
    Cobalt     stable with a chronic marker. Objectively poor, but flat for two years.
    Alder      stable, wrapping up. Every vital calm, most milestones delivered.
    Ovid       insufficient data. Twelve days old, no baseline yet.

  The vitals, history, and facts below are unchanged from the verified model. The added
  fields (blocker kind, resourcing, milestone slip history) feed the detail page and do
  not touch acuity.
*/

import type { Project } from '../domain/types.ts'
import { flat, trend, vital } from './history.ts'

const hartwell: Project = {
  id: 'hartwell',
  client: 'Hartwell',
  engagement: 'Member portal rebuild',
  lead: 'Priya',
  ageDays: 96,
  vitals: {
    pulse: vital('pulse', trend(1.5, 9, { texture: 0.4 }), [
      { label: 'client quiet', value: '9 days' },
      { label: 'last shipped', value: '5 days ago' },
    ]),
    pressure: vital('pressure', trend(6, 8), [
      { label: 'hours used', value: '76%' },
      { label: 'scope delivered', value: '68%' },
    ]),
    temperature: vital('temperature', trend(2, 4), [
      { label: 'new requests, 14 days', value: '4' },
      { label: 'baseline', value: '2' },
    ]),
    respiration: vital('respiration', trend(5, 6), [
      { label: 'opened vs closed, 14 days', value: '3 to 2' },
      { label: 'oldest open blocker', value: '6 days' },
    ]),
  },
  budget: { hoursUsed: 471, hoursBudget: 620, scopeDelivered: 68 },
  milestones: [
    { id: 'h1', title: 'Discovery sign off', dueInDays: -40, state: 'delivered' },
    { id: 'h2', title: 'Design review', dueInDays: 3, state: 'current', gating: true },
    { id: 'h3', title: 'Dashboard build', dueInDays: 12, state: 'upcoming' },
    { id: 'h4', title: 'Beta launch', dueInDays: 34, state: 'upcoming' },
  ],
  blockers: [
    {
      id: 'hb1',
      kind: 'blocker',
      title: 'Design sign off from the brand team',
      ageDays: 6,
      owner: 'Client, brand team',
      state: 'open',
    },
    {
      id: 'hb2',
      kind: 'question',
      title: 'Which auth provider the client wants to standardize on',
      ageDays: 7,
      owner: 'Client, product',
      state: 'open',
    },
  ],
  activity: [
    { id: 'ha1', daysAgo: 5, kind: 'ship', who: 'Devon', text: 'Shipped the saved payments view' },
    { id: 'ha2', daysAgo: 5, kind: 'request', who: 'Client', text: 'Asked for a spending summary card' },
    { id: 'ha3', daysAgo: 9, kind: 'message', who: 'Client', text: 'Last reply on the design thread' },
    { id: 'ha4', daysAgo: 12, kind: 'milestone', who: 'Priya', text: 'Discovery signed off' },
  ],
  resourcing: [
    { name: 'Priya', role: 'Lead', allocation: 30 },
    { name: 'Devon', role: 'Frontend', allocation: 80 },
    { name: 'Ren', role: 'Design', allocation: 40 },
  ],
  gate: { label: 'Design review', daysAway: 3, blocks: 'dev on the member dashboard' },
}

const keystone: Project = {
  id: 'keystone',
  client: 'Keystone',
  engagement: 'Checkout replatform',
  lead: 'Marcus',
  ageDays: 132,
  initiallySnoozed: true,
  vitals: {
    pulse: vital('pulse', trend(4, 17), [
      { label: 'client quiet', value: '17 days' },
      { label: 'last shipped', value: '16 days ago' },
    ]),
    pressure: vital('pressure', trend(12, 22), [
      { label: 'hours used', value: '104%' },
      { label: 'scope delivered', value: '82%' },
    ]),
    temperature: vital('temperature', trend(3, 5), [
      { label: 'new requests, 14 days', value: '5' },
      { label: 'baseline', value: '3' },
    ]),
    respiration: vital('respiration', trend(9, 19), [
      { label: 'opened vs closed, 14 days', value: '6 to 2' },
      { label: 'oldest open blocker', value: '19 days' },
    ]),
  },
  budget: { hoursUsed: 1040, hoursBudget: 1000, scopeDelivered: 82 },
  milestones: [
    { id: 'k1', title: 'Payments integration', dueInDays: -25, state: 'delivered' },
    {
      id: 'k2',
      title: 'Fraud review',
      dueInDays: -4,
      state: 'slipped',
      gating: true,
      slippedFrom: -12,
      slipCount: 2,
    },
    { id: 'k3', title: 'Go live', dueInDays: 2, state: 'current', gating: true },
    { id: 'k4', title: 'Post launch hardening', dueInDays: 20, state: 'upcoming' },
  ],
  blockers: [
    {
      id: 'kb1',
      kind: 'blocker',
      title: 'PCI sign off from client security',
      ageDays: 19,
      owner: 'Client, security',
      state: 'open',
    },
    {
      id: 'kb2',
      kind: 'risk',
      title: 'Staging has drifted from production',
      ageDays: 8,
      owner: 'Keystone platform',
      state: 'open',
    },
  ],
  activity: [
    { id: 'ka2', daysAgo: 16, kind: 'ship', who: 'Ren', text: 'Shipped the refund flow to staging' },
    { id: 'ka3', daysAgo: 17, kind: 'message', who: 'Client', text: 'Last reply from the security lead' },
    { id: 'ka4', daysAgo: 19, kind: 'blocker', who: 'Ren', text: 'Opened the PCI sign off blocker' },
  ],
  resourcing: [
    { name: 'Marcus', role: 'Lead', allocation: 15 },
    { name: 'Ren', role: 'Backend', allocation: 20 },
  ],
  gate: { label: 'Go live', daysAway: 2, blocks: 'the launch on the 3rd' },
}

const ferrous: Project = {
  id: 'ferrous',
  client: 'Ferrous',
  engagement: 'Data pipeline migration',
  lead: 'Priya',
  ageDays: 74,
  vitals: {
    pulse: vital('pulse', trend(2, 3), [
      { label: 'client replied', value: '2 days ago' },
      { label: 'last shipped', value: '2 days ago' },
    ]),
    pressure: vital('pressure', trend(15, 26), [
      { label: 'hours used', value: '80%' },
      { label: 'scope delivered', value: '54%' },
    ]),
    temperature: vital('temperature', flat(2), [
      { label: 'new requests, 14 days', value: '2' },
      { label: 'baseline', value: '2' },
    ]),
    respiration: vital('respiration', trend(4, 5), [
      { label: 'opened vs closed, 14 days', value: '2 to 2' },
      { label: 'oldest open blocker', value: '5 days' },
    ]),
  },
  budget: { hoursUsed: 720, hoursBudget: 900, scopeDelivered: 54 },
  milestones: [
    { id: 'f1', title: 'Schema mapping', dueInDays: -18, state: 'delivered' },
    { id: 'f2', title: 'Migration dry run', dueInDays: 9, state: 'current' },
    { id: 'f3', title: 'Cutover', dueInDays: 28, state: 'upcoming' },
  ],
  blockers: [
    {
      id: 'fb1',
      kind: 'blocker',
      title: 'Warehouse credential rotation',
      ageDays: 5,
      owner: 'Ferrous data engineering',
      state: 'open',
    },
  ],
  activity: [
    { id: 'fa1', daysAgo: 2, kind: 'ship', who: 'Devon', text: 'Shipped the extract step for orders' },
    { id: 'fa2', daysAgo: 3, kind: 'message', who: 'Client', text: 'Confirmed the cutover window' },
    { id: 'fa3', daysAgo: 6, kind: 'request', who: 'Client', text: 'Asked to include archived accounts' },
  ],
  resourcing: [
    { name: 'Priya', role: 'Lead', allocation: 25 },
    { name: 'Devon', role: 'Data engineer', allocation: 70 },
  ],
}

const cobalt: Project = {
  id: 'cobalt',
  client: 'Cobalt Bank',
  engagement: 'Compliance dashboard',
  lead: 'Marcus',
  ageDays: 720,
  vitals: {
    pulse: vital('pulse', flat(9), [
      { label: 'client quiet', value: '9 days' },
      { label: 'usual range', value: '8 to 10 days' },
    ]),
    pressure: vital('pressure', flat(17), [
      { label: 'hours used', value: '88%' },
      { label: 'scope delivered', value: '71%' },
    ]),
    temperature: vital('temperature', flat(2), [
      { label: 'new requests, 14 days', value: '2' },
      { label: 'baseline', value: '2' },
    ]),
    respiration: vital('respiration', flat(15), [
      { label: 'opened vs closed, 14 days', value: '3 to 3' },
      { label: 'oldest open blocker', value: '15 days' },
    ]),
  },
  budget: { hoursUsed: 1760, hoursBudget: 2000, scopeDelivered: 71 },
  milestones: [
    { id: 'c1', title: 'Phase 1 controls', dueInDays: -300, state: 'delivered' },
    {
      id: 'c2',
      title: 'Phase 2 reporting',
      dueInDays: -60,
      state: 'slipped',
      slippedFrom: -180,
      slipCount: 4,
    },
    { id: 'c3', title: 'Phase 3 audit view', dueInDays: 40, state: 'current' },
  ],
  blockers: [
    {
      id: 'cb1',
      kind: 'risk',
      title: 'Legal review of data retention',
      ageDays: 15,
      owner: 'Client, legal',
      state: 'open',
    },
    {
      id: 'cb2',
      kind: 'question',
      title: 'Which SSO vendor the client will settle on',
      ageDays: 12,
      owner: 'Cobalt IT',
      state: 'open',
    },
  ],
  activity: [
    { id: 'cba1', daysAgo: 1, kind: 'ship', who: 'Priya', text: 'Small config fix and a review pass' },
    { id: 'cba2', daysAgo: 3, kind: 'milestone', who: 'System', text: 'Phase 2 reporting slipped again' },
    { id: 'cba3', daysAgo: 9, kind: 'message', who: 'Client', text: 'Routine check in from the PMO' },
    { id: 'cba4', daysAgo: 11, kind: 'ship', who: 'Ren', text: 'Shipped the controls export' },
  ],
  resourcing: [
    { name: 'Marcus', role: 'Lead', allocation: 20 },
    { name: 'Priya', role: 'Frontend', allocation: 30 },
  ],
}

const alder: Project = {
  id: 'alder',
  client: 'Alder',
  engagement: 'Brand site relaunch',
  lead: 'Priya',
  ageDays: 88,
  vitals: {
    pulse: vital('pulse', flat(2), [
      { label: 'client replied', value: '1 day ago' },
      { label: 'last shipped', value: 'today' },
    ]),
    pressure: vital('pressure', flat(2), [
      { label: 'hours used', value: '92%' },
      { label: 'scope delivered', value: '90%' },
    ]),
    temperature: vital('temperature', flat(1), [
      { label: 'new requests, 14 days', value: '1' },
      { label: 'baseline', value: '1' },
    ]),
    respiration: vital('respiration', flat(2), [
      { label: 'opened vs closed, 14 days', value: '1 to 3' },
      { label: 'open blockers', value: 'none' },
    ]),
  },
  budget: { hoursUsed: 552, hoursBudget: 600, scopeDelivered: 90 },
  milestones: [
    { id: 'a1', title: 'Content migration', dueInDays: -20, state: 'delivered' },
    { id: 'a2', title: 'Design QA', dueInDays: -8, state: 'delivered' },
    { id: 'a3', title: 'Launch', dueInDays: 4, state: 'current' },
    { id: 'a4', title: 'Handoff', dueInDays: 9, state: 'upcoming' },
  ],
  blockers: [],
  activity: [
    { id: 'aa1', daysAgo: 0, kind: 'ship', who: 'Devon', text: 'Shipped the last landing page' },
    { id: 'aa2', daysAgo: 1, kind: 'message', who: 'Client', text: 'Approved the launch checklist' },
    { id: 'aa3', daysAgo: 8, kind: 'milestone', who: 'Priya', text: 'Design QA signed off' },
  ],
  resourcing: [
    { name: 'Priya', role: 'Lead', allocation: 30 },
    { name: 'Devon', role: 'Frontend', allocation: 55 },
  ],
}

const ovid: Project = {
  id: 'ovid',
  client: 'Ovid',
  engagement: 'Onboarding flow',
  lead: 'Marcus',
  ageDays: 12,
  vitals: {
    pulse: vital('pulse', trend(2, 3, { len: 12, pivot: 6 }), [
      { label: 'client replied', value: '2 days ago' },
      { label: 'last shipped', value: '1 day ago' },
    ]),
    pressure: vital('pressure', trend(4, 6, { len: 12, pivot: 6 }), [
      { label: 'hours used', value: '22%' },
      { label: 'scope delivered', value: '16%' },
    ]),
    temperature: vital('temperature', trend(2, 3, { len: 12, pivot: 6 }), [
      { label: 'new requests, 12 days', value: '3' },
      { label: 'baseline', value: 'none yet' },
    ]),
    respiration: vital('respiration', flat(3, { len: 12 }), [
      { label: 'opened vs closed, 12 days', value: '2 to 1' },
      { label: 'oldest open blocker', value: '3 days' },
    ]),
  },
  budget: { hoursUsed: 88, hoursBudget: 400, scopeDelivered: 16 },
  milestones: [
    { id: 'o1', title: 'Kickoff', dueInDays: -12, state: 'delivered' },
    { id: 'o2', title: 'First prototype', dueInDays: 6, state: 'current' },
    { id: 'o3', title: 'Usability round', dueInDays: 20, state: 'upcoming' },
  ],
  blockers: [
    {
      id: 'ob1',
      kind: 'question',
      title: 'Analytics access from the growth team',
      ageDays: 3,
      owner: 'Ovid growth',
      state: 'open',
    },
  ],
  activity: [
    { id: 'oa1', daysAgo: 1, kind: 'ship', who: 'Ren', text: 'Shared the first onboarding screens' },
    { id: 'oa2', daysAgo: 12, kind: 'milestone', who: 'Marcus', text: 'Project kicked off' },
  ],
  resourcing: [
    { name: 'Marcus', role: 'Lead', allocation: 30 },
    { name: 'Ren', role: 'Design', allocation: 50 },
  ],
}

export const projects: Project[] = [hartwell, keystone, ferrous, cobalt, alder, ovid]

export const projectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id)
