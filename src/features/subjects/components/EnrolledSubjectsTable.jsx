// The Enrolled Subjects table used on the Dashboard and My Subjects pages.
// Rows come from getEnrolledSubjects() in lib/subjects.js.
// It also holds the "+ Add subject" button and form, so both pages add
// subjects the same way.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AddSubjectForm } from "./AddSubjectForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { formatGrade } from "@/lib/format";
import { PASSING_GRADE } from "@/lib/subjects";

const STATUS_LABELS = {
    passing: "Passing",
    below: "Below passing",
    none: "No grades yet",
};

const STATUS_VARIANTS = {
    passing: "secondary",
    below: "destructive",
    none: "secondary",
};

// Short label for the icon box: the letters of the subject code ("IT101" -> "IT").
function subjectInitials(subjectCode) {
    const letters = String(subjectCode ?? "").replace(/[^A-Za-z]/g, "");
    return (letters || "?").slice(0, 2).toUpperCase();
}

// subjects: rows from getEnrolledSubjects().
// subtitle: line under the title.
// studentId / initialSection: passed to AddSubjectForm.
// onSubjectAdded(classItem): called after the form saves a subject.
export function EnrolledSubjectsTable({
    subjects = [],
    subtitle = "All your subjects for the current semester.",
    studentId,
    initialSection = "",
    onSubjectAdded,
}) {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);

    const needsAttentionCount = subjects.filter((row) => row.status === "below").length;
    const query = search.trim().toLowerCase();
    const visibleSubjects = subjects.filter((row) => {
        if (activeFilter === "attention" && row.status !== "below") return false;
        const text = `${row.subjectCode} ${row.subjectName} ${row.professor}`.toLowerCase();
        return text.includes(query);
    });

    function handleAdded(classItem) {
        setShowForm(false);
        onSubjectAdded?.(classItem);
    }

    return (
        <Card className="mt-8 gap-6" role="region" aria-labelledby="enrolled-subjects-title">
            <CardHeader className="flex items-start justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
                <div>
                    <div className="flex items-center gap-2">
                        <h2
                            className="m-0 type-section-title text-foreground"
                            id="enrolled-subjects-title"
                        >
                            Enrolled Subjects
                        </h2>
                        <Badge
                            variant="secondary"
                            className="rounded-md bg-muted text-muted-foreground"
                        >
                            {subjects.length}
                        </Badge>
                    </div>
                    <p className="mt-1.5 type-small text-muted-foreground">{subtitle}</p>
                </div>
                <Button
                    variant={showForm ? "outline" : "default"}
                    className={cn("shrink-0", showForm && "text-primary")}
                    onClick={() => setShowForm((open) => !open)}
                    aria-expanded={showForm}
                >
                    {showForm ? "Close form" : "+ Add subject"}
                </Button>
            </CardHeader>

            <CardContent className="@container flex flex-col gap-6">
                {showForm && (
                    <AddSubjectForm
                        studentId={studentId}
                        initialSection={initialSection}
                        onCancel={() => setShowForm(false)}
                        onAdded={handleAdded}
                    />
                )}

                <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
                    <ToggleGroup
                        aria-label="Filter subjects"
                        value={[activeFilter]}
                        onValueChange={(value) => {
                            if (value[0]) setActiveFilter(value[0]);
                        }}
                        className="flex-wrap gap-2"
                    >
                        <ToggleGroupItem
                            value="all"
                            className="rounded-full px-3.5 font-normal text-muted-foreground aria-pressed:bg-secondary aria-pressed:font-semibold aria-pressed:text-primary"
                        >
                            All subjects
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="attention"
                            className="rounded-full px-3.5 font-normal text-muted-foreground aria-pressed:bg-secondary aria-pressed:font-semibold aria-pressed:text-primary"
                        >
                            Needs attention
                            {needsAttentionCount > 0 && (
                                <Badge variant="destructive">{needsAttentionCount}</Badge>
                            )}
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <Input
                        type="search"
                        className="w-55 max-sm:w-full"
                        placeholder="Search subjects..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Search subjects"
                    />
                </div>

                <Table className="@max-2xl:block">
                    <TableHeader className="@max-2xl:sr-only">
                        <TableRow className="hover:bg-transparent">
                            {[
                                "Subject / Professor",
                                "Official grade",
                                "Expected grade",
                                "Status",
                            ].map((label) => (
                                <TableHead
                                    key={label}
                                    className="type-caption tracking-wide text-muted-foreground uppercase"
                                >
                                    {label}
                                </TableHead>
                            ))}
                            <TableHead aria-label="Open subject" />
                        </TableRow>
                    </TableHeader>
                    <TableBody className="@max-2xl:flex @max-2xl:flex-col @max-2xl:gap-3">
                        {visibleSubjects.map((row) => {
                            const detailPath = `/student/subject/${row.classId}`;
                            return (
                                // The row is clickable with a mouse; the links
                                // inside are what keyboards and screen readers use.
                                <TableRow
                                    key={row.classId}
                                    onClick={() => navigate(detailPath)}
                                    className="cursor-pointer hover:bg-muted @max-2xl:grid @max-2xl:grid-cols-3 @max-2xl:gap-x-4 @max-2xl:gap-y-3 @max-2xl:rounded-xl @max-2xl:border @max-2xl:p-4"
                                >
                                    <TableCell className="py-4.5 @max-2xl:col-span-2 @max-2xl:p-0 @max-2xl:whitespace-normal">
                                        <Link
                                            className="flex min-w-55 items-center gap-3.5 text-inherit no-underline hover:text-primary @max-2xl:min-w-0"
                                            to={detailPath}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <span
                                                className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted type-small font-bold text-primary"
                                                aria-hidden="true"
                                            >
                                                {subjectInitials(row.subjectCode)}
                                            </span>
                                            <span className="flex flex-col whitespace-normal">
                                                <span className="type-caption tracking-wide text-muted-foreground">
                                                    {row.subjectCode}
                                                </span>
                                                <span className="type-body font-semibold">
                                                    {row.subjectName}
                                                </span>
                                                <span className="type-small text-muted-foreground">
                                                    {row.professor}
                                                </span>
                                            </span>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="py-4.5 @max-2xl:order-1 @max-2xl:p-0 @max-2xl:whitespace-normal">
                                        <span className="block type-caption tracking-wide text-muted-foreground uppercase @2xl:hidden">
                                            Official
                                        </span>
                                        <span className="block type-card-title text-foreground">
                                            {formatGrade(row.officialGrade, { decimals: 1 })}
                                        </span>
                                        <span className="block type-small text-muted-foreground">
                                            {row.officialGrade === null
                                                ? "Not posted yet"
                                                : "Posted by professor"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4.5 @max-2xl:order-1 @max-2xl:col-span-2 @max-2xl:p-0 @max-2xl:whitespace-normal">
                                        <span className="block type-caption tracking-wide text-muted-foreground uppercase @2xl:hidden">
                                            Expected
                                        </span>
                                        {/* Expected grades use the self-reported color. */}
                                        <span className="block type-card-title text-self-reported-foreground">
                                            {formatGrade(row.expectedGrade, { decimals: 1 })}
                                        </span>
                                        <span className="block type-small text-muted-foreground">
                                            {row.expectedGrade === null
                                                ? "No scores yet"
                                                : "With your scores"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4.5 @max-2xl:order-2 @max-2xl:col-span-3 @max-2xl:p-0 @max-2xl:whitespace-normal">
                                        <Badge
                                            variant={STATUS_VARIANTS[row.status]}
                                            className={cn(
                                                "h-auto px-3 py-1",
                                                row.status === "none" &&
                                                    "bg-muted text-muted-foreground",
                                            )}
                                        >
                                            {STATUS_LABELS[row.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4.5 text-right @max-2xl:self-center @max-2xl:p-0 @max-2xl:whitespace-normal">
                                        <Link
                                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground no-underline hover:text-primary focus-visible:text-primary tap:size-11"
                                            to={detailPath}
                                            onClick={(event) => event.stopPropagation()}
                                            aria-label={`Open ${row.subjectCode}`}
                                        >
                                            →
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {visibleSubjects.length === 0 && (
                            <TableRow className="hover:bg-transparent @max-2xl:block">
                                <TableCell
                                    colSpan={5}
                                    className="@max-2xl:block @max-2xl:p-0 @max-2xl:whitespace-normal"
                                >
                                    <Empty className="type-small text-muted-foreground">
                                        {subjects.length === 0
                                            ? "No subjects yet. Use + Add subject to add your first one."
                                            : "No subjects match this filter."}
                                    </Empty>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-start gap-6 border-t border-border pt-5 type-small text-muted-foreground max-sm:flex-col max-sm:gap-1">
                    <span className="min-w-0 flex-1">
                        • Official grades are posted by your professors. Expected grades fill the
                        gaps with your own scores.
                    </span>
                    <span className="shrink-0 whitespace-nowrap max-sm:whitespace-normal">
                        Passing grade: {PASSING_GRADE}%
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
