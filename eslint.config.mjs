import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
	...nextVitals,
	{
		rules: {
			// Preserve the existing effect/imperative carousel behavior during the
			// framework upgrade. React Compiler adoption is a separate change.
			'react-hooks/set-state-in-effect': 'off',
			'react-hooks/immutability': 'off',
			'react/no-unknown-property': 'error',
		},
	},
];

export default config;
