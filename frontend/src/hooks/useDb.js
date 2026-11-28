// The database as component state: [db, setDb], read once with getDb().
// live: re-read whenever any code saves the database (the
// compugrade-db-updated event from saveDb). With live: false the component
// only sees saves it makes itself through setDb.
import { useEffect, useState } from "react";
import { DB_UPDATED_EVENT, getDb } from "@/services/db";

export function useDb({ live = true } = {}) {
    const [db, setDb] = useState(() => getDb());

    useEffect(() => {
        if (!live) return undefined;
        const refresh = () => setDb(getDb());
        window.addEventListener(DB_UPDATED_EVENT, refresh);
        return () => window.removeEventListener(DB_UPDATED_EVENT, refresh);
    }, [live]);

    return [db, setDb];
}
