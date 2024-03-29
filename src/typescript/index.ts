import { json, lines, packageJson, yaml } from 'mrm-core';

import { execCommand, format, install, isUsingYarn, isUsingYarnBerry } from '../utils';
import tsConfig from './_tsconfig.json';

const dependencies = ['typescript', '@types/node', 'rimraf'];

module.exports = function task() {
	const pkg = packageJson()
		.setScript('prepublishOnly', `${isUsingYarn() ? 'yarn' : 'npm run'} build`)
		.setScript('build', 'rimraf build && tsc')
		.setScript('types:check', 'tsc --noEmit')
		.set('types', 'build/index.d.ts')
		.merge({ files: ['build'] });

	json('tsconfig.json').merge(tsConfig).save();
	lines('.gitignore').add(tsConfig.compilerOptions.outDir).save();

	const eslintRc = yaml('.eslintrc.yml');

	if (eslintRc.exists() && !eslintRc.get('parserOptions.project')) {
		pkg.setScript('lint', 'eslint . --ext ts').save();
		eslintRc.merge({ parserOptions: { project: 'tsconfig.json' } }).save();
	}

	install(dependencies);
	format(['tsconfig.json', '.eslintrc.yml', 'package.json']);

	const vscodeConfigExists = json('.vscode/settings.json').exists();

	if (isUsingYarnBerry()) {
		execCommand('yarn', ['dlx', '@yarnpkg/sdks', vscodeConfigExists ? 'vscode' : 'base']);
	}
};

module.exports.description = 'Adds TypeScript to the project';
