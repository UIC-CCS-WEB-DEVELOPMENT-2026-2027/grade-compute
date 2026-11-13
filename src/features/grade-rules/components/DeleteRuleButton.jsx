// The "Delete" button that opens DeleteRuleDialog, on a rule card and in the
// rule editor: an outline button in the destructive colour.
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// className: added before the destructive colours. Other props (size,
// onClick) go to the Button.
export function DeleteRuleButton({ className, ...props }) {
    return (
        <Button
            variant="outline"
            className={cn(
                className,
                "text-destructive hover:border-destructive hover:bg-warning-soft hover:text-destructive",
            )}
            {...props}
        >
            Delete
        </Button>
    );
}
