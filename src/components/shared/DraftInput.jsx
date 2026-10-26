// src/components/shared/DraftInput.jsx
// An <input> that keeps what the user types as a local draft and only
// reports it (onCommit) when the box loses focus or Enter is pressed.
// Nothing is saved while typing, so grades are not recalculated (and the
// target celebration does not fire) for half-typed values like "8" on the
// way to "85". Escape throws the draft away.
//
// value:          the saved value shown when the box is not being edited.
// onCommit(text): called once with the final text, only if it changed.
// acceptTyping(text): optional; return false to reject a keystroke
//                 (the box keeps its previous text).
// Any other props (type, aria-*, placeholder, ...) go to the <input>.
import { useRef, useState } from "react";

export default function DraftInput({ value, onCommit, acceptTyping, onBlur, onKeyDown, ...inputProps }) {
    const savedText = value === null || value === undefined ? "" : String(value);
    const [draft, setDraft] = useState(null);
    const cancelled = useRef(false);

    function commit() {
        if (cancelled.current) {
            cancelled.current = false;
            setDraft(null);
            return;
        }
        if (draft !== null && draft !== savedText) onCommit(draft);
        setDraft(null);
    }

    return (
        <input
            {...inputProps}
            value={draft ?? savedText}
            onChange={(event) => {
                const text = event.target.value;
                if (acceptTyping && !acceptTyping(text)) return;
                setDraft(text);
            }}
            onBlur={(event) => {
                commit();
                onBlur?.(event);
            }}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.blur();
                } else if (event.key === "Escape") {
                    cancelled.current = true;
                    event.currentTarget.blur();
                }
                onKeyDown?.(event);
            }}
        />
    );
}
