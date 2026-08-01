import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default tseslint.config(
    {
        ignores: [
            '.svelte-kit/',
            'build/',
            'node_modules/',
            'data/',
            'static/',
            'upload/'
        ]
    },

    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...svelte.configs.recommended,

    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            },
            parserOptions: {
                projectService: {
                    // root-level config files (eslint.config.js, svelte.config.js)
                    // aren't covered by .svelte-kit/tsconfig.json's include
                    allowDefaultProject: ['*.js']
                },
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: ['.svelte']
            }
        }
    },

    {
        files: ['**/*.svelte', '**/*.svelte.ts'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
                svelteConfig
            }
        }
    },
    {
        rules: {
            semi: ['error', 'always'],
            indent: ['error', 4],
            'space-before-function-paren': [
                'error',
                {
                    anonymous: 'never',
                    named: 'never',
                    asyncArrow: 'always'
                }
            ]
        }
    },
    {
        files: ['**/*.svelte'],
        rules: {
            indent: 'off'
        }
    },

    {
        rules: {
            'svelte/no-navigation-without-resolve': 'off'
        }
    }
);
