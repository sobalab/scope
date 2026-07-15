import { useState } from 'react'
import type { Project } from '../../domain/types.ts'
import type { Assessment } from '../../domain/acuity.ts'
import { askProject, starterQuestions } from '../../ai/ask.ts'

export function AskChart({ project, assessment }: { project: Project; assessment: Assessment }) {
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const starters = starterQuestions(project, assessment)

  const ask = (text: string) => {
    if (!text.trim()) return
    setAnswer(askProject(project, assessment, text))
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Ask the chart</h2>
      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault()
          ask(q)
        }}
      >
        <input
          className="ask-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Ask about ${project.client}`}
          aria-label={`Ask about ${project.client}`}
        />
        <button className="ask-send" type="submit">
          Ask
        </button>
      </form>
      {answer ? (
        <p className="ask-answer">{answer}</p>
      ) : (
        <div className="ask-starters">
          {starters.map((s) => (
            <button
              key={s}
              className="ask-starter"
              onClick={() => {
                setQ(s)
                ask(s)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
