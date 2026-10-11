export const profile = {
  name: 'Hirdianshu Singla',
  firstName: 'Hirdianshu',
  lastName: 'Singla',
  initials: 'HS',
  disciplines: ['Computer Engineering', 'Hardware', 'Software', 'Robotics', 'Systems'],
  tagline: 'From RTL to runtime.',
  intro:
    'I design FPGA pipelines, embedded software, autonomous robots and the models that run on them.',
  statement:
    "I'm a Computer Engineering student at UBC who builds across the whole stack: a GPU written in Verilog, the C engine that feeds it, an autonomous race car that overtakes in real time, and forecasting models that have to survive statistical scrutiny before I'll call them better.",
  location: 'Vancouver, BC',
  timezone: 'America/Vancouver',
  email: 'singlahirdianshu@gmail.com',
  github: 'https://github.com/hiri050',
  /** Leave empty to hide the LinkedIn link. */
  linkedin: 'https://www.linkedin.com/in/hirdianshu-singla-9788aa246',
  /** public/resume.pdf: Résumé B (Oct 2026). Overwrite the file to update it. */
  resume: '/resume.pdf',
  lookingFor:
    'Internships and co-op in software engineering, verification, embedded systems, robotics and systems work.',
} as const
