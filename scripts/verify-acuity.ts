import { projects } from '../src/data/projects.ts'
import { assess } from '../src/domain/acuity.ts'
import { current } from '../src/domain/vitals.ts'
import { baseline } from '../src/domain/baseline.ts'

const expected: Record<string, string> = {
  hartwell: 'acute',
  keystone: 'critical',
  ferrous: 'watch',
  cobalt: 'stable',
  alder: 'stable',
  ovid: 'insufficient',
}

let pass = true
for (const p of projects) {
  const a = assess(p)
  const ok = a.acuity === expected[p.id]
  if (!ok) pass = false
  const v = p.vitals
  console.log(
    [
      ok ? 'ok ' : 'XX ',
      p.id.padEnd(9),
      `acuity=${a.acuity.padEnd(12)}`,
      `score=${a.score.toFixed(3)}`,
      `burden=${a.chronicBurden.toFixed(3)}`,
      `chronic=${a.chronic ? 'yes' : 'no '}`,
      `tth=${String(a.timeToHarmDays).padStart(3)}`,
      `drivers=${a.drivers.join(',')}`,
    ].join('  '),
  )
  if (!ok) console.log(`   expected ${expected[p.id]}`)
  // spot check pulse current vs baseline for the deterioration argument
  console.log(
    `   pulse cur=${current(v.pulse)} base=${baseline(v.pulse).toFixed(1)}  ` +
      `pressure cur=${current(v.pressure)} base=${baseline(v.pressure).toFixed(1)}`,
  )
}

console.log(pass ? '\nALL EXPECTED ACUITIES MATCH' : '\nMISMATCH, tune data or thresholds')
process.exit(pass ? 0 : 1)
