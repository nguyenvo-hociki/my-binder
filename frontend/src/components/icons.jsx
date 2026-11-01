export function Pokeball({ size = 28, spin = false }) {
  return (
    <svg className={spin ? 'spin' : undefined} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path d="M4 50A46 46 0 0 1 96 50Z" fill="#ee1515" />
      <path d="M4 50A46 46 0 0 0 96 50Z" fill="#f5f5f5" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#14141c" strokeWidth="6" />
      <path d="M4 50h30M66 50h30" stroke="#14141c" strokeWidth="6" />
      <circle cx="50" cy="50" r="13" fill="#f5f5f5" stroke="#14141c" strokeWidth="6" />
    </svg>
  )
}

// Faint outline shown in empty pockets; the "+" fades in on hover.
export function PokeballOutline() {
  return (
    <svg className="empty-mark" viewBox="0 0 100 100" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
        <circle cx="50" cy="50" r="42" />
        <path d="M8 50h28M64 50h28" />
        <circle cx="50" cy="50" r="14" />
        <path className="plus" d="M50 43v14M43 50h14" />
      </g>
    </svg>
  )
}

function Icon({ size = 18, children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const SearchIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
)

export const PencilIcon = (p) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
)

export const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)

export const CloseIcon = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const GridIcon = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Icon>
)

export const BookIcon = (p) => (
  <Icon {...p}>
    <path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z" />
    <path d="M12 6.5v13" />
  </Icon>
)

// The point of each chevron is on one side, but the drawn shape spans x 9-15 of 24, so its box is centred on the icon.
export const ChevronLeftIcon = (p) => (
  <Icon {...p}>
    <path d="m15 6-6 6 6 6" />
  </Icon>
)

export const ChevronRightIcon = (p) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
)

export const ChevronIcon = (p) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)
