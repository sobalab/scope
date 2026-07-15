# Ardent

A production board for an eight person event design firm running six client events at
once. The producer opens it every morning with one question: which event do I chase
today? It runs with no API key.

```
pnpm install && pnpm dev
```

## Why readiness against a fixed date beats a status board

The date does not move. The gala happens on its day whether the florist confirmed or not,
so "how long have we been working" and "what percent complete are we" are the wrong
questions. The right one is how ready the event is against how little time is left. An
event 60% built with three weeks to go is calm; the same 60% with nine days to go is the
fire. Every reading in Ardent is built on that ratio, and the board sorts by how soon the
trouble bites, not by name or date.

The hero chart, the horizon, draws this directly. Each event is an arc about one shared
origin. Radius is time left, so the soonest event is the tight inner ring about to land.
The arc runs kickoff to show day with a lit head at today, solid behind, dashed ahead.
Readiness rides a second line inside the same arc, and when it falls behind the clock a
wedge opens between the two lines. That wedge is the whole product in one mark: you can
see the pop up is 12 days out and only 60% ready without reading a number. Exactly one
event may glow, the most urgent, and only when it is at risk. Light is data here. When
nothing glows, that calm is itself the answer.

## Lock dates

The real deadlines are not the event, they are the locks before it: final headcount with
the venue, the menu with the caterer, the floor plan before rentals ship, the permit
window. Missing one does not move the date, it makes the event cost more or fall apart.
The detail page is built around them: each lock shows what locks, when, who owns it, and
what breaks if it is missed. Passed locks are solid, upcoming are dashed, and a missed
lock is the loudest thing in the product. Show day sits at the end as a fixed point.

Dashed versus solid is one grammar everywhere: a dashed vendor is unconfirmed, a solid
vendor is contracted; a dashed lock is coming, a solid one is done; the dashed part of an
arc is the work still ahead.

## New versus normal

Every producer knows their clients, and some clients always run late. Flagging Verdant
every morning for being Verdant is how a board teaches you to ignore it. So each signal
is judged against how that client normally runs, not a universal bar. The standing logic
in `src/ardent/domain/standing.ts` is short and meant to be read: what moved away from
the client's own baseline drives the standing, where it sits is capped context. The
baseline is drawn as hatching behind every live reading, on the arcs and in the rail, so
"behind but normal" and "just slipped" look different at a glance. Verdant sits behind
and quiet with a plain marker saying so; Solaro jumped because it slipped this week.

## Written lines show their source

The writing appears in three places: the morning read on the board, the what to watch
line on each event, and ask about this event. All three are composed from the same
signals the charts draw, so every sentence traces to a real number, and the numbers
render as chips beside the text. It advises and never decides, it says when a read is
soft ("Corvus is 180 days out with almost nothing logged yet"), it streams with skeletons
shaped like the incoming text, and a failed response has a retry that keeps your place.
With no key set it streams the composed text on a realistic delay, which is also why the
claims can never drift from the data. Press ? for shortcuts, and ! to see the failure
state on demand.

## States

All reachable in the running app: loading skeletons on both pages; the missed lock on
Solaro; behind but normal on Verdant; too new to read on Corvus; landed and in teardown
on Halcyon; the crew clash between Solaro and Lumen; set aside with one keystroke,
undoable from the toast, with the return time stated; the failed written response with
retry; and the quiet day, which appears once the hot events are handled and says what the
nearest open lock is rather than showing a blank.

## Keyboard

J and K move between arcs, Enter opens, arrows walk a focused arc day by day, S sets
aside, Esc closes, ? shows the sheet. The arcs are a roving tabindex group with visible
focus, and under 900px they become stacked runway bars carrying the same reading.

## Left out on purpose

No sign in, billing, account settings, event creation, timesheets, or client facing
views. The six events are authored data with enough history for the trends to be real;
the shape they derive from (locks, vendors, replies, allocations) is what the firm's
calendar, email, and booking tools would feed.

## With more time

Live data adapters behind the same signal interface, a week-over-week replay of the
horizon so Monday's board can be compared with last Monday's, per-client baseline
learning instead of authored normals, and crew rebalancing suggestions when two events
collide on a weekend.

## Structure

```
src/ardent/
  domain/    types, signals, standing (the logic that decides who needs chasing)
  data/      six authored events
  ai/        compose (the grounded writing), useStream (mock streaming)
  board/     Board, Horizon (the arc chart and its runway reflow)
  detail/    EventDetail, Rail (signals, budget, crew, ask, actions)
  shared/    standing presentation, streamed text, toast
  router.tsx History API router with scroll preservation
```
