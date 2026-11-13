// The "New Subject Request" form. It saves the subject itself, so any page
// can show it (Dashboard and My Subjects use it through EnrolledSubjectsTable).
import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { getDb, saveDb } from "@/services/db";
import { getRuleFormulaText } from "@/lib/rules";
import { addSubject, getInitialRuleId } from "@/lib/subjects";

const FIELD_LABELS = {
    subjectCode: "subject code",
    subjectName: "subject name",
    professorName: "professor",
    section: "program / section",
};

function missingFieldMessage(field) {
    return field === "computationRuleId"
        ? "Please choose a grading rule."
        : `Please enter your ${FIELD_LABELS[field]}.`;
}

// studentId: who is adding the subject (the signed-in student).
// initialSection: prefilled program / section (usually the student's own).
// onAdded(classItem): called after the subject is saved.
// onCancel(): called when the student closes the form.
export function AddSubjectForm({ studentId, initialSection = "", onCancel, onAdded }) {
    // Rules are read once when the form opens. The form starts on the rule of
    // the student's most recently added subject (see getInitialRuleId).
    const [{ rules, initialRuleId }] = useState(() => {
        const db = getDb();
        return {
            rules: db?.computationRules ?? [],
            initialRuleId: getInitialRuleId(db, studentId),
        };
    });
    const [subjectCode, setSubjectCode] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [professorName, setProfessorName] = useState("");
    const [section, setSection] = useState(initialSection);
    const [computationRuleId, setComputationRuleId] = useState(() =>
        rules.some((rule) => rule.id === initialRuleId) ? initialRuleId : (rules[0]?.id ?? ""),
    );
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState("");

    const selectedRule = rules.find((rule) => rule.id === computationRuleId);

    function handleSubmit(event) {
        event.preventDefault();
        setFormError("");

        const values = {
            subjectCode: subjectCode.trim().toUpperCase(),
            subjectName: subjectName.trim(),
            professorName: professorName.trim(),
            section: section.trim(),
            computationRuleId,
        };
        const missingFields = Object.entries(values).filter(([, value]) => !value);

        if (missingFields.length > 0) {
            const errors = Object.fromEntries(
                missingFields.map(([field]) => [field, missingFieldMessage(field)]),
            );
            setFieldErrors(errors);
            event.currentTarget.elements.namedItem(missingFields[0][0])?.focus();
            return;
        }

        setFieldErrors({});
        const db = getDb();
        if (!db) {
            setFormError("Unable to load subject data from local storage.");
            return;
        }

        const result = addSubject(db, studentId, values);
        if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
            const firstField = Object.keys(result.fieldErrors)[0];
            event.currentTarget.elements.namedItem(firstField)?.focus();
            return;
        }
        if (result.formError) {
            setFormError(result.formError);
            return;
        }

        try {
            saveDb(result.db);
        } catch (error) {
            setFormError(`Could not save the subject: ${error.message}`);
            return;
        }
        onAdded?.(result.classItem);
    }

    function updateField(field, value, setter) {
        setter(value);
        setFieldErrors((errors) => ({ ...errors, [field]: "" }));
        setFormError("");
    }

    const textField = (name, label, value, setValue, errorId, placeholder) => (
        <Field data-invalid={Boolean(fieldErrors[name])} className="gap-1.5">
            <FieldLabel htmlFor={name} className="font-normal text-muted-foreground">
                {label}
            </FieldLabel>
            <Input
                id={name}
                name={name}
                value={value}
                aria-invalid={Boolean(fieldErrors[name])}
                aria-describedby={fieldErrors[name] ? errorId : undefined}
                onChange={(event) => updateField(name, event.target.value, setValue)}
                placeholder={placeholder}
                className="bg-card"
            />
            {fieldErrors[name] && <FieldError id={errorId}>{fieldErrors[name]}</FieldError>}
        </Field>
    );

    return (
        <form
            className="flex flex-col gap-4 rounded-xl border border-border bg-muted p-5"
            onSubmit={handleSubmit}
            noValidate
        >
            <div>
                <h2 className="m-0 type-card-title text-foreground">New Subject Request</h2>
                <p className="mt-1 type-small text-muted-foreground">
                    You can view all three terms and add private sandbox entries while your request
                    awaits verification.
                </p>
            </div>
            <FieldGroup className="grid grid-cols-2 items-start gap-3.5 max-sm:grid-cols-1">
                {textField(
                    "subjectCode",
                    "Subject code",
                    subjectCode,
                    setSubjectCode,
                    "subject-code-error",
                    "e.g. IT102",
                )}
                {textField(
                    "subjectName",
                    "Subject name",
                    subjectName,
                    setSubjectName,
                    "subject-name-error",
                    "e.g. Data Structures",
                )}
                {textField(
                    "professorName",
                    "Professor",
                    professorName,
                    setProfessorName,
                    "professor-name-error",
                    "e.g. Prof. Maria Santos",
                )}
                {textField("section", "Program / section", section, setSection, "section-error")}
                <Field data-invalid={Boolean(fieldErrors.computationRuleId)} className="gap-1.5">
                    <FieldLabel
                        htmlFor="computationRuleId"
                        className="font-normal text-muted-foreground"
                    >
                        Grading rule
                    </FieldLabel>
                    {rules.length > 0 ? (
                        <NativeSelect
                            id="computationRuleId"
                            name="computationRuleId"
                            value={computationRuleId}
                            aria-invalid={Boolean(fieldErrors.computationRuleId)}
                            aria-describedby={
                                fieldErrors.computationRuleId
                                    ? "computation-rule-error"
                                    : "computation-rule-formula"
                            }
                            onChange={(event) =>
                                updateField(
                                    "computationRuleId",
                                    event.target.value,
                                    setComputationRuleId,
                                )
                            }
                            className="w-full bg-card"
                        >
                            {rules.map((rule) => (
                                <NativeSelectOption key={rule.id} value={rule.id}>
                                    {rule.ruleName}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                    ) : (
                        <FieldError id="computation-rule-error">
                            No grading rules yet. Create one first.
                        </FieldError>
                    )}
                    {selectedRule && !fieldErrors.computationRuleId && (
                        <span
                            className="type-small text-muted-foreground tabular-nums"
                            id="computation-rule-formula"
                        >
                            {getRuleFormulaText(selectedRule)}
                        </span>
                    )}
                    {fieldErrors.computationRuleId && rules.length > 0 && (
                        <FieldError id="computation-rule-error">
                            {fieldErrors.computationRuleId}
                        </FieldError>
                    )}
                    <div>
                        <Link
                            to="/student/rules"
                            className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "w-fit border-primary bg-secondary font-normal text-muted-foreground no-underline hover:bg-primary hover:text-primary-foreground",
                            )}
                        >
                            {rules.length > 0
                                ? "View or create grading rules"
                                : "Create a grading rule"}
                        </Link>
                    </div>
                </Field>
            </FieldGroup>
            {formError && (
                <Alert variant="destructive" aria-live="assertive">
                    <AlertDescription className="text-destructive">{formError}</AlertDescription>
                </Alert>
            )}
            <div className="flex items-center gap-2">
                <Button type="submit">Add Subject</Button>
                <Button
                    type="button"
                    variant="outline"
                    className="bg-card text-muted-foreground"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
