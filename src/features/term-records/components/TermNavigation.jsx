// Term buttons shown at the top of Subject Detail and the Target Grade
// Sandbox.
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TERMS } from "@/lib/terms";
import { cn } from "@/lib/utils";

// termKey: "prelim" | "midterm" | "finals".
// onTermChange(termKey): called when a term button is pressed.
// note: optional text after the term buttons.
// className: the layout where it sits (the sandbox stacks the note under the
// buttons).
export function TermNavigation({ termKey, onTermChange, note = null, className }) {
    return (
        <div className={cn("mb-6 flex flex-wrap items-center gap-3", className)}>
            <ToggleGroup
                aria-label="Term"
                value={[termKey]}
                // Pressing the selected term again keeps it selected.
                onValueChange={(value) => {
                    if (value[0]) onTermChange(value[0]);
                }}
                spacing={1.5}
            >
                {TERMS.map((term) => (
                    <ToggleGroupItem
                        key={term.key}
                        value={term.key}
                        variant="outline"
                        className="min-w-15 rounded-full border-border bg-card px-3.5 font-normal text-muted-foreground hover:border-primary hover:bg-secondary hover:text-primary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground max-md:h-control-touch"
                    >
                        {term.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
            {note && <span className="type-small text-muted-foreground">{note}</span>}
        </div>
    );
}
