// The card around a grade-history chart: a named region with the title and
// description on the left and the chart's controls on the right.
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

// titleId: the heading's id (names the region). actions: the controls.
// contentClassName: the layout of the card's content.
export function HistoryCard({ titleId, title, description, actions, contentClassName, children }) {
    return (
        <Card className="mt-7 gap-3.5" role="region" aria-labelledby={titleId}>
            <CardHeader className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 id={titleId} className="m-0 type-section-title text-foreground">
                        {title}
                    </h2>
                    <CardDescription className="mt-1 max-w-prose">{description}</CardDescription>
                </div>
                {actions}
            </CardHeader>
            <CardContent className={contentClassName}>{children}</CardContent>
        </Card>
    );
}
