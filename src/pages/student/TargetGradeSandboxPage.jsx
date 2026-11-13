import { Link, useParams, useSearchParams } from "react-router-dom";
import { BackLink } from "@/components/BackLink";
import { PageShell } from "@/components/layout/PageShell";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyHeader } from "@/components/ui/empty";
import { TargetGradeSandbox } from "@/features/sandbox/components/TargetGradeSandbox";
import { TermNavigation } from "@/features/term-records/components/TermNavigation";
import { getStudentClass } from "@/services/records";
import { getActiveStudentId } from "@/services/session";
import { toTermKey } from "@/lib/terms";
import { useDb } from "@/hooks/useDb";
import { cn } from "@/lib/utils";

export function TargetGradeSandboxPage() {
    const { subjectId } = useParams();
    // Same ?term= as Subject Detail, so both pages stay on the same term.
    const [searchParams, setSearchParams] = useSearchParams();
    const termKey = toTermKey(searchParams.get("term"));
    const [dbData] = useDb();
    const studentId = getActiveStudentId(dbData);

    const { classItem, subject, record, rule } = getStudentClass(dbData, subjectId, studentId);

    return (
        <PageShell headerProps={{ title: "Target Grade Sandbox", subtitle: null }}>
            {classItem && subject && record ? (
                <>
                    <div className="mb-2.5 flex">
                        <BackLink to={`/student/subject/${classItem.id}?term=${termKey}`}>
                            Back
                        </BackLink>
                    </div>

                    <section className="mb-5 w-full">
                        <div className="mb-2 type-caption tracking-wide text-muted-foreground">
                            TARGET GRADE SANDBOX
                            {rule ? ` · ${rule.ruleName.toUpperCase()}` : ""}
                        </div>
                        <div className="flex w-full items-start justify-between gap-6 max-md:flex-col max-md:gap-4 md:gap-10 xl:gap-16">
                            <h1 className="m-0 min-w-0 flex-auto type-page-title text-foreground">
                                {subject.subjectCode} - {subject.subjectName}
                            </h1>
                            <TermNavigation
                                className="mb-0 ml-auto flex-none flex-col items-end gap-1.5"
                                termKey={termKey}
                                onTermChange={(nextTerm) =>
                                    setSearchParams({ term: nextTerm }, { replace: true })
                                }
                                note="Private planning space. Official records stay untouched."
                            />
                        </div>
                    </section>

                    <TargetGradeSandbox classId={classItem.id} termKey={termKey} />
                </>
            ) : (
                <Empty className="mb-8 rounded-xl border border-solid border-border bg-muted p-4 md:p-6">
                    <EmptyHeader>
                        <h2 className="m-0 type-section-title text-primary">Sandbox unavailable</h2>
                        <p className="m-0 type-small text-muted-foreground">
                            This subject is not available for your account.
                        </p>
                    </EmptyHeader>
                    <Link
                        to="/student/subject"
                        className={cn(buttonVariants(), "rounded-full no-underline")}
                    >
                        Back to My Subjects
                    </Link>
                </Empty>
            )}
        </PageShell>
    );
}
