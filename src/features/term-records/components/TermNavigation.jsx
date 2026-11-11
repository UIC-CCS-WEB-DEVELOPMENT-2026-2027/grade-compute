// src/components/student/TermNavigation.jsx
// Term buttons shown at the top of Subject Detail and the Target Grade
// Sandbox. Styles: SubjectDetail.css + TermNavigation.css.
import { TERMS } from "@/lib/terms";
import "./TermNavigation.css";

// termKey: "prelim" | "midterm" | "finals".
// onTermChange(termKey): called when a term button is pressed.
// note: optional text after the term buttons.
export function TermNavigation({ termKey, onTermChange, note = null, className = "" }) {
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
        </div>
    );
}
