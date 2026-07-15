# Fieldwork

An internal dashboard for a small product studio to see, at a glance, which client
projects are on track, which need a person today, and what to do next. It runs with no
API key.

```
pnpm install && pnpm dev
```

## The health model

Every project carries four vitals, each with a reading, a normal band, a week over week
delta, and a 14 day trend.

- **Pulse** is momentum. Days since either side moved. Silence is the earliest warning.
- **Pressure** is budget against scope. Points of budget spent ahead of scope delivered.
- **Temperature** is scope volatility. New requests added in two weeks.
- **Respiration** is blocker flow. The age of the oldest open blocker.

Acuity is one of `stable`, `watch`, `acute`, `critical`, sorted by time to harm rather
than severity alone. It is never written into the data. It is computed in
`src/domain/acuity.ts` from the vitals, so if you change a trend the acuity can change,
which is the point. The scoring function is short and meant to be read.

### Acute versus chronic

This is the most important idea in the product. Every vital is judged against the
project's own baseline, not a global one. A project can be objectively poor and still
read `stable` because nothing changed. Cobalt Bank has slipped for two years, so it
carries a `chronic` marker and stays quiet. Deterioration against a project's own normal
is the signal. Absolute value is context. See `src/domain/baseline.ts`.

## Attention trails, the overview chart

The first thing on the page is `src/dashboard/AttentionTrails.tsx`. One row per project,
14 days left to right, today pinned at the right edge. Each day a project got attention
becomes a dot, and the dots ride a single filled ribbon toward today.

Every mark encodes a real value.

- **x** is the day. **y** is the project row, sorted sickest first.
- **Dot area** is the volume of attention that day, commits and messages and hours and
  deliverables. A trace day is a small dot, not an absent one.
- **Ribbon width** is momentum, a recency weighted average, so a lone spike reads thin
  and a sustained run reads thick. **Ribbon opacity** brightens toward the head.
- **The gap** is the silence. When a project goes quiet the ribbon ends at its last dot
  and bare background runs to the today line. The gap's width is literally the number of
  days since anyone touched the project. Keystone has been silent for 14 days, and its
  empty row is the first thing you see.

It is plain SVG so hover, focus, and keyboard work without reimplementing them, and it
reads correctly as a still image in a screen recording. The colors are a cool slate ramp
that deepens with severity, so the chart never becomes a rainbow and agrees with the rest
of the product. On load the trails wipe in left to right and stop at each head, so the
motion peters out on the gaps. It respects `prefers-reduced-motion`.

## Navigation

The overview is home. `/project/:id` is a full page with a real, shareable URL, not a
modal, because it is a page you sit inside while working through blockers and milestones.
A trail row, a ledger card, and a project tab are three doors to the same detail page.
The overview's scroll position is preserved when you come back, so you never lose your
place. The router is a small wrapper on the History API in `src/router.tsx`, no
dependency.

## AI

Three placements, all grounded in the project's own numbers so a reply can be traced to a
reading, and all working with no API key.

- The **rounds briefing** at the top names the one project that needs a person today and
  says what changed, in specific numbers.
- The **chief complaint** on each project is one sentence naming why it is at its acuity,
  with its supporting vitals shown underneath.
- **Ask the chart** on the detail page answers scoped questions from the vitals. It says
  when the data is thin rather than guessing.

They are composed from the data in `src/ai/`, so they cannot drift from the vitals.

## States

Reachable in the running app:

- Chart: loading skeleton, insufficient data (Ovid, a short trail with a start marker),
  fully silent (Keystone, an anchor and a label), and all healthy (the "on track" filter
  shows a calm field of trails reaching the edge).
- Detail: loading skeletons, wrapping up (Alder), snoozed (Keystone), and three distinct
  empty states written as their own sentences: no blockers (Alder), no open questions
  (Keystone), and no recent activity (Keystone).

## Design

Frosted Glass, a cool near monochrome system with one slate accent. Health escalates by
position and depth, never a traffic light. No monospace anywhere.

## What is deliberately left out

Authentication, billing, account settings, project creation, time tracking, and any
client facing view. The attention data is authored to tell a clear story rather than
pulled from real tools. The shape it derives from, a per day volume and a note, is what a
commit, chat, and time tracking feed would provide.

## Structure

```
src/
  domain/     health model: types, vitals, baseline, acuity, attention
  data/       projects, history, attention (six client projects, authored trends)
  ai/         diagnose (briefing, chief complaint, next actions), ask
  ds/         Frosted Glass design system: tokens and primitives
  dashboard/  Overview, AttentionTrails, VitalBar, and the detail page
  router.tsx  History API router with scroll preservation
```
