// src/components/student/TermNavigation.jsx
// Term buttons shown at the top of Subject Detail and the Target Grade
// Sandbox, with one page action to their right (e.g. "Target grade sandbox"
// or "Back to subject"). Styles: SubjectDetail.css + TermNavigation.css.
import { TERMS } from "../../utils/terms";
import "./TermNavigation.css";

// termKey: "prelim" | "midterm" | "finals".
// onTermChange(termKey): called when a term button is pressed.
// action: optional element placed right of the term buttons.
// note: optional text after the action.
export default function TermNavigation({ termKey, onTermChange, action = null, note = null, className = "" }) {
    return (
        <div className={`subject-term-navigation ${className}`.trim()}>
            <div className="term-nav-terms">
                <div className="term-selector" role="group" aria-label="Term">
                    {TERMS.map((term) => (
                        <button
                            key={term.key}
                            type="button"
                            className={termKey === term.key ? "selected" : ""}
                            aria-pressed={termKey === term.key}
                            onClick={() => onTermChange(term.key)}
                        >
                            {term.label}
                        </button>
                    ))}
                </div>
                {note && <span className="term-note">{note}</span>}
            </div>
            {action && <div className="term-nav-action">{action}</div>}
        </div>
    );
}
