// src/components/student/SandboxSubjectPicker.jsx
// Asks which subject to open in the Target Grade Sandbox (opened from the
// sidebar). Render it only while it should be open.
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Item, ItemContent } from "@/components/ui/item";
import { formatGrade } from "@/lib/format";

function formatExpectedGrade(grade) {
    return grade === null ? "No grade yet" : `Expected ${formatGrade(grade, { decimals: 1 })}`;
}

// subjects: rows from getEnrolledSubjects() (classId, subjectCode, subjectName, expectedGrade).
// currentClassId: the subject the student is viewing, listed first.
// termKey: term to open, e.g. "midterm" (optional).
// onClose(): closes the picker.
export function SandboxSubjectPicker({ subjects, currentClassId = null, termKey = null, onClose }) {
    const ordered = [
        ...subjects.filter((row) => row.classId === currentClassId),
        ...subjects.filter((row) => row.classId !== currentClassId),
    ];
    const query = termKey ? `?term=${termKey}` : "";

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            // Like before, only Escape and Cancel close it, not a click outside.
            disablePointerDismissal
        >
            <DialogContent
                showCloseButton={false}
                className="gap-5 border-highlight-strong p-6 max-sm:px-4 sm:max-w-xl"
            >
                <DialogHeader className="gap-4">
                    <DialogTitle className="m-0 flex flex-col gap-2 type-section-title text-foreground">
                        <span className="flex items-center gap-2 type-caption font-bold tracking-widest text-primary uppercase">
                            <span className="size-2 shrink-0 rounded-full bg-primary" />
                            Target Grade Sandbox
                        </span>
                        Which subject do you want to plan?
                    </DialogTitle>
                    <DialogDescription>
                        The sandbox shows the score you need on your remaining tasks to reach your
                        target.
                    </DialogDescription>
                </DialogHeader>
                {ordered.length === 0 ? (
                    <p className="m-0 type-small text-muted-foreground">
                        You have no subjects yet.{" "}
                        <Link to="/student/subject" onClick={onClose} className="text-primary">
                            Add a subject
                        </Link>{" "}
                        first.
                    </p>
                ) : (
                    <ul className="m-0 flex max-h-picker-list list-none flex-col gap-2.5 overflow-y-auto p-0">
                        {ordered.map((row) => (
                            <li key={row.classId}>
                                {/* The whole card opens the subject's sandbox. */}
                                <Item
                                    variant="outline"
                                    className="flex-nowrap gap-3.5 rounded-xl border-highlight-strong bg-highlight-soft px-4 py-3.5 text-foreground no-underline hover:border-primary focus-visible:border-primary focus-visible:bg-secondary max-sm:gap-2.5 max-sm:p-3 [a]:hover:bg-secondary"
                                    render={
                                        <Link
                                            to={`/student/subject/${row.classId}/sandbox${query}`}
                                            onClick={onClose}
                                        />
                                    }
                                >
                                    <ItemContent className="min-w-0 gap-0.5">
                                        <span className="flex items-center gap-2 type-caption tracking-wide text-muted-foreground">
                                            {row.subjectCode}
                                            {row.classId === currentClassId && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-highlight-strong bg-card font-normal tracking-normal text-foreground"
                                                >
                                                    Viewing now
                                                </Badge>
                                            )}
                                        </span>
                                        <span className="truncate type-body font-semibold max-sm:whitespace-normal">
                                            {row.subjectName}
                                        </span>
                                    </ItemContent>
                                    <span className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 type-small text-muted-foreground transition-colors group-hover/item:border-primary group-hover/item:bg-secondary group-hover/item:text-primary group-focus-visible/item:border-primary group-focus-visible/item:bg-secondary group-focus-visible/item:text-primary max-sm:px-2.5 max-sm:py-1.5">
                                        {formatExpectedGrade(row.expectedGrade)}
                                    </span>
                                </Item>
                            </li>
                        ))}
                    </ul>
                )}
                <DialogFooter className="-mx-6 -mb-6 px-6 max-sm:-mx-4 max-sm:px-4">
                    <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
