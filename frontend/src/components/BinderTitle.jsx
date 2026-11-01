import { useEffect, useRef, useState } from 'react'
import { CheckIcon, CloseIcon, PencilIcon } from './icons'

// The binder's title block: the "Binder view" label with a small pencil beside it, and the title below. The pencil
// opens an input; nothing changes until Save (or Enter). Cancel (or Escape) leaves the title as it was.
export default function BinderTitle({ label, title, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const input = useRef(null)
  const pencil = useRef(null)
  const wasEditing = useRef(false)

  // Focus follows the mode: into the input when editing starts, back to the pencil when it ends.
  useEffect(() => {
    if (editing) {
      input.current?.focus()
      input.current?.select()
    } else if (wasEditing.current) {
      pencil.current?.focus()
    }
    wasEditing.current = editing
  }, [editing])

  function start() {
    setDraft(title)
    setEditing(true)
  }

  function save(e) {
    e.preventDefault()
    const next = draft.trim()
    if (!next) return
    onSave(next)
    setEditing(false)
  }

  const labelRow = (
    <div className="g-label-row">
      <span className="overline">{label}</span>
      {!editing && (
        <button ref={pencil} type="button" className="title-btn pencil" data-tip="Edit title" aria-label="Edit binder title" onClick={start}>
          <PencilIcon size={15} />
        </button>
      )}
    </div>
  )

  if (!editing) {
    return (
      <>
        {labelRow}
        <div className="g-title-row">
          <h2 id="gallery-title" className="g-title-text">
            {title || 'My Binder'}
          </h2>
        </div>
      </>
    )
  }

  return (
    <>
      {labelRow}
      <div className="g-title-row is-editing">
        <form
          className="g-title-form"
          onSubmit={save}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              setEditing(false)
            }
          }}
        >
          <input
            ref={input}
            className="g-title-input"
            value={draft}
            maxLength={40}
            aria-label="Binder title"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="title-btn primary" data-tip="Save" aria-label="Save title" disabled={!draft.trim()}>
            <CheckIcon size={18} />
          </button>
          <button type="button" className="title-btn" data-tip="Cancel" aria-label="Cancel editing" onClick={() => setEditing(false)}>
            <CloseIcon size={18} />
          </button>
        </form>
      </div>
    </>
  )
}
