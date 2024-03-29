import { lines } from 'mrm-core';
import { isUsingYarnBerry } from '../utils';

const defaults = [
	'# Logs',
	'logs',
	'*.log',
	'npm-debug.log*',
	'yarn-debug.log*',
	'yarn-error.log*',
	'lerna-debug.log*',
	'',
	'# Diagnostic reports (https://nodejs.org/api/report.html)',
	'report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json',
	'',
	'# Runtime data',
	'pids',
	'*.pid',
	'*.seed',
	'*.pid.lock',
	'',
	'# Dependency directories',
	'node_modules',
	'',
	'# Optional npm cache directory',
	'.npm',
	'',
	'# Optional eslint cache',
	'.eslintcache',
	'',
	'# Optional REPL history',
	'.node_repl_history',
	'',
	"# Output of 'npm pack'",
	'*.tgz',
	'',
	'# TypeScript',
	'*.tsbuildinfo',
];

const yarn = [
	'# Yarn Berry',
	'.yarn/*',
	'!.yarn/patches',
	'!.yarn/releases',
	'!.yarn/plugins',
	'!.yarn/sdks',
	'!.yarn/versions',
	'.pnp.*',
	'',
];

module.exports = function task() {
	lines('.gitignore')
		.add([...(isUsingYarnBerry() ? yarn : []), ...defaults])
		.save();
};

module.exports.description = 'Adds a gitignore to the project';
