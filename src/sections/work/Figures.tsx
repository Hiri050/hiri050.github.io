import type { Project } from '../../content/types'

export function Pipeline({ pipeline }: { pipeline: NonNullable<Project['pipeline']> }) {
  return (
    <figure className="pipeline">
      <figcaption className="mono dim">{pipeline.title}</figcaption>
      <ol className="pipeline__flow">
        {pipeline.nodes.map((n, i) => (
          <li key={n.label} className={`pipeline__node ${n.focus ? 'is-focus' : ''}`} style={{ ['--i' as string]: i }}>
            <span className="pipeline__label">{n.label}</span>
            {n.sub && <span className="pipeline__sub mono">{n.sub}</span>}
          </li>
        ))}
      </ol>
    </figure>
  )
}

export function BarChart({ chart }: { chart: NonNullable<Project['chart']> }) {
  const max = Math.max(...chart.data.map((d) => d.value))
  const baseline = chart.data.find((d) => d.baseline)
  return (
    <figure className="barchart">
      <figcaption>
        <span className="barchart__title">{chart.title}</span>
        <span className="mono dim">{chart.caption}</span>
      </figcaption>
      <div className="barchart__plot" aria-hidden="true">
        {baseline && (
          <span className="barchart__baseline mono" style={{ left: `calc(var(--label-w) + (100% - var(--label-w) - 64px) * ${baseline.value / max})` }}>
            <span>benchmark</span>
          </span>
        )}
        {chart.data.map((d, i) => (
          <div key={d.label} className={`barchart__row ${d.highlight ? 'is-highlight' : ''}`} style={{ ['--i' as string]: i }}>
            <span className="barchart__label mono">{d.label}</span>
            <span className="barchart__track">
              <span className="barchart__bar" style={{ width: `${(d.value / max) * 100}%` }} />
            </span>
            <span className="barchart__value mono">{d.value.toFixed(4)}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>
          {chart.title}. {chart.caption}
        </caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col">{chart.unit}</th>
          </tr>
        </thead>
        <tbody>
          {chart.data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
