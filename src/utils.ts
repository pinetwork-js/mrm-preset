import { spawnSync } from 'child_process';
import type { Stats } from 'fs';
import { statSync } from 'fs';
import { packageJson } from 'mrm-core';

type ArrayOrObject = Record<PropertyKey, unknown> | unknown[];

const PackagePropertiesOrder = [
	'name',
	'description',
	'version',
	'private',
	'main',
	'types',
	'prettier',
	'scripts',
	'engines',
	'packageManager',
	'author',
	'maintainers',
	'license',
	'repository',
	'homepage',
	'bugs',
	'dependencies',
	'peerDependencies',
	'devDependencies',
	'files',
	'jest',
	'keywords',
];

function* cleanArray(array: unknown[]): Generator {
	for (const value of array) {
		// eslint-disable-next-line eqeqeq
		if (value != undefined) {
			yield typeof value === 'object' ? cleanObjectOrArray(value as ArrayOrObject) : value;
		}
	}
}

function* cleanObject(object: Record<PropertyKey, unknown>): Generator<unknown[]> {
	for (const entry of cleanArray(Object.entries(object)) as Iterable<unknown[]>) {
		if (entry.length === 2) {
			yield entry;
		}
	}
}

export function cleanObjectOrArray(object: ArrayOrObject): ArrayOrObject {
	return Array.isArray(object) ? [...cleanArray(object)] : Object.fromEntries(cleanObject(object));
}

export function execCommand(command: string, args: string[] = []): void {
	spawnSync(command, args, {
		stdio: 'inherit',
		cwd: process.cwd(),
	});
}

export function orderProperties<T extends Record<string, unknown>>(object: T, order: string[]): T {
	const ordered: Partial<T> = {};

	for (const key of Object.keys(object).sort((a, b) => order.indexOf(a) - order.indexOf(b)) as (keyof T)[]) {
		ordered[key] = object[key];
	}

	return ordered as T;
}

export function format(files: string[]): void {
	const pkg = packageJson();

	if (!pkg.exists() || !(pkg.get('prettier') && files.includes('package.json'))) {
		return;
	}

	console.log('Formatting...');

	if (files.includes('package.json')) {
		pkg.set(orderProperties(pkg.get(), PackagePropertiesOrder)).save();
	}

	if (pkg.get('prettier')) {
		const usingYarn = isUsingYarn();
		execCommand(usingYarn ? 'yarn' : 'npx', [
			'prettier',
			...(usingYarn ? [] : ['--no-install', '--']),
			...files,
			'--write',
		]);
	}
}

export function fsStat(filename: string): Stats | undefined {
	try {
		return statSync(filename);
		// eslint-disable-next-line no-empty
	} catch {}
}

export function isUsingYarn(): boolean {
	return fsStat('yarn.lock')?.isFile() ?? false;
}

export function isUsingYarnBerry(): boolean {
	return fsStat('.yarnrc.yml')?.isFile() ?? false;
}

export function install(dependencies: string[]): void {
	const usingYarn = isUsingYarn() || isUsingYarnBerry();

	execCommand(usingYarn ? 'yarn' : 'npm', ['add', usingYarn ? '-D' : '--save-dev', ...dependencies]);
}

export function inquirerRequired(input: string | undefined): boolean {
	return !!input?.trim();
}
