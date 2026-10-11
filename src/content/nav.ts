export const nav = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
] as const

export const navIndex = (id: string) => {
  const i = nav.findIndex((n) => n.id === id)
  return i < 0 ? '00' : String(i + 1).padStart(2, '0')
}

export const navLabel = (id: string) => nav.find((n) => n.id === id)?.label ?? 'Index'
