import { URL } from 'url';
import { json, packageJson } from 'mrm-core';
import { valid, validRange } from 'semver';

import { execCommand, format, fsStat, inquirerRequired, isUsingYarn } from '../utils';

interface PackageInfos {
	name: string;
	description: string;
	author: string;
	main: string;
	version: string;
	nodeVersion: string;
	githubUrl: string;
	keywords: string;
}

module.exports = function task({
	name,
	description,
	author,
	main,
	version,
	nodeVersion,
	githubUrl,
	keywords,
}: PackageInfos) {
	const pkg = packageJson();
	const oldName = pkg.get('name');
	const githubUrlFormatted = githubUrl.endsWith('/') ? githubUrl.slice(0, -1) : githubUrl;

	pkg
		.merge({
			name,
			description,
			version,
			main,
			engines: {
				node: nodeVersion,
			},
			author,
			license: fsStat('LICENSE')?.isFile() ? 'MIT' : undefined,
			homepage: `${githubUrlFormatted}#readme`,
			bugs: {
				url: `${githubUrlFormatted}/issues`,
			},
			repository: {
				type: 'git',
				url: `git+${githubUrlFormatted}.git`,
			},
			keywords: keywords.split(/\s*,\s*/),
		})
		.save();

	if (isUsingYarn() && oldName !== name) {
		execCommand('yarn');
	}

	format(['package.json']);
};

function defaultMain(paths: string[]): string {
	for (const path of paths) {
		if (fsStat(path)?.isFile()) {
			return path;
		}
	}

	return 'build/index.js';
}

const tsConfig = json('tsconfig.json');

module.exports.parameters = {
	name: {
		type: 'input',
		message: 'Package name',
		validate(input: string): string | true {
			const isValid = /^((?:@[\d*a-z~-][\d*._a-z~-]*\/)|)[\da-z~-][\d._a-z~-]*$/.test(input);

			return isValid || 'The input does not match the pattern of ^((?:@[d*a-z~-][d*._a-z~-]*/)|)[da-z~-][d._a-z~-]*$.';
		},
	},
	description: {
		type: 'input',
		message: 'Package description',
		validate: inquirerRequired,
	},
	author: {
		type: 'input',
		message: 'Package author',
		default: 'Pinetwork-js',
		validate: inquirerRequired,
	},
	main: {
		type: 'input',
		message: 'Package main file',
		default: tsConfig.exists()
			? tsConfig.get('outDir', 'build/index.js')
			: defaultMain(['index.js', 'src/index.js', 'lib/index.js']),
		validate: inquirerRequired,
	},
	version: {
		type: 'input',
		message: 'Package version',
		default: '0.1.0',
		validate(input: string): string | true {
			return valid(input) ? true : 'The input is not a valid SemVer version.';
		},
	},
	nodeVersion: {
		type: 'input',
		message: "Package Node.js's engine version",
		default: '>=16.0.0',
		validate(input: string): string | true {
			return validRange(input) ? true : 'The input is not a valid SemVer range.';
		},
	},
	githubUrl: {
		type: 'input',
		message: 'Package GitHub repository (e.g. https://github.com/PiNetwork-js/sdk)',
		validate(input: string): string | true {
			let url: URL | undefined;

			try {
				url = new URL(input);
				// eslint-disable-next-line no-empty
			} catch {}

			return url?.origin === 'https://github.com' || 'The input is not a (valid) (GitHub) URL.';
		},
	},
	keywords: {
		type: 'input',
		message: 'Package keywords (comma-separated)',
		default: 'pinetwork-js',
		validate: inquirerRequired,
	},
};

module.exports.description = 'Adds a package.json to the project';
