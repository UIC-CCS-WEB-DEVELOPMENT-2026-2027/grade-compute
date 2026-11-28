// The left side of a Settings row: the setting's name and a line about it.
// The control (a button or a switch) sits beside it.
export function SettingText({ title, description }) {
    return (
        <div className="min-w-0">
            <h4 className="m-0 mb-1 type-small font-semibold text-foreground">{title}</h4>
            <p className="m-0 type-small text-muted-foreground">{description}</p>
        </div>
    );
}
