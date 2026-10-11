import type { ReactNode } from 'react'

interface Props {
  index: string
  kicker: string
  title: ReactNode
  lead?: ReactNode
  id?: string
}

export function SectionHead({ index, kicker, title, lead, id }: Props) {
  return (
    <header className="section-head">
      <p className="section-head__meta mono" data-reveal>
        <span className="section-head__index">{index}</span>
        <span>{kicker}</span>
      </p>
      <h2 id={id} className="section-head__title" data-split>
        {title}
      </h2>
      {lead && (
        <p className="section-head__lead" data-reveal>
          {lead}
        </p>
      )}
    </header>
  )
}
