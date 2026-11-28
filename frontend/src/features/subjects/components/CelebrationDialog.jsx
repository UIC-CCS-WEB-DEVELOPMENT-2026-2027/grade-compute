// The "target achieved" message on Subject Detail, with falling confetti.
// Mount it only while there is a message, so it disappears at once when
// closed. The popup fills the screen so the confetti can fall over the whole
// page; a press outside the card closes it.
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

// Confetti in the palette tokens. Each piece's place, timing and colour come
// from its index: the confetti-* utilities in index.css list every value.
const CONFETTI_COLORS = [
    "bg-criteria-1",
    "bg-criteria-2",
    "bg-success",
    "bg-criteria-4",
    "bg-criteria-3",
];
const CONFETTI_PIECES = Array.from(
    { length: 44 },
    (_, index) =>
        `confetti-left-${(index * 37) % 100} confetti-delay-${(index % 11) * 80} confetti-duration-${2300 + (index % 7) * 220} ${CONFETTI_COLORS[index % CONFETTI_COLORS.length]}`,
);

// message: the text under "Congratulations!". onClose(): closes it.
export function CelebrationDialog({ message, onClose }) {
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent
                showCloseButton={false}
                className="inset-0 size-full max-w-none translate-x-0 translate-y-0 place-items-center overflow-hidden rounded-none border-0 bg-transparent p-5 shadow-none sm:max-w-none"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) onClose();
                }}
            >
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {CONFETTI_PIECES.map((piece, index) => (
                        <span
                            key={index}
                            className={`absolute -top-4 h-3.5 w-2 animate-celebration-confetti rounded-xs opacity-0 motion-reduce:animate-none ${piece}`}
                        />
                    ))}
                </div>
                <div className="relative w-full max-w-md animate-celebration-card-in rounded-2xl border border-card bg-card bg-linear-to-b from-highlight/40 to-transparent to-50% px-8 pt-10 pb-8 text-center text-foreground shadow-dialog motion-reduce:animate-none">
                    <DialogClose
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="absolute top-2 right-2.5 text-muted-foreground"
                                aria-label="Close congratulations"
                            />
                        }
                    >
                        <XIcon aria-hidden="true" />
                    </DialogClose>
                    <span
                        className="block animate-celebration-sparkle text-glyph leading-none text-highlight-text motion-reduce:animate-none"
                        aria-hidden="true"
                    >
                        ✦
                    </span>
                    <p className="mt-3.5 mb-1 type-caption font-extrabold tracking-widest text-highlight-text">
                        TARGET ACHIEVED
                    </p>
                    <DialogTitle className="m-0 type-section-title text-primary">
                        Congratulations!
                    </DialogTitle>
                    <DialogDescription className="mt-2.5 type-body text-muted-foreground">
                        {message}
                    </DialogDescription>
                    <span
                        className="mt-4 block animate-celebration-trophy text-glyph motion-reduce:animate-none"
                        aria-hidden="true"
                    >
                        🏆
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
