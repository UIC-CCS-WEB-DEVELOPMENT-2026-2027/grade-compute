import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        // The Laravel API (backend/, php artisan serve) answers on port 8000.
        // The dev server forwards its routes, so the app and the API share one
        // site, as Sanctum's cookie sign-in needs (docs/LARAVEL_PLAN.md §1.6).
        proxy: {
            "/api": "http://127.0.0.1:8000",
            "/sanctum": "http://127.0.0.1:8000",
        },
    },
    resolve: {
        // "@/..." imports resolve from src/ (AGENTS.md section 5). jsconfig.json
        // mirrors this for editors and the shadcn CLI.
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    test: {
        // Pure logic runs in Node. Component tests opt in to a DOM with a
        // "@vitest-environment jsdom" comment at the top of the file.
        environment: "node",
        include: ["src/**/*.test.{js,jsx}"],
        exclude: ["node_modules", "dist", ".agents", ".claude", ".codestudio"],
        setupFiles: ["./src/test/setup.js"],
    },
});
