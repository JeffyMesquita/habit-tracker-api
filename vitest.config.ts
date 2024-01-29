import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		root: './',
		alias: {
			'@': 'src',
			'@database': 'src/database',
			'@modules': 'src/modules',
			'@misc': 'src/misc',
			'@services': 'src/services',
			'@guards': 'src/guards',
			'@decorators': 'src/decorators',
			'@libs': 'src/libs',
		},
	},
	resolve: {
		alias: {
			'@': 'src',
			'@database': 'src/database',
			'@modules': 'src/modules',
			'@misc': 'src/misc',
			'@services': 'src/services',
			'@guards': 'src/guards',
			'@decorators': 'src/decorators',
			'@libs': 'src/libs',
		},
	},
	plugins: [
		swc.vite({
			module: {
				type: 'es6',
			},
			isModule: true,
			swcrc: false,
		}),
	],
});
