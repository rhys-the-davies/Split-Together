import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Apply server-only import restrictions to component files only.
    // Route Handlers (route.ts) and Server Actions (actions.ts) in src/app/
    // are always server-side and may legitimately import admin/env.
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      /**
       * Prevent importing the service-role Supabase admin client in
       * component or app files. The admin client holds SUPABASE_SERVICE_ROLE_KEY
       * and must never be bundled into the browser.
       *
       * Move any logic requiring supabaseAdmin into a Server Action or Route Handler.
       */
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message:
                "supabaseAdmin is server-only. Import it only in Server Components, Server Actions, or Route Handlers — never in Client Components.",
            },
            {
              name: "@/lib/env",
              message:
                "env.ts contains server-only secrets. Import it only in server-side code. Client Components should read NEXT_PUBLIC_* vars directly from process.env.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
