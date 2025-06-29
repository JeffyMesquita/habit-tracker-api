import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		globals: true,
		root: './',
		alias: {
			'@': resolve(__dirname, './src'),
			'@database': resolve(__dirname, './src/database'),
			'@modules': resolve(__dirname, './src/modules'),
			'@misc': resolve(__dirname, './src/misc'),
			'@services': resolve(__dirname, './src/services'),
			'@guards': resolve(__dirname, './src/guards'),
			'@decorators': resolve(__dirname, './src/decorators'),
			'@libs': resolve(__dirname, './src/libs'),
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			'@database': resolve(__dirname, './src/database'),
			'@modules': resolve(__dirname, './src/modules'),
			'@misc': resolve(__dirname, './src/misc'),
			'@services': resolve(__dirname, './src/services'),
			'@guards': resolve(__dirname, './src/guards'),
			'@decorators': resolve(__dirname, './src/decorators'),
			'@libs': resolve(__dirname, './src/libs'),
		},
	},
	plugins: [
		swc.vite({
			jsc: {
				target: 'es2020',
				parser: {
					syntax: 'typescript',
					decorators: true,
				},
				transform: {
					legacyDecorator: true,
					decoratorMetadata: true,
				},
			},
			module: {
				type: 'es6',
			},
			isModule: true,
			swcrc: false,
		}),
	],
});
