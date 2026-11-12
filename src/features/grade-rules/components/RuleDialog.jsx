// The frame of the rule dialogs (delete a rule, confirm a rule update): an
// eyebrow with a coloured dot, the title, the content and the buttons. Like
// the native dialog it replaced, only Escape and its buttons close it, not a
// click outside. Render it only while it should be open.
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const DOT_TONES = {
    primary: "bg-primary",
    warning: "bg-warning",
};

// eyebrow: the small label above the title. dot: "primary" | "warning".
// cancelLabel: the first button, which only closes it ("Cancel", "Close").
// actions: the other buttons.
export function RuleDialog({
    eyebrow,
    dot = "primary",
    title,
    cancelLabel = "Cancel",
    onClose,
    actions,
    children,
}) {
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            disablePointerDismissal
        >
            <DialogContent
                showCloseButton={false}
                className="gap-5 border-highlight-strong p-6 type-body max-sm:px-4 sm:max-w-2xl md:px-7.5"
            >
                <DialogHeader>
                    <DialogTitle className="m-0 flex flex-col gap-2 type-section-title text-foreground">
                        <span className="flex items-center gap-2 type-caption font-bold tracking-widest text-primary uppercase">
                            <span className={cn("size-2 shrink-0 rounded-full", DOT_TONES[dot])} />
                            {eyebrow}
                        </span>
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3.5">{children}</div>
                <DialogFooter className="-mx-6 -mb-6 px-6 max-sm:-mx-4 max-sm:px-4 md:-mx-7.5 md:px-7.5">
                    <DialogClose
                        render={<Button variant="outline" className="max-md:h-control-touch" />}
                    >
                        {cancelLabel}
                    </DialogClose>
                    {actions}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
