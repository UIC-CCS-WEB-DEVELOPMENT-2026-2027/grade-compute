import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    // Tooling folders are not app code (AGENTS.md section 7).
    globalIgnores(["dist", ".agents", ".claude", ".codestudio"]),
    {
        files: ["**/*.{js,jsx}"],
        extends: [
            js.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            globals: globals.browser,
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
    },
    {
        // shadcn/ui components export their cva variants (buttonVariants,
        // badgeVariants, ...) next to the component as part of their API.
        // Fast refresh then reloads the whole file, which is fine for them.
        files: ["src/components/ui/**/*.{js,jsx}"],
        rules: { "react-refresh/only-export-components": "off" },
    },
    {
        // Node scripts (screenshots) run outside the browser.
        files: ["scripts/**/*.mjs"],
        languageOptions: { globals: globals.node },
    },
]);
