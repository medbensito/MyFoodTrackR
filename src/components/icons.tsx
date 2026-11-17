/** Icônes au trait, épaissies quand elles sont actives (direction A). */
type P = { size?: number; active?: boolean; filled?: boolean }

const base = (size: number, active?: boolean) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: active ? 2.4 : 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const CalendarIcon = ({ size = 22, active }: P) => (
  <svg {...base(size, active)}><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
)
export const ChefIcon = ({ size = 22, active }: P) => (
  <svg {...base(size, active)}><path d="M5 4.5h10.5a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h10.5" /></svg>
)
export const ChartIcon = ({ size = 22, active }: P) => (
  <svg {...base(size, active)} strokeWidth={active ? 2.8 : 1.9}><path d="M5 20v-6M10 20V9M15 20v-8M20 20V5" /></svg>
)
export const UserIcon = ({ size = 22, active }: P) => (
  <svg {...base(size, active)}><circle cx="12" cy="8" r="4" /><path d="M4 20.5c.8-4 4.2-6 8-6s7.2 2 8 6" /></svg>
)
export const GearIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
)
export const BackIcon = ({ size = 20 }: P) => <svg {...base(size)} strokeWidth={2}><path d="M15 5l-7 7 7 7" /></svg>
export const ChevronIcon = ({ size = 18 }: P) => <svg {...base(size)} strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
export const PlusIcon = ({ size = 18 }: P) => <svg {...base(size)} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>
export const PencilIcon = ({ size = 18 }: P) => <svg {...base(size)} strokeWidth={2}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>
export const CheckIcon = ({ size = 14 }: P) => <svg {...base(size)} strokeWidth={3}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
export const CheckCircleIcon = ({ size = 18, filled }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" fill={filled ? 'currentColor' : 'none'} />
    <path d="M8 12.5l2.7 2.7L16 9.8" stroke={filled ? 'var(--lime-ink)' : 'currentColor'} strokeWidth={2.2} />
  </svg>
)
export const RefreshIcon = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" /></svg>
)
export const PinIcon = ({ size = 12 }: P) => (
  <svg {...base(size)} strokeWidth={2}><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z" fill="currentColor" /><path d="M12 14v7" /></svg>
)
export const ClockIcon = ({ size = 22 }: P) => <svg {...base(size)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
export const TargetsIcon = ({ size = 22 }: P) => <svg {...base(size)}><path d="M5 19V9M12 19V5M19 19v-7" /><circle cx="5" cy="7" r="2" /><circle cx="19" cy="10" r="2" /></svg>
export const DatabaseIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><ellipse cx="12" cy="6" rx="7" ry="2.8" /><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8" /></svg>
)
export const SaveIcon = ({ size = 22 }: P) => <svg {...base(size)}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
export const TargetIcon = ({ size = 26 }: P) => (
  <svg {...base(size)} strokeWidth={2}><circle cx="11" cy="13" r="8" /><circle cx="11" cy="13" r="4.2" /><path d="M11 13l9-9M16.5 4h3.5v3.5" /></svg>
)
export const CartIcon = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M3 4h2.2l2.1 11h10.4l2-8H6.4" /><circle cx="9" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" /></svg>
)
export const ShareIcon = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M12 15V3.5M7.5 8L12 3.5 16.5 8" /><path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" /></svg>
)
export const StarIcon = ({ size = 20, filled }: P) => (
  <svg {...base(size)} strokeWidth={1.9}><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill={filled ? 'currentColor' : 'none'} /></svg>
)
export const TrophyIcon = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4v3h-4z" /></svg>
)
export const MoonIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" /></svg>
)
export const ScanIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}>
    <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
    <path d="M8 8.5v7M11 8.5v7M13.5 8.5v7M16 8.5v7" />
  </svg>
)
