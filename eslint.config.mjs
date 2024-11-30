import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  { files: ["**/*.js"], languageOptions: {sourceType: "commonjs"} },
  { languageOptions: { globals: globals.node } },
  { languageOptions: { globals: globals.jest } },
  { ignores: ["loadTests/"] },
  pluginJs.configs.recommended,
];
