import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { initializeDatabase } from "@/services/db.js";

// Seed localStorage from db.json before any page calls getDb().
initializeDatabase();

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
