import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { EnrolledSubjectsTable } from "@/features/subjects/components/EnrolledSubjectsTable";
import { getActiveStudentId } from "@/services/session";
import {
    getClassSemesterId,
    getCurrentSemester,
    getEnrolledSubjects,
    getSemesterOptions,
} from "@/lib/subjects";
import { useDb } from "@/hooks/useDb";

const SEMESTER_OPTIONS = getSemesterOptions();
const DEFAULT_SEMESTER_ID = getCurrentSemester().id;

export function SubjectMenu() {
    const [dbData] = useDb();
    const studentId = getActiveStudentId(dbData);
    const student = dbData?.users?.find((user) => user.id === studentId);
    const [selectedSemesterId, setSelectedSemesterId] = useState(DEFAULT_SEMESTER_ID);
    const studentSection = student?.programSection ?? "";

    if (!dbData) {
        return (
            <PageShell>
                <p role="alert">Unable to load subject data from local storage.</p>
            </PageShell>
        );
    }

    const subjects = getEnrolledSubjects(dbData, studentId, selectedSemesterId);
    const selectedSemester = SEMESTER_OPTIONS.find((option) => option.id === selectedSemesterId);
    const pendingRequests = (dbData.verificationQueue ?? []).filter(
        (request) =>
            request.requestedByStudentId === studentId &&
            request.status === "pending" &&
            !(dbData.classes ?? []).some((classItem) => classItem.subjectId === request.subjectId),
    );

    return (
        <PageShell>
            <header className="mb-9 flex items-center justify-between gap-5 max-sm:mb-7 max-sm:flex-col max-sm:items-start max-sm:gap-3.5">
                <div>
                    <h1 className="m-0 type-page-title text-foreground">My Subjects</h1>
                    <p className="mt-1 type-small text-muted-foreground">
                        Your subjects, progress, and next step.
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="type-caption text-primary" aria-hidden="true">
                        ●
                    </span>
                    <NativeSelect
                        value={selectedSemesterId}
                        onChange={(event) => setSelectedSemesterId(event.target.value)}
                        aria-label="View subjects by semester"
                        className="bg-card"
                    >
                        {SEMESTER_OPTIONS.map((option) => (
                            <NativeSelectOption
                                key={option.id}
                                value={option.id}
                                disabled={!option.isCurrent}
                            >
                                {option.semester} · {option.academicYear}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                </div>
            </header>

            <EnrolledSubjectsTable
                subjects={subjects}
                subtitle={
                    selectedSemester
                        ? `Your subjects for ${selectedSemester.semester}, ${selectedSemester.academicYear}.`
                        : "Your subjects for this semester."
                }
                studentId={studentId}
                initialSection={studentSection}
                // New subjects go into the current semester, so show it.
                onSubjectAdded={(classItem) => setSelectedSemesterId(getClassSemesterId(classItem))}
            />

            {/* Never shown today: added subjects always have a class (AUDIT B8). */}
            {pendingRequests.length > 0 && (
                <section className="my-7">
                    <h2 className="m-0 type-card-title text-foreground">
                        Requests awaiting verification
                    </h2>
                    <ul className="mt-2.5 list-disc pl-4.5 type-small text-muted-foreground">
                        {pendingRequests.map((request) => (
                            <li key={request.id}>
                                {request.subjectCode} · {request.subjectName} — pending
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </PageShell>
    );
}
