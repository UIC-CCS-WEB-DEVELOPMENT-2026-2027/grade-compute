import { useState } from "react";
import { DraftInput } from "@/components/DraftInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DisclosureTrigger } from "@/components/DisclosureTrigger";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { getDb, saveDb } from "@/services/db";
import { getStudentClass, updateStudentRecord } from "@/services/records";
import { getActiveStudentId } from "@/services/session";
import { toTaskList, withStudentScore } from "@/lib/grades";
import { formatPercent, getHierarchyRows, getRuleLeaves, ruleToTree } from "@/lib/rules";
import { validateScore } from "@/lib/scores";
import { useDb } from "@/hooks/useDb";
import { cn } from "@/lib/utils";

function termKey(term) {
    return term.toLowerCase();
}

function taskName(task, category) {
    const title = task.title ?? `${category} ${task.sequenceNumber ?? ""}`.trim();
    return task.description ? `${title} - ${task.description}` : title;
}

function hasOfficialScore(task) {
    return task?.officialScore !== null && task?.officialScore !== undefined;
}

// Sections come from the subject's grading rule: one per deepest criterion
// (e.g. AT, TLA, Exam, or any custom criterion). Tasks are stored under the
// criterion's id in each term.
export function CurrentTermRecords({ classId, term = "Prelim" }) {
    const [dbData, setDbData] = useDb({ live: false });
    const studentId = getActiveStudentId(dbData);
    const [taskNameInput, setTaskNameInput] = useState("");
    const [taskMaxScore, setTaskMaxScore] = useState("");
    const [taskCategory, setTaskCategory] = useState("");
    const [showAddTask, setShowAddTask] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [addTaskError, setAddTaskError] = useState("");
    const [invalidScoreId, setInvalidScoreId] = useState("");

    const { record: studentRecord, rule } = getStudentClass(dbData, classId, studentId);
    const criteria = getRuleLeaves(rule);
    const criteriaIds = new Set(criteria.map((criterion) => criterion.id));
    const selectedCategory = criteriaIds.has(taskCategory) ? taskCategory : (criteria[0]?.id ?? "");
    const currentTerm = studentRecord?.grades?.[termKey(term)] ?? {};
    const tasksFor = (criterionId) => toTaskList(currentTerm[criterionId]);

    // Tasks stored under criteria that are no longer in this rule.
    const uncountedTasks = Object.entries(currentTerm)
        .filter(([criterionId]) => !criteriaIds.has(criterionId))
        .reduce((total, [, tasks]) => total + toTaskList(tasks).length, 0);

    function saveChanges(updateRecord) {
        const currentDb = getDb();
        if (!currentDb) {
            setSaveError("Your changes could not be saved because local data is unavailable.");
            return false;
        }

        const updatedDb = updateStudentRecord(currentDb, classId, studentId, updateRecord);

        try {
            saveDb(updatedDb);
        } catch (error) {
            setSaveError(`Unable to save sandbox changes: ${error.message}`);
            return false;
        }

        setDbData(updatedDb);
        setSaveError("");
        return true;
    }

    function updateTerm(updateTermGrades) {
        return saveChanges((record) => {
            const grades = record.grades ?? {};
            return {
                ...record,
                grades: {
                    ...grades,
                    [termKey(term)]: updateTermGrades(grades[termKey(term)] ?? {}),
                },
            };
        });
    }

    // Checks a typed score. Shows the problem and returns false if it is not
    // valid, so the keystroke is rejected (or the save is skipped).
    function checkScore(criterionId, taskId, value) {
        const selectedAssessment = tasksFor(criterionId).find((task) => task.id === taskId);
        const scoreId = `${criterionId}-${taskId}`;

        if (hasOfficialScore(selectedAssessment)) {
            setInvalidScoreId(scoreId);
            setSaveError("This score is locked because it was recorded by a professor.");
            return false;
        }

        const check = validateScore(value, selectedAssessment?.maxScore);
        if (!check.ok) {
            setInvalidScoreId(scoreId);
            setSaveError(
                `Enter a score between 0 and ${check.maxScore}, using no more than ${check.maxIntegerDigits} digits before the decimal.`,
            );
            return false;
        }

        setInvalidScoreId("");
        setSaveError("");
        return true;
    }

    // Saves a score. Called by DraftInput when the box loses focus (or on
    // Enter), not on every keystroke, so the grade and the target
    // celebration only update once the student has finished typing.
    function updateSandbox(criterionId, taskId, field, value) {
        if (!checkScore(criterionId, taskId, value)) return;
        updateTerm((selectedTerm) => ({
            ...selectedTerm,
            [criterionId]: toTaskList(selectedTerm[criterionId]).map((task) =>
                task.id !== taskId
                    ? task
                    : field === "studentReportedScore"
                      ? withStudentScore(task, value)
                      : { ...task, [field]: value },
            ),
        }));
    }

    function addCustomTask(event) {
        event.preventDefault();
        const name = taskNameInput.trim();
        const maxScore = Number(taskMaxScore);
        if (!selectedCategory) {
            setAddTaskError("This subject's grading rule has no criteria to add tasks to.");
            return;
        }
        if (!name) {
            setAddTaskError("Please enter a task name.");
            event.currentTarget.elements.namedItem("taskName")?.focus();
            return;
        }
        if (!taskMaxScore || !Number.isInteger(maxScore) || maxScore <= 0) {
            setAddTaskError("Please enter a whole-number maximum score greater than zero.");
            event.currentTarget.elements.namedItem("taskMaxScore")?.focus();
            return;
        }

        setAddTaskError("");
        const customTask = {
            // This runs in the form's submit handler, not during render. The
            // React Compiler lint reports it anyway (a false positive).
            // eslint-disable-next-line react-hooks/purity
            id: `CUSTOM-${Date.now()}`,
            type: selectedCategory,
            sequenceNumber: null,
            title: name,
            description: "",
            maxScore,
            officialScore: null,
            studentReportedScore: null,
            isCustomTask: true,
            createdAt: new Date().toISOString(),
        };

        const saved = updateTerm((selectedTerm) => ({
            ...selectedTerm,
            [selectedCategory]: [...toTaskList(selectedTerm[selectedCategory]), customTask],
        }));

        if (saved) {
            setTaskNameInput("");
            setTaskMaxScore("");
            setShowAddTask(false);
        }
    }

    if (!studentRecord) {
        return (
            <section className="mt-8 w-full type-body text-primary md:mt-10" role="alert">
                This subject has no student record to display.
            </section>
        );
    }

    if (!rule) {
        return (
            <section className="mt-8 w-full type-body text-primary md:mt-10" role="alert">
                This subject&apos;s grading rule no longer exists. Choose another rule on the Grade
                Rules page.
            </section>
        );
    }

    // Top-level criteria for the weight summary, e.g. "70% Classwork (70% AT + 30% TLA)".
    const summaryRows = getHierarchyRows(ruleToTree(rule));
    const topLevel = summaryRows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.depth === 1)
        .map(({ row, index }) => {
            const children = [];
            for (
                let next = index + 1;
                next < summaryRows.length && summaryRows[next].depth > 1;
                next += 1
            ) {
                if (summaryRows[next].depth === 2) children.push(summaryRows[next]);
            }
            return { ...row, children };
        });

    return (
        <section className="mt-8 w-full md:mt-10">
            <header>
                <h2 className="m-0 type-section-title text-foreground">Current Term Records</h2>
                <p className="mt-2 mb-4 type-small text-muted-foreground">
                    Professor records stay locked. Your own entries stay private.
                </p>
            </header>

            <div className="relative flex flex-wrap items-center justify-between gap-5 rounded-lg border border-border bg-card px-5 py-4 max-sm:gap-2 max-sm:px-3">
                {topLevel.map((group, index) => (
                    <div className="flex items-center gap-5 max-sm:gap-2" key={group.id}>
                        {index > 0 && (
                            <span className="absolute left-1/2 -translate-x-1/2 type-body text-muted-foreground max-sm:static max-sm:translate-x-0">
                                +
                            </span>
                        )}
                        <div className="flex items-center gap-3 max-sm:gap-2">
                            <strong className="type-section-title whitespace-nowrap text-primary">
                                {formatPercent(group.shareOfParent)}
                            </strong>
                            <div className="flex flex-col gap-1">
                                <span className="type-small font-semibold text-foreground">
                                    {group.name}
                                </span>
                                <small className="type-small text-muted-foreground">
                                    {group.children.length
                                        ? group.children
                                              .map(
                                                  (child) =>
                                                      `${formatPercent(child.shareOfParent)} ${child.name}`,
                                              )
                                              .join(" + ")
                                        : `${term} tasks`}
                                </small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-4 mb-5 type-small text-muted-foreground">
                Review official scores, add your own notes, and create custom tasks for this term.
            </p>

            <Card className="gap-0 py-0">
                <div className="flex min-h-10 items-center justify-between gap-2.5 border-b border-border bg-highlight-soft px-4 py-3 type-caption tracking-wide text-muted-foreground">
                    <span>{term.toUpperCase()} · SCORES &amp; TASKS</span>
                    <span className="whitespace-nowrap">Score / Max</span>
                </div>

                {criteria.map((criterion) => {
                    const category = criterion.name;
                    const categoryTasks = tasksFor(criterion.id);
                    return (
                        <section className="group/section" key={criterion.id}>
                            {/* Hidden, as before: the rows name their criterion. */}
                            <h3 className="hidden">{criterion.path.join(" › ")}</h3>
                            {categoryTasks.length ? (
                                categoryTasks.map((task) => {
                                    const name = taskName(task, category);
                                    const displayName =
                                        task.isCustomTask &&
                                        !name.toLowerCase().startsWith(category.toLowerCase())
                                            ? `${category} - ${name}`
                                            : name;
                                    const isOfficialLocked = hasOfficialScore(task);
                                    return (
                                        <div
                                            className={cn(
                                                "flex min-h-20 items-center justify-between gap-4 border-b border-border bg-card px-4 py-3.5 group-last-of-type/section:border-b-0 task-highlighted:animate-record-highlight max-sm:flex-col max-sm:items-start max-sm:gap-2.5 max-sm:px-2.5 motion-reduce:task-highlighted:animate-none motion-reduce:task-highlighted:bg-highlight-soft",
                                                task.isCustomTask && "bg-secondary/40",
                                            )}
                                            key={task.id}
                                            data-task-id={task.id}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <h3 className="m-0 type-body font-semibold wrap-anywhere text-foreground">
                                                    {displayName}
                                                </h3>
                                                <p className="mt-1.5 type-small text-muted-foreground">
                                                    {task.isCustomTask ? (
                                                        <>
                                                            <Badge
                                                                variant="outline"
                                                                className="mr-1.5 border-self-reported/40 bg-card text-self-reported-foreground"
                                                            >
                                                                Custom Addition
                                                            </Badge>{" "}
                                                            Student-created · Private
                                                        </>
                                                    ) : !isOfficialLocked ? (
                                                        <>
                                                            <Badge
                                                                variant="outline"
                                                                className="mr-1.5 border-self-reported/40 bg-card text-self-reported-foreground"
                                                            >
                                                                Self Reported
                                                            </Badge>{" "}
                                                            Student entry · Not an official grade
                                                        </>
                                                    ) : (
                                                        "Professor-recorded assessment"
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex min-w-24 shrink-0 flex-col items-end gap-1.5 max-sm:min-w-0 max-sm:items-start">
                                                <strong className="type-body font-semibold text-foreground tabular-nums">
                                                    {isOfficialLocked
                                                        ? `${task.officialScore} / ${task.maxScore}`
                                                        : "—"}
                                                </strong>
                                                <small className="type-small text-muted-foreground">
                                                    {isOfficialLocked
                                                        ? "Locked · Official"
                                                        : "No official score"}
                                                </small>
                                            </div>
                                            {!isOfficialLocked ? (
                                                <div className="shrink-0">
                                                    <InputGroup className="w-36 border-self-reported bg-card has-aria-invalid:bg-warning-soft max-md:w-44">
                                                        <DraftInput
                                                            as={InputGroupInput}
                                                            type="text"
                                                            inputMode="decimal"
                                                            min="0"
                                                            max={task.maxScore}
                                                            placeholder="Add Score"
                                                            aria-label={`Private score for ${displayName}`}
                                                            aria-invalid={
                                                                invalidScoreId ===
                                                                `${criterion.id}-${task.id}`
                                                            }
                                                            value={task.studentReportedScore}
                                                            acceptTyping={(text) =>
                                                                checkScore(
                                                                    criterion.id,
                                                                    task.id,
                                                                    text,
                                                                )
                                                            }
                                                            onCommit={(text) =>
                                                                updateSandbox(
                                                                    criterion.id,
                                                                    task.id,
                                                                    "studentReportedScore",
                                                                    text,
                                                                )
                                                            }
                                                            className="text-center text-primary tabular-nums"
                                                        />
                                                        <InputGroupAddon
                                                            align="inline-end"
                                                            className="gap-2 text-muted-foreground tabular-nums"
                                                        >
                                                            <span>/</span>
                                                            <span className="min-w-8 text-center">
                                                                {task.maxScore ?? "Max"}
                                                            </span>
                                                        </InputGroupAddon>
                                                    </InputGroup>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="m-0 px-4 py-3.5 type-small text-muted-foreground">
                                    No {category} records for {term} yet.
                                </p>
                            )}
                        </section>
                    );
                })}

                {uncountedTasks > 0 && (
                    <p className="m-0 px-4 py-3.5 type-small text-muted-foreground">
                        {uncountedTasks} task{uncountedTasks === 1 ? "" : "s"} from criteria that
                        are no longer in this subject&apos;s grading rule{" "}
                        {uncountedTasks === 1 ? "is" : "are"} hidden and not counted.
                    </p>
                )}

                {showAddTask && (
                    <form
                        className="flex flex-wrap items-start gap-2 border-y border-border bg-muted px-4 py-3.5"
                        onSubmit={addCustomTask}
                        noValidate
                    >
                        <NativeSelect
                            value={selectedCategory}
                            onChange={(event) => setTaskCategory(event.target.value)}
                            aria-label="Sandbox task category"
                            className="max-w-full bg-card"
                        >
                            {criteria.map((criterion) => (
                                <NativeSelectOption key={criterion.id} value={criterion.id}>
                                    {criterion.path.join(" › ")}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                        <Field
                            data-invalid={addTaskError === "Please enter a task name."}
                            className="min-w-45 flex-1 gap-1"
                        >
                            <Input
                                type="text"
                                name="taskName"
                                placeholder="Task name"
                                value={taskNameInput}
                                aria-invalid={addTaskError === "Please enter a task name."}
                                onChange={(event) => {
                                    setTaskNameInput(event.target.value);
                                    setAddTaskError("");
                                }}
                                aria-label="Sandbox task name"
                                className="bg-card"
                            />
                            {addTaskError === "Please enter a task name." && (
                                <FieldError>{addTaskError}</FieldError>
                            )}
                        </Field>
                        <Field
                            data-invalid={addTaskError.startsWith("Please enter a whole-number")}
                            className="w-32 gap-1"
                        >
                            <Input
                                type="text"
                                name="taskMaxScore"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Max score"
                                value={taskMaxScore}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    if (/^\d*$/.test(value)) {
                                        setTaskMaxScore(value);
                                        setAddTaskError("");
                                    }
                                }}
                                aria-invalid={addTaskError.startsWith(
                                    "Please enter a whole-number",
                                )}
                                aria-label="Maximum score"
                                className="bg-card"
                            />
                            {addTaskError.startsWith("Please enter a whole-number") && (
                                <FieldError>{addTaskError}</FieldError>
                            )}
                        </Field>
                        <Button type="submit">Add</Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-card"
                            onClick={() => {
                                setShowAddTask(false);
                                setTaskNameInput("");
                                setTaskMaxScore("");
                                setAddTaskError("");
                            }}
                        >
                            Cancel
                        </Button>
                        {addTaskError.startsWith("This subject") && (
                            <FieldError className="basis-full">{addTaskError}</FieldError>
                        )}
                    </form>
                )}

                {saveError && (
                    <p className="m-0 px-4 pt-3 type-small text-destructive" role="alert">
                        {saveError}
                    </p>
                )}
                <div className="p-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed border-self-reported text-self-reported-foreground hover:bg-secondary/40 hover:text-self-reported-foreground aria-expanded:bg-transparent"
                        onClick={() => {
                            setSaveError("");
                            setAddTaskError("");
                            setShowAddTask((shown) => !shown);
                        }}
                        aria-expanded={showAddTask}
                    >
                        {showAddTask ? "Close" : "+ Add Custom Task"}
                    </Button>
                </div>
            </Card>

            <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown} className="mt-3">
                <DisclosureTrigger className="-ml-2">
                    {showBreakdown
                        ? "Hide Official Grade Breakdown"
                        : "View Complete Official Grade Breakdown"}
                </DisclosureTrigger>
                <p className="m-0 mt-1 type-small text-muted-foreground">
                    ⓘ Sandbox edits cannot change these records.
                </p>

                <CollapsibleContent className="mt-2 flex flex-col gap-4 pt-2 pb-4.5">
                    <p className="m-0 type-small text-muted-foreground">
                        All professor-recorded assessments used by the calculator are listed here.
                        Private task notes above are excluded.
                    </p>
                    {criteria.map((criterion) => {
                        const tasks = tasksFor(criterion.id).filter((task) => !task.isCustomTask);
                        return (
                            <section
                                className="rounded-lg border border-border bg-card px-4 py-3.5 max-sm:p-3"
                                key={criterion.id}
                            >
                                <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2.5 max-sm:gap-1.5">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted type-small font-semibold text-primary">
                                            {criterion.name.charAt(0).toUpperCase()}
                                        </span>
                                        <h3 className="m-0 type-card-title text-foreground">
                                            {criterion.path.join(" › ")}
                                        </h3>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="shrink-0 bg-muted text-muted-foreground"
                                    >
                                        {formatPercent(criterion.effectiveShare)} of term grade
                                    </Badge>
                                </div>
                                {tasks.length ? (
                                    tasks.map((task) => (
                                        <div
                                            className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-0.5 py-2.5 last:border-b-0 max-sm:gap-2.5"
                                            key={task.id}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="m-0 type-body wrap-anywhere text-foreground">
                                                    {term} · {taskName(task, criterion.name)}
                                                </p>
                                                <p className="m-0 mt-1 type-small text-muted-foreground">
                                                    {hasOfficialScore(task)
                                                        ? "Recorded by professor"
                                                        : "Awaiting professor score"}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <strong className="block type-body font-semibold text-primary tabular-nums">
                                                    {hasOfficialScore(task)
                                                        ? `${task.officialScore} / ${task.maxScore}`
                                                        : "—"}
                                                </strong>
                                                <span className="mt-1 block type-small text-muted-foreground">
                                                    {hasOfficialScore(task)
                                                        ? "Locked · Official"
                                                        : "Not yet recorded"}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="m-0 py-3 type-small text-muted-foreground">
                                        No official {criterion.name} records for {term}.
                                    </p>
                                )}
                            </section>
                        );
                    })}
                </CollapsibleContent>
            </Collapsible>
        </section>
    );
}
