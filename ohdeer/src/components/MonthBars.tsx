// A tiny bar chart: one bar per month, in the type's color.
// Drawn as SVG so it scales crisply. Bars have slightly lopsided tops so
// they look hand-drawn rather than ruler-straight.
import { MONTH_NAMES } from '../lib/dates'

interface Props {
  counts: number[] // 12 numbers
  color: string    // CSS color, e.g. 'var(--c-teal)'
  highlightMonth?: number // 1–12: draw this month's label bolder (the current month)
}

export default function MonthBars({ counts, color, highlightMonth }: Props) {
  const max = Math.max(1, ...counts)
  const W = 240, H = 60, barW = 13, gap = (W - barW * 12) / 11
  const summary = counts.map((c, i) => `${MONTH_NAMES[i]}: ${c}`).join(', ')
  return (
    <svg className="month-bars" viewBox={`0 0 ${W} ${H + 14}`} role="img" aria-label={summary}>
      {counts.map((count, i) => {
        const x = i * (barW + gap)
        const h = count === 0 ? 0 : Math.max(4, (count / max) * H)
        const top = H - h
        // a lopsided top: left corner a hair higher than the right
        const d = `M${x} ${H}V${top + 2}Q${x + barW / 2} ${top - 2} ${x + barW} ${top + 1.5}V${H}Z`
        return (
          <g key={i}>
            <title>{`${MONTH_NAMES[i]}: ${count}`}</title>
            {/* a faint baseline dash so empty months still show */}
            <rect x={x} y={H - 1.5} width={barW} height={1.5} rx={0.75} fill="currentColor" opacity={0.2} />
            {count > 0 && <path d={d} fill={color} />}
            <text x={x + barW / 2} y={H + 11} textAnchor="middle"
              className={highlightMonth === i + 1 ? 'bar-label current' : 'bar-label'}>
              {MONTH_NAMES[i][0]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
