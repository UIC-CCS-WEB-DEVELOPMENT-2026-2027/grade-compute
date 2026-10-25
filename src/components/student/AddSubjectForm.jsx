// src/components/student/AddSubjectForm.jsx
// The "New Subject Request" form. It saves the subject itself, so any page
// can show it (Dashboard and My Subjects use it through EnrolledSubjectsTable).
import { useState } from "react";
import { Link } from "react-router-dom";
import { getDb, saveDb } from "../../utils/db";
import { getRuleFormulaText } from "../../utils/rules";
import { addSubject, getInitialRuleId } from "../../utils/subjects";
import "./AddSubjectForm.css";

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

// studentId: who is adding the subject.
// initialSection: prefilled program / section (usually the student's own).
// onAdded(classItem): called after the subject is saved.
// onCancel(): called when the student closes the form.
export default function AddSubjectForm({
    studentId = "U1",
    initialSection = "",
    onCancel,
    onAdded,
}) {
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
        rules.some((rule) => rule.id === initialRuleId) ? initialRuleId : rules[0]?.id ?? ""
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
                missingFields.map(([field]) => [field, missingFieldMessage(field)])
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

    return (
        <form className="subject-request-form" onSubmit={handleSubmit} noValidate>
            <h2>New Subject Request</h2>
            <p>
                You can view all three terms and add private sandbox
                entries while your request awaits verification.
            </p>
            <div className="subject-request-fields">
                <label>
                    Subject code
                    <input
                        name="subjectCode"
                        value={subjectCode}
                        aria-invalid={Boolean(fieldErrors.subjectCode)}
                        aria-describedby={fieldErrors.subjectCode ? "subject-code-error" : undefined}
                        onChange={(event) => updateField("subjectCode", event.target.value, setSubjectCode)}
                        placeholder="e.g. IT102"
                    />
                    {fieldErrors.subjectCode && (
                        <span className="subject-field-error" id="subject-code-error">
                            {fieldErrors.subjectCode}
                        </span>
                    )}
                </label>
                <label>
                    Subject name
                    <input
                        name="subjectName"
                        value={subjectName}
                        aria-invalid={Boolean(fieldErrors.subjectName)}
                        aria-describedby={fieldErrors.subjectName ? "subject-name-error" : undefined}
                        onChange={(event) => updateField("subjectName", event.target.value, setSubjectName)}
                        placeholder="e.g. Data Structures"
                    />
                    {fieldErrors.subjectName && (
                        <span className="subject-field-error" id="subject-name-error">
                            {fieldErrors.subjectName}
                        </span>
                    )}
                </label>
                <label>
                    Professor
                    <input
                        name="professorName"
                        value={professorName}
                        aria-invalid={Boolean(fieldErrors.professorName)}
                        aria-describedby={fieldErrors.professorName ? "professor-name-error" : undefined}
                        onChange={(event) => updateField("professorName", event.target.value, setProfessorName)}
                        placeholder="e.g. Prof. Maria Santos"
                    />
                    {fieldErrors.professorName && (
                        <span className="subject-field-error" id="professor-name-error">
                            {fieldErrors.professorName}
                        </span>
                    )}
                </label>
                <label>
                    Program / section
                    <input
                        name="section"
                        value={section}
                        aria-invalid={Boolean(fieldErrors.section)}
                        aria-describedby={fieldErrors.section ? "section-error" : undefined}
                        onChange={(event) => updateField("section", event.target.value, setSection)}
                    />
                    {fieldErrors.section && (
                        <span className="subject-field-error" id="section-error">
                            {fieldErrors.section}
                        </span>
                    )}
                </label>
                <label>
                    Grading rule
                    {rules.length > 0 ? (
                        <select
                            name="computationRuleId"
                            value={computationRuleId}
                            aria-invalid={Boolean(fieldErrors.computationRuleId)}
                            aria-describedby={
                                fieldErrors.computationRuleId
                                    ? "computation-rule-error"
                                    : "computation-rule-formula"
                            }
                            onChange={(event) =>
                                updateField("computationRuleId", event.target.value, setComputationRuleId)
                            }
                        >
                            {rules.map((rule) => (
                                <option key={rule.id} value={rule.id}>
                                    {rule.ruleName}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span className="subject-field-error" id="computation-rule-error">
                            No grading rules yet. Create one first.
                        </span>
                    )}
                    {selectedRule && !fieldErrors.computationRuleId && (
                        <span className="subject-request-rule-formula" id="computation-rule-formula">
                            {getRuleFormulaText(selectedRule)}
                        </span>
                    )}
                    {fieldErrors.computationRuleId && rules.length > 0 && (
                        <span className="subject-field-error" id="computation-rule-error">
                            {fieldErrors.computationRuleId}
                        </span>
                    )}
                    <Link className="subject-request-rule-link" to="/student/rules">
                        {rules.length > 0 ? "View or create grading rules" : "Go to Grade Rules"}
                    </Link>
                </label>
            </div>
            {formError && (
                <p className="subject-request-error" role="alert" aria-live="assertive">
                    {formError}
                </p>
            )}
            <div className="subject-request-actions">
                <button type="submit" className="subject-request-submit">
                    Add Subject
                </button>
                <button type="button" className="subject-request-cancel" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    );
}
