import { json, lines, packageJson, yaml } from 'mrm-core';
import { execCommand, format, install, isUsingYarn, isUsingYarnBerry } from '../utils';

const dependencies = [
	'@pinetwork-js/eslint-config',
	'@pinetwork-js/prettier-config',
	'eslint',
	'eslint-config-prettier',
	'eslint-plugin-prettier',
	'prettier',
];

module.exports = function task() {
	const usingYarnBerry = isUsingYarnBerry();
	const tsConfig = json('tsconfig.json');
	const tsConfigExists = tsConfig.exists();
	const outDirectory = tsConfigExists ? tsConfig.get('compilerOptions.outDir') : undefined;

	lines('.prettierignore')
		.add([
			'.vscode',
			...(outDirectory ? [outDirectory] : []),
			...(usingYarnBerry ? ['.yarn', '.yarnrc.yml', '.pnp.*'] : []),
		])
		.save();

	if (outDirectory) {
		lines('.eslintignore').add(outDirectory).save();
	}

	yaml('.eslintrc.yml')
		.merge({
			root: true,
			extends: ['@pinetwork-js', 'prettier'],
			plugins: ['prettier'],
			parserOptions: tsConfigExists ? { project: 'tsconfig.json' } : undefined,
			rules: { 'prettier/prettier': 'error' },
			env: { node: true, es2022: true },
		})
		.save();

	packageJson()
		.set('prettier', '@pinetwork-js/prettier-config')
		.setScript('lint', `eslint . --ext ${tsConfigExists ? 'ts,js' : 'js'}`)
		.setScript('lint-fix', `eslint . --ext ${tsConfigExists ? 'ts,js' : 'js'} --fix`)
		.setScript('format', `prettier . --write`)
		.setScript('format:check', `prettier . --check`)
		.save();

	install(dependencies);

	const vscodeConfigExists = json('.vscode/settings.json').exists();

	if (usingYarnBerry) {
		execCommand('yarn', ['add', '-D', 'eslint-import-resolver-node']);
		execCommand('yarn', ['dlx', '@yarnpkg/sdks', vscodeConfigExists ? 'vscode' : 'base']);
	}

	format(['.eslintrc.yml', 'package.json']);
};

module.exports.description = 'Adds ESLint and Prettier to the project';
