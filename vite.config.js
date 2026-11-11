import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
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
