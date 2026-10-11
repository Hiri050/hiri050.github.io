export type VisualKind =
  | 'voxel'
  | 'terra'
  | 'volatility'
  | 'arc4'
  | 'f1tenth'
  | 'chess'
  | 'finance'
  | 'baccarat'

export interface Metric {
  value: string
  label: string
}

export interface PipelineNode {
  label: string
  sub?: string
  /** Rendered in the accent colour: the part of the pipeline this project is about. */
  focus?: boolean
}

export interface Media {
  src: string
  alt: string
  caption?: string
  /** Pixel-art frames should stay crisp when scaled. */
  pixelated?: boolean
  /** Light-background figures (e.g. matplotlib) get a paper frame. */
  paper?: boolean
}

export interface BarDatum {
  label: string
  value: number
  highlight?: boolean
  baseline?: boolean
}

export interface Project {
  slug: string
  title: string
  /** One-line hook shown on the exhibit. */
  hook: string
  date: string
  /** Where/why it was built: hackathon, course, independent. Omit if unknown. */
  context?: string
  role: string
  /** TODO(Hirdianshu): add team size where it applies. */
  team?: string
  tags: string[]
  visual: VisualKind

  overview: string
  problem: string
  approach: string[]
  engineering: { title: string; body: string }[]
  tech: { group: string; items: string[] }[]
  results: Metric[]
  resultsNote?: string
  chart?: { title: string; caption: string; unit: string; lowerIsBetter: boolean; data: BarDatum[] }
  pipeline?: { title: string; nodes: PipelineNode[] }
  media?: Media[]
  links: {
    /** TODO(Hirdianshu): repository URL. Leave undefined to hide the button. */
    github?: string
    demo?: string
  }
}

export interface ArchiveItem {
  title: string
  date: string
  tags: string[]
  summary: string
  status?: 'in-progress'
}

export interface Experience {
  role: string
  org: string
  location: string
  date: string
  summary: string
  work: string[]
  tech: string[]
  impact?: string[]
}

export type SkillGroupId = 'hardware' | 'systems' | 'software' | 'robotics' | 'ai' | 'quant'

export interface SkillGroup {
  id: SkillGroupId
  label: string
  blurb: string
}

export interface Skill {
  name: string
  groups: SkillGroupId[]
  /** Project slugs where this skill was actually used. */
  usedIn: string[]
}

export interface SystemNode {
  id: string
  label: string
  title: string
  body: string
  evidence: string[]
}
