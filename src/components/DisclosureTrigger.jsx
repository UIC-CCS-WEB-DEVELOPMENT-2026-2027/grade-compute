// The button that opens and closes a Collapsible: a ghost button in the
// primary colour with a chevron that turns down while it is open. Used by the
// sandbox's "How this is calculated" and Current Term Records' breakdown.
// Render it inside a Collapsible.
import { ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function DisclosureTrigger({ className, children }) {
    return (
        <CollapsibleTrigger
            render={
                <Button
                    variant="ghost"
                    className={cn(
                        "group/disclosure text-primary hover:bg-secondary hover:text-primary aria-expanded:bg-transparent aria-expanded:text-primary",
                        className,
                    )}
                />
            }
        >
            <ChevronRightIcon
                data-icon="inline-start"
                aria-hidden="true"
                className="transition-transform group-aria-expanded/disclosure:rotate-90 motion-reduce:transition-none"
            />
            {children}
        </CollapsibleTrigger>
    );
}
