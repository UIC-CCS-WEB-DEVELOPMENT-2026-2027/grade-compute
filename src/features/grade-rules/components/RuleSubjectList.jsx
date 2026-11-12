// The subjects that use a rule, as shown in the rule dialogs: code, then
// name and section. The list scrolls when it is long.
// classes: [{ classId, subjectCode, subjectName, programSection }].
export function RuleSubjectList({ classes }) {
    return (
        <ul className="m-0 grid max-h-rule-dialog-list list-none gap-2.5 overflow-y-auto p-0">
            {classes.map((item) => (
                <li
                    key={item.classId}
                    className="flex min-h-18 flex-col justify-center gap-0.5 rounded-xl border border-solid border-highlight-strong bg-highlight-soft px-4 py-3"
                >
                    <span className="type-caption tracking-wide text-muted-foreground">
                        {item.subjectCode}
                    </span>
                    <span className="font-semibold text-foreground">
                        {item.subjectName}
                        {item.programSection && ` (${item.programSection})`}
                    </span>
                </li>
            ))}
        </ul>
    );
}
