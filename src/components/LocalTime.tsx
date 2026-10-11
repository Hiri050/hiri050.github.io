import { useEffect, useState } from 'react'
import { profile } from '../content/profile'

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: profile.timezone,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function LocalTime() {
  const [now, setNow] = useState(() => fmt.format(new Date()))
  useEffect(() => {
    const id = window.setInterval(() => setNow(fmt.format(new Date())), 15_000)
    return () => window.clearInterval(id)
  }, [])
  return <time>{now} PT</time>
}
