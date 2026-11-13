// A dialog title with a small eyebrow label above it: a coloured dot and the
// label in capitals. Used by the rule dialogs and the sandbox subject picker.
// Render it inside a DialogHeader.
import { DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const DOT_TONES = {
    primary: "bg-primary",
    warning: "bg-warning",
};

// eyebrow: the label above the title. dot: "primary" | "warning".
export function DialogEyebrowTitle({ eyebrow, dot = "primary", children }) {
    return (
        <DialogTitle className="m-0 flex flex-col gap-2 type-section-title text-foreground">
            <span className="flex items-center gap-2 type-caption font-bold tracking-widest text-primary uppercase">
                <span className={cn("size-2 shrink-0 rounded-full", DOT_TONES[dot])} />
                {eyebrow}
            </span>
            {children}
        </DialogTitle>
    );
}
