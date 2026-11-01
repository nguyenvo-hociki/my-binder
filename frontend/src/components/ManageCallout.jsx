import { PER_PAGE } from '../config'
import { Pokeball } from './icons'

// "Checklist" band: collection progress plus the binder-management actions.
export default function ManageCallout({
  filled,
  total,
  wish,
  isOpen,
  canRemoveSheet,
  onAddSheet,
  onRemoveSheet,
  onClear,
  onClose,
}) {
  const pct = total ? Math.round((filled / total) * 100) : 0
  // The buttons share one style that fades from solid (first) to light (last); --t is each one's place in that fade.
  const actions = [
    { key: 'add', label: 'Add a sheet', icon: '＋', onClick: onAddSheet },
    { key: 'remove', label: 'Remove empty sheet', onClick: onRemoveSheet, disabled: !canRemoveSheet },
    { key: 'clear', label: 'Clear all cards', onClick: onClear, disabled: !filled },
    ...(isOpen ? [{ key: 'close', label: 'Close binder', onClick: onClose }] : []),
  ]
  return (
    <section className="callout-sec on-light" aria-labelledby="callout-title">
      <i className="spark" style={{ left: 60, top: 36 }} aria-hidden="true" />
      <i className="spark spark-sm" style={{ right: 96, top: 52 }} aria-hidden="true" />

      <div className="callout">
        <i className="callout-line cl-1" aria-hidden="true" />
        <i className="callout-line cl-2" aria-hidden="true" />

        <div className="callout-visual" aria-hidden="true">
          <i className="halo" />
          <Pokeball size={150} />
        </div>

        <div className="callout-copy">
          <span className="overline">Your collection</span>
          <h2 id="callout-title">
            {filled} of {total} pockets filled
          </h2>
          <div className="meter" role="progressbar" aria-label="Binder filled" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <p>
            {wish > 0
              ? `${wish} ${wish === 1 ? 'card is' : 'cards are'} still on your wishlist. They carry a gold badge until you tap “I own it now” or swap in a photo of the real card.`
              : 'Cards you download from the database get a gold wishlist badge until you own them. Photos you import stay on this device.'}
          </p>
        </div>

        <div className="callout-actions">
          {actions.map((a, i) => {
            const t = actions.length > 1 ? i / (actions.length - 1) : 0
            return (
              <button
                key={a.key}
                className="action action-fade"
                style={{ '--t': t }}
                disabled={a.disabled}
                onClick={a.onClick}
              >
                <span>{a.label}</span>
                {a.icon && <i aria-hidden="true">{a.icon}</i>}
              </button>
            )
          })}
          <small>One sheet = two pages ({PER_PAGE * 2} pockets)</small>
        </div>
      </div>
    </section>
  )
}
