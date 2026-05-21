import 'dotenv/config'

export default {
    build: {
        overwriteDest: true,
    },
    ignoreFiles: [
        'package-lock.json',
        'biome.json',
        'commitlint.config.js',
        'esbuild.config.mjs',
        'icon.afphoto',
        'images/gridt.jpg',
        'makefile',
        'package.json',
        'playwright.config.ts',
        'postcss-plugin.js',
        'tests',
        'tsconfig.json',
        'vitest.config.ts',
        'web-ext-config.mjs'
    ],
	sign: {
	    apiKey: "",
	    apiSecret: "",
	    channel: "unlisted"
	}
};
