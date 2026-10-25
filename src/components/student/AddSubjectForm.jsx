import { useState } from "react";

const FIELD_LABELS = {
    subjectCode: "subject code",
    subjectName: "subject name",
    professorName: "professor",
    section: "program / section",
};

export default function AddSubjectForm({ initialSection = "", onCancel, onSubmit }) {
    const [subjectCode, setSubjectCode] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [professorName, setProfessorName] = useState("");
    const [section, setSection] = useState(initialSection);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState("");

    function handleSubmit(event) {
        event.preventDefault();
        setFormError("");

        const values = {
            subjectCode: subjectCode.trim().toUpperCase(),
            subjectName: subjectName.trim(),
            professorName: professorName.trim(),
            section: section.trim(),
        };
        const missingFields = Object.entries(values).filter(([, value]) => !value);

        if (missingFields.length > 0) {
            const errors = Object.fromEntries(
                missingFields.map(([field]) => [
                    field,
                    `Please enter your ${FIELD_LABELS[field]}.`,
                ])
            );
            setFieldErrors(errors);
            event.currentTarget.elements.namedItem(missingFields[0][0])?.focus();
            return;
        }

        setFieldErrors({});
        const result = onSubmit(values);
        if (result?.fieldErrors) {
            setFieldErrors(result.fieldErrors);
            const firstField = Object.keys(result.fieldErrors)[0];
            event.currentTarget.elements.namedItem(firstField)?.focus();
        }
        if (result?.formError) setFormError(result.formError);
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
            </div>
            {formError && (
                <p className="subject-request-error" role="alert" aria-live="assertive">
                    {formError}
                </p>
            )}
            <div className="subject-request-actions">
                <button type="submit" className="subject-menu-add-button">
                    Add Subject
                </button>
                <button type="button" className="subject-request-cancel" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    );
}
