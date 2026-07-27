import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat config, so consume it directly.
// (The old FlatCompat.extends("next/...") path breaks under ESLint 10 +
// eslint-config-next 16 with a circular-structure error.)
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    rules: {
      "@next/next/no-img-element": "off",
      // New React-Compiler-era rules turned on by eslint-config-next 16.
      // They flag pre-existing, valid patterns (e.g. setState in a localStorage
      // hydration effect). Deferred as a separate cleanup so the dependency
      // migration stays focused on deps, not a hooks refactor.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
];

export default eslintConfig;
