// The dashed box a grade-history chart shows when it has nothing to draw.
export function HistoryEmpty({ children }) {
    return (
        <p className="m-0 rounded-lg border border-dashed border-border px-5 py-7 text-center type-small text-muted-foreground">
            {children}
        </p>
    );
}
