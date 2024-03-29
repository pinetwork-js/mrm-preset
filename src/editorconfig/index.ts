import { ini } from 'mrm-core';

const defaults: Record<string, Record<string, boolean | number | string>> = {
	'*': {
		/* eslint-disable-next-line unicorn/text-encoding-identifier-case */
		charset: 'utf-8',
		end_of_line: 'lf',
		insert_final_newline: true,
		trim_trailing_whitespace: true,
		max_line_length: 120,
		indent_style: 'tab',
		indent_size: 2,
		tab_width: 2,
		quote_type: 'single',
	},
	'*.yml': {
		indent_style: 'space',
	},
	'*.md': {
		trim_trailing_whitespace: false,
	},
};

module.exports = function task() {
	const editorconfig = ini('.editorconfig').set('_global', { root: true });

	for (const key of Object.keys(defaults)) {
		editorconfig.set(key, defaults[key]);
	}

	editorconfig.save();
};

module.exports.description = 'Adds a EditorConfig to the project';
