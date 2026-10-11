import type { Experience } from './types'

export const experience: Experience[] = [
  {
    role: 'Software Developer Intern',
    org: 'Tech Exponent System',
    location: 'Chandigarh, Punjab',
    date: 'May – Aug 2026',
    summary: 'Real-time voice infrastructure for VoiceIQ, a full-stack AI voice agent platform.',
    work: [
      'Developed the real-time voice controller in Python: live audio streaming and WebSocket orchestration for telephony providers.',
      'Integrated Gemini Live for streaming voice responses and tool-based conversation handling.',
      'Worked with the backend team on a Node.js/Express REST API with Prisma, contributing agent skills (appointment booking, complaint handling, multilingual switching) that are loaded per business through skill APIs.',
    ],
    tech: ['Python', 'WebSockets', 'Gemini Live', 'Node.js', 'Express', 'Prisma'],
  },
  {
    role: 'Trainee Analyst',
    org: 'Winux Software Solutions',
    location: 'Mohali, Punjab',
    date: 'Apr – Aug 2024 · May – Aug 2025',
    summary: 'Requirements, QA and test automation.',
    work: [
      'Designed and implemented a Python pipeline for automated log parsing, statistical analysis of pass/fail distributions, and first-fail root-cause triage reports.',
      'Derived edge-case test scenarios with QA to improve coverage.',
      'Led discovery sessions with stakeholders, wrote user stories, and mapped as-is and to-be flows so development and QA stayed aligned.',
    ],
    tech: ['Python', 'Log analysis', 'Statistics', 'QA'],
  },
]
