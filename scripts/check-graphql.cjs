require('./register-typescript.cjs');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { getIntrospectionQuery, buildClientSchema, buildSchema, validate } = require('graphql');
const args = process.argv.slice(2);
const schemaFlag = args.indexOf('--schema');
const filesFlag = args.indexOf('--files');
const files =
	filesFlag >= 0
		? args[filesFlag + 1].split(',')
		: ['apollo/user/query.ts', 'apollo/user/mutation.ts', 'apollo/admin/query.ts', 'apollo/admin/mutation.ts'];
function introspect() {
	let endpoint = process.env.REACT_APP_API_GRAPHQL_URL;
	for (const file of ['.env.local', '.env.development', '.env']) {
		if (!endpoint && fs.existsSync(file))
			endpoint = fs.readFileSync(file, 'utf8').match(/^REACT_APP_API_GRAPHQL_URL\s*=\s*["']?([^\s"']+)/m)?.[1];
	}
	endpoint ||= 'http://localhost:3007/graphql';
	const body = JSON.stringify({ query: getIntrospectionQuery() });
	return new Promise((resolve, reject) => {
		const request = (endpoint.startsWith('https:') ? https : http).request(
			endpoint,
			{ method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
			(response) => {
				let data = '';
				response.on('data', (chunk) => (data += chunk));
				response.on('end', () => {
					try {
						const json = JSON.parse(data);
						if (!json.data?.__schema) throw new Error('Schema introspection failed');
						resolve(buildClientSchema(json.data));
					} catch (error) {
						reject(error);
					}
				});
			},
		);
		request.setTimeout(10000, () => request.destroy(new Error('Schema request timed out')));
		request.on('error', reject);
		request.end(body);
	});
}
(async () => {
	const schema = schemaFlag >= 0 ? buildSchema(fs.readFileSync(args[schemaFlag + 1], 'utf8')) : await introspect();
	let count = 0,
		failures = 0;
	for (const file of files)
		for (const [name, document] of Object.entries(require(path.resolve(file)))) {
			if (!document || document.kind !== 'Document') continue;
			// Shared fragments are validated as part of their operations.
			if (!document.definitions.some((def) => def.kind === 'OperationDefinition')) continue;
			count++;
			const errors = validate(schema, document);
			failures += errors.length;
			for (const error of errors) console.error(`${file} ${name}: ${error.message}`);
		}
	console.log(`${count} GraphQL operations checked; ${failures} errors.`);
	if (!count || failures) process.exitCode = 1;
})().catch((error) => {
	console.error(error.message || String(error));
	process.exitCode = 1;
});
