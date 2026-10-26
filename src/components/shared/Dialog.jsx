// src/components/shared/Dialog.jsx
// Modal dialog built on the native <dialog> element, which handles focus
// and Escape. Render it only while it should be open.
import { useEffect, useId, useRef } from "react";
import "./Dialog.css";

export default function Dialog({ title, onClose, children, actions }) {
    const dialogRef = useRef(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) dialog.showModal();
        return () => {
            if (dialog?.open) dialog.close();
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className="app-dialog"
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
        >
            <h2 id={titleId}>{title}</h2>
            <div className="app-dialog-body">{children}</div>
            <div className="app-dialog-actions">{actions}</div>
        </dialog>
    );
}
