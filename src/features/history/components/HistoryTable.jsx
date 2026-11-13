// The "Show as a table" view of a grade-history chart: one row per scored
// task (step, task, score, grade so far) with a button that opens the task,
// then the planned tasks. Used by both history charts (Dashboard and
// Subject Detail / sandbox). It scrolls sideways inside its card on phones.
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatGrade } from "@/lib/format";

// caption: the table's title. points: real history points. planPoints: the
// planned tasks (drawn after the real ones). actionLabel: the button's text
// ("Open task", "Go to task"). onSelect(point): the button's action; without
// it there is no button column. canSelect(point): whether a row gets the
// button. showReplacedEntry: the Score cell wraps and adds "you entered x%"
// where an official score replaced the student's own entry.
export function HistoryTable({
    caption,
    points,
    planPoints = [],
    actionLabel,
    onSelect,
    canSelect = () => true,
    showReplacedEntry = false,
}) {
    return (
        <Table className="rounded-lg border border-border">
            <TableCaption className="mt-0 mb-2 caption-top text-left text-foreground">
                {caption}
            </TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Step</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade so far</TableHead>
                    {onSelect && (
                        <TableHead>
                            <span className="sr-only">{actionLabel}</span>
                        </TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {points.map((point) => (
                    <TableRow key={`real-${point.step}`}>
                        <TableCell>{point.step}</TableCell>
                        <TableCell className="whitespace-normal">
                            {point.criterionName} · {point.label}
                        </TableCell>
                        <TableCell className={showReplacedEntry ? "whitespace-normal" : undefined}>
                            {point.percent.toFixed(1)}%{" "}
                            {point.isOfficial ? "(official)" : "(yours)"}
                            {showReplacedEntry &&
                                point.replacedEntry &&
                                ` · you entered ${point.replacedEntry.percent.toFixed(1)}%`}
                        </TableCell>
                        <TableCell>{formatGrade(point.grade)}</TableCell>
                        {onSelect && (
                            <TableCell className="text-right">
                                {canSelect(point) && (
                                    <Button
                                        variant="link"
                                        className="h-auto p-0 tap:min-h-11"
                                        onClick={() => onSelect(point)}
                                    >
                                        {actionLabel}
                                    </Button>
                                )}
                            </TableCell>
                        )}
                    </TableRow>
                ))}
                {planPoints.map((point) => (
                    <TableRow key={`plan-${point.step}`} className="text-muted-foreground italic">
                        <TableCell>{point.step}</TableCell>
                        <TableCell className="whitespace-normal">
                            {point.criterionName} · {point.label} (planned)
                        </TableCell>
                        <TableCell className="whitespace-normal">
                            {formatGrade(point.percent)}{" "}
                            {point.isExpected ? "(your estimate)" : "(needed)"}
                        </TableCell>
                        <TableCell>{formatGrade(point.planGrade)}</TableCell>
                        {onSelect && <TableCell />}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
