import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import meteor from "eslint-plugin-meteor";
import lodash from "eslint-plugin-lodash";
import noJquery from "eslint-plugin-no-jquery";
import babel from "@babel/eslint-plugin";
import promise from "eslint-plugin-promise";
import deprecate from "eslint-plugin-deprecate";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});


export default [{
    ignores: ["client/4minitz.html"],
}, ...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:meteor/recommended",
    "plugin:lodash/canonical",
    "plugin:import/recommended",
    "prettier",
    "plugin:node/recommended",
    "plugin:you-dont-need-lodash-underscore/compatible",
    "plugin:no-jquery/all",
    "plugin:promise/recommended",
    "plugin:mocha-cleanup/recommended",
    "plugin:mocha/recommended",
)), {
    plugins: {
        meteor: fixupPluginRules(meteor),
        lodash: fixupPluginRules(lodash),
        "no-jquery": fixupPluginRules(noJquery),
        "@babel": babel,
        promise: fixupPluginRules(promise),
        deprecate,
        jsdoc,
        '@stylistic',
        stylistic: StylisticPlugin
    },
    StylisticPlugin.configs['disable-legacy'],
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: babelParser,
        ecmaVersion: "latest",
        sourceType: "module",
    },

    rules: {
        "node/no-unsupported-features/es-syntax": "off",
        "node/no-missing-import": "off",
        "lodash/prefer-lodash-method": "off",
        "lodash/prefer-lodash-typecheck": "off",
        "lodash/prefer-get": "off",
        "lodash/prefer-noop": "off",
        "lodash/prefer-constant": "off",
        "lodash/preferred-alias": "error",
        "import/no-unresolved": "off",
        "@stylistic/new-cap": "error",
        "@babel/no-invalid-this": "error",
        "@babel/no-unused-expressions": "error",
        "@stylistic/object-curly-spacing": ["error", "always"],
        "@stylistic/semi": "error",
        "prefer-template": "error",
        eqeqeq: ["error", "smart"],
        "object-shorthand": ["error", "always"],
    },
}];
