import { cn } from "@/lib/utils";

export function PageFooter({ className }) {
    return (
        <footer
            className={cn(
                "flex min-h-12 items-center justify-between gap-4 border-t border-border px-10 py-3 type-small text-muted-foreground max-md:flex-col max-md:items-start max-md:gap-1 max-md:px-4",
                className,
            )}
        >
            <span>A clearer picture. A stronger semester.</span>
            <span className="flex items-center gap-2.5">
                <span>CompUGrade</span>
                <span aria-hidden="true">·</span>
                <span>Built for your potential.</span>
            </span>
        </footer>
    );
}
