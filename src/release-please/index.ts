/* eslint-disable no-template-curly-in-string */

import { packageJson, yaml } from 'mrm-core';
import { minVersion, satisfies } from 'semver';

import { format, isUsingYarn } from '../utils';

const NODE_MAJOR_VERSIONS = Array.from({ length: 18 }, (_, index) => (index + 1).toString()).reverse();

module.exports = function task() {
	const pkg = packageJson();
	const version = pkg.get('engines.node', '>=16.0.0');
	const maxMajorVersion =
		NODE_MAJOR_VERSIONS.find((nodeVersion) => satisfies(`${nodeVersion}.0.0`, version)) ?? minVersion(version)?.raw;
	const usingYarn = isUsingYarn();

	yaml('.github/workflows/release-please.yml')
		.merge({
			name: 'Release Please',
			on: {
				push: {
					branches: ['main'],
				},
			},
			jobs: {
				'release-please': {
					'runs-on': 'ubuntu-latest',
					steps: [
						{
							uses: 'GoogleCloudPlatform/release-please-action@v2',
							id: 'release',
							with: {
								token: '${{ secrets.GITHUB_TOKEN }}',
								'release-type': 'node',
								'default-branch': 'main',
								'pull-request-title-pattern': 'chore${scope}: release${component} v${version}',
								'bump-minor-pre-major': true,
								'changelog-types': JSON.stringify([
									{
										type: 'feat',
										section: 'Features',
									},
									{
										type: 'fix',
										section: 'Bug Fixes',
									},
									{
										type: 'perf',
										section: 'Performance Improvements',
									},
									{
										type: 'deps',
										section: 'Dependencies',
									},
									{
										type: 'revert',
										section: 'Reverts',
									},
									{
										type: 'docs',
										section: 'Documentation',
									},
									{
										type: 'style',
										section: 'Styles',
										hidden: true,
									},
									{
										type: 'chore',
										section: 'Miscellaneous Chores',
										hidden: true,
									},
									{
										type: 'refactor',
										section: 'Code Refactoring',
										hidden: true,
									},
									{
										type: 'test',
										section: 'Tests',
										hidden: true,
									},
									{
										type: 'ci',
										section: 'Continuous Integration',
										hidden: true,
									},
								]),
							},
						},
						{
							uses: 'actions/checkout@v2',
							if: '${{ steps.release.outputs.release_created }}',
						},
						{
							name: `Use Node.js v${maxMajorVersion}`,
							uses: 'actions/setup-node@v2',
							with: {
								'node-version': maxMajorVersion,
								'registry-url': 'https://registry.npmjs.org',
							},
							if: '${{ steps.release.outputs.release_created }}',
						},
						{
							name: 'Install dependencies',
							run: usingYarn ? 'yarn install --immutable' : 'npm ci',
							if: '${{ steps.release.outputs.release_created }}',
						},
						{
							name: 'Publish to NPM',
							run: usingYarn ? 'yarn npm publish --access public' : 'npm publish --access public',
							env: {
								[`${usingYarn ? 'YARN_NPM' : 'NODE'}_AUTH_TOKEN`]: '${{ secrets.NPM_TOKEN }}',
							},
							if: '${{ steps.release.outputs.release_created }}',
						},
					],
				},
			},
		})
		.save();

	format(['.github/workflows/release-please.yml']);
};

module.exports.description = 'Adds Release Please to the project';
