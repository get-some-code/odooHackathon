import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  {
    ignores: ["next-env.d.ts", ".next/**", "out/**", "build/**", "node_modules/**"],
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    rules: {
      // Add custom rule overrides here
    },
  }),
];

export default eslintConfig;
