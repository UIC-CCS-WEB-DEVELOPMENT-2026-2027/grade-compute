import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item";
import { EnrolledSubjectsTable } from "@/features/subjects/components/EnrolledSubjectsTable";
import { AllSubjectsHistory } from "@/features/history/components/AllSubjectsHistory";
import { getActiveStudentId } from "@/services/session";
import { getCurrentSemester, getEnrolledSubjects } from "@/lib/subjects";
import { useDb } from "@/hooks/useDb";

// Sample entries shown under Recent Updates (fixed text, AUDIT B13).
const RECENT_UPDATES = [
    {
        professor: "Prof. Ana Cruz",
        subject: "Introduction to Programming",
        grade: "86%",
        time: "Today, 10:30 AM",
    },
    {
        professor: "Prof. Maria Santos",
        subject: "Computer Systems",
        grade: "72%",
        time: "Yesterday, 2:15 PM",
    },
    {
        professor: "Prof. Carlo Reyes",
        subject: "General Mathematics",
        grade: "78%",
        time: "Oct 3, 9:00 AM",
    },
];

export function StudentDashboard() {
    // Live, so it refreshes when any page saves the database (e.g. a subject is added).
    const [dbData] = useDb();
    const studentId = getActiveStudentId(dbData);
    const semester = getCurrentSemester();
    const student = dbData?.users?.find((user) => user.id === studentId);
    // The dashboard shows the current semester's subjects.
    const subjects = getEnrolledSubjects(dbData, studentId, semester.id);

    return (
        <PageShell>
            {/* --- STUDENT OVERVIEW BANNER --- */}
            <div className="mb-9 flex items-center justify-between gap-5 max-sm:mb-7 max-sm:flex-col max-sm:items-start max-sm:gap-3.5">
                <div>
                    <h1 className="m-0 type-page-title text-foreground">Student Overview</h1>
                    <p className="mt-1 type-small text-muted-foreground">
                        Your subjects, progress, and next step.
                    </p>
                </div>

                <Badge
                    variant="outline"
                    className="h-auto min-h-12 gap-1 rounded-lg bg-card px-3 py-2.5 text-foreground"
                >
                    <span className="text-self-reported-foreground" aria-hidden="true">
                        •
                    </span>
                    <span>{semester.semester}</span>
                    <span className="text-input" aria-hidden="true">
                        ·
                    </span>
                    <span>{semester.academicYear}</span>
                </Badge>
            </div>

            {/* --- GRADE HISTORY (all subjects, one term) --- */}
            <AllSubjectsHistory db={dbData} studentId={studentId} semesterId={semester.id} />

            {/* --- ENROLLED SUBJECTS TABLE SECTION --- */}
            <EnrolledSubjectsTable
                subjects={subjects}
                subtitle={`Your subjects for ${semester.semester}, ${semester.academicYear}.`}
                studentId={studentId}
                initialSection={student?.programSection ?? ""}
            />

            {/* --- RECENT UPDATES SECTION --- fixed sample entries, not real data (AUDIT B13). */}
            <div className="mt-10">
                <div className="mb-5 flex items-end justify-between gap-3">
                    <div>
                        <h2 className="m-0 type-section-title text-foreground">Recent Updates</h2>
                        <p className="mt-1.5 type-small text-muted-foreground">
                            The latest from your professors.
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 type-small text-muted-foreground">
                        <span
                            className="size-1.75 shrink-0 rounded-full bg-self-reported-foreground"
                            aria-hidden="true"
                        />
                        Grade activity
                    </div>
                </div>

                <Card className="gap-0 py-0">
                    <ItemGroup className="gap-0">
                        {RECENT_UPDATES.map((update) => (
                            <Item
                                key={update.professor}
                                className="cursor-pointer rounded-none border-0 border-b border-border px-6 py-4.5 last:border-b-0 hover:bg-muted max-sm:gap-2.5 max-sm:p-4"
                            >
                                <ItemMedia className="size-9 rounded-full bg-secondary type-small font-semibold text-self-reported-foreground">
                                    ✓
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle className="text-foreground">
                                        {update.professor} posted an official grade
                                    </ItemTitle>
                                    <ItemDescription>
                                        {update.subject} <span className="mx-1 text-input">•</span>{" "}
                                        Prelim grade: {update.grade}
                                    </ItemDescription>
                                </ItemContent>
                                <ItemActions className="gap-3.5 type-small text-muted-foreground max-sm:basis-full max-sm:justify-between">
                                    <span>{update.time}</span>
                                    <span className="text-self-reported-foreground">↗</span>
                                </ItemActions>
                            </Item>
                        ))}
                    </ItemGroup>
                </Card>
            </div>
        </PageShell>
    );
}
