const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const { i18n } = require('../next-i18next.config');
const dictionaries = Object.fromEntries(
	i18n.locales.map((locale) => [locale, require(`../public/locales/${locale}/common.json`)]),
);
const keys = Object.keys(dictionaries.uz).sort();
const placeholders = (text) => [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((item) => item[1]).sort();
for (const [locale, dictionary] of Object.entries(dictionaries)) {
	assert.deepEqual(Object.keys(dictionary).sort(), keys, `${locale}: translation keys differ`);
	for (const key of keys) {
		assert.equal(typeof dictionary[key], 'string', `${locale}: ${key}`);
		assert.ok(dictionary[key].trim(), `${locale}: empty translation for ${key}`);
		assert.deepEqual(
			placeholders(dictionary[key]),
			placeholders(dictionaries.uz[key]),
			`${locale}: interpolation differs for ${key}`,
		);
	}
}
const files = [];
function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const name = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(name);
		else if (/\.tsx?$/.test(name)) files.push(name);
	}
}
walk(path.join(root, 'pages'));
walk(path.join(root, 'libs/components'));
const problems = [];
for (const file of files) {
	const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
	const report = (node, text) =>
		problems.push(
			`${path.relative(root, file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: ${text}`,
		);
	function visit(node) {
		if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && ts.isStringLiteral(node.arguments[0])) {
			if (!Object.prototype.hasOwnProperty.call(dictionaries.uz, node.arguments[0].text))
				report(node, `Unknown translation: ${node.arguments[0].text}`);
		}
		if (ts.isJsxText(node)) {
			const text = node.text.replace(/\s+/g, ' ').trim();
			if (/[a-zA-Z‘’\u0400-\u04ff\uac00-\ud7af]/.test(text) && !['Quwat', 'Quwat /'].includes(text))
				report(node, `Untranslated JSX text: ${text}`);
		}
		if (
			ts.isJsxAttribute(node) &&
			['label', 'title', 'placeholder', 'helperText', 'aria-label', 'alt'].includes(node.name.text) &&
			node.initializer &&
			ts.isStringLiteral(node.initializer)
		) {
			const text = node.initializer.text;
			if (text && text !== 'Quwat') report(node, `Untranslated attribute: ${text}`);
		}
		ts.forEachChild(node, visit);
	}
	visit(source);
}
assert.equal(problems.length, 0, problems.join('\n'));
console.log(`PASS: ${keys.length} keys across ${i18n.locales.join(', ')}; UI text and interpolation audit passed.`);
