// A warning line in the rule dialogs, with a coral bar on the left: tasks
// that will stop counting, or a save error. Other props (such as role) go on
// the paragraph.
export function RuleWarning({ children, ...props }) {
    return (
        <p
            className="m-0 border-0 border-l-4 border-solid border-warning bg-warning-soft px-3 py-2.5 text-foreground"
            {...props}
        >
            {children}
        </p>
    );
}
