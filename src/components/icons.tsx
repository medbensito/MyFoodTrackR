type P = { size?: number; filled?: boolean }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const CalendarIcon = ({ size = 24, filled }: P) => (
  <svg {...base(size)}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" fill={filled ? 'currentColor' : 'none'} />
    <path d="M8 3v4M16 3v4" />
    <path d="M3.5 10h17" stroke={filled ? 'var(--tab-fill-contrast)' : 'currentColor'} />
    {filled && <path d="M8 14h2M14 14h2" stroke="var(--tab-fill-contrast)" />}
  </svg>
)

export const ChefIcon = ({ size = 24, filled }: P) => (
  <svg {...base(size)}>
    <path
      d="M7 18.5V14a4 4 0 0 1-.9-7.9A5 5 0 0 1 12 3.5a5 5 0 0 1 5.9 2.6A4 4 0 0 1 17 14v4.5z"
      fill={filled ? 'currentColor' : 'none'}
    />
    <path d="M7 18.5h10V21H7z" fill={filled ? 'currentColor' : 'none'} />
  </svg>
)

export const ChartIcon = ({ size = 24, filled }: P) => (
  <svg {...base(size)} strokeWidth={filled ? 2.6 : 1.8}>
    <path d="M5 20v-6M10 20V9M15 20v-8M20 20V5" />
  </svg>
)

export const UserIcon = ({ size = 24, filled }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="8" r="4" fill={filled ? 'currentColor' : 'none'} />
    <path d="M4 20.5c.8-4 4.2-6 8-6s7.2 2 8 6z" fill={filled ? 'currentColor' : 'none'} />
  </svg>
)

export const GearIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
)

export const BackIcon = ({ size = 24 }: P) => (
  <svg {...base(size)}><path d="M15 5l-7 7 7 7" /></svg>
)

export const ChevronIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M9 5l7 7-7 7" /></svg>
)

export const ArrowIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)

export const SearchIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.3-4.3" /></svg>
)

export const PlusIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>
)

export const PencilIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>
)

export const CheckCircleIcon = ({ size = 18, filled }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" fill={filled ? 'currentColor' : 'none'} />
    <path d="M8 12.5l2.7 2.7L16 9.8" stroke={filled ? '#fff' : 'currentColor'} />
  </svg>
)

export const FlameIcon = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M12.6 2.5c.4 3-1.3 4.6-2.7 6.1C8.4 10.2 7 11.7 7 14.4A5 5 0 0 0 12 19.5a5 5 0 0 0 5-5c0-2-1-3.5-1.8-4.4.1 1.3-.4 2.4-1.4 2.9.3-3.6-.6-7.6-1.2-10.5z" />
    <path fill="rgba(255,255,255,0.55)" d="M12 19.5a2.6 2.6 0 0 1-2.6-2.6c0-1.6 1.3-2.5 2.2-3.6.3 1 1 1.4 1.6 1.2.9 1 1.4 1.7 1.4 2.4a2.6 2.6 0 0 1-2.6 2.6z" />
  </svg>
)

export const LeafIcon = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M12 21c-.5 0-.9-.4-.9-.9v-4.6C8 15.2 5 13.1 5 9.4c0-.9.6-1.4 1.4-1.3 2.7.3 4.6 1.9 5.6 4 1-2.1 2.9-3.7 5.6-4 .8-.1 1.4.4 1.4 1.3 0 3.7-3 5.8-6.1 6.1v4.6c0 .5-.4.9-.9.9z" />
    <path fill="currentColor" d="M12 10.6C10.8 9 10.5 7.1 11.3 5c.2-.5.6-1 .7-1 .1 0 .5.5.7 1 .8 2.1.5 4-.7 5.6z" />
  </svg>
)

export const DropIcon = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M12 3c2.4 3.3 6 7.3 6 11a6 6 0 0 1-12 0c0-3.7 3.6-7.7 6-11z" />
  </svg>
)

export const TargetIcon = ({ size = 30 }: P) => (
  <svg {...base(size)} strokeWidth={2}>
    <circle cx="11" cy="13" r="8" /><circle cx="11" cy="13" r="4.2" /><circle cx="11" cy="13" r="0.8" fill="currentColor" />
    <path d="M11 13l9-9M16.5 4h3.5v3.5" />
  </svg>
)

export const ScaleIcon = ({ size = 24 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M7 4h10a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
    <path fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" d="M9 9.5a4 4 0 0 1 6 0M12 9.5l1-1.6" />
  </svg>
)

export const RulerIcon = ({ size = 24 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}>
    <path d="M12 4v16M8 4h8M8 20h8" />
  </svg>
)

export const CakeIcon = ({ size = 24 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M5 11h14a2 2 0 0 1 2 2v7H3v-7a2 2 0 0 1 2-2z" />
    <path fill="currentColor" d="M7 6.5h2V11H7zM11 6.5h2V11h-2zM15 6.5h2V11h-2z" />
    <path fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" d="M3.5 15.5c1.4 1.2 2.8 1.2 4.2 0s2.8-1.2 4.3 0 2.8 1.2 4.2 0 2.8-1.2 4.3 0" />
  </svg>
)

export const ClockIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
)

export const TargetsIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M5 19V9M12 19V5M19 19v-7" /><circle cx="5" cy="7" r="2" /><circle cx="12" cy="3.5" r="0" /><circle cx="19" cy="10" r="2" /></svg>
)

export const DatabaseIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><ellipse cx="12" cy="6" rx="7" ry="2.8" /><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8" /></svg>
)

export const PinIcon = ({ size = 16, filled }: P) => (
  <svg {...base(size)}>
    <path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z" fill={filled ? 'currentColor' : 'none'} />
    <path d="M12 14v7" />
  </svg>
)

export const RefreshIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" /></svg>
)

export const SparkIcon = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></svg>
)
