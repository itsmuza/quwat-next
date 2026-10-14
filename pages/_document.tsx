import Document, { Html, Head, Main, NextScript } from 'next/document';
export default class QuwatDocument extends Document {
	render() {
		return (
			<Html lang={this.props.__NEXT_DATA__.locale === 'kr' ? 'ko' : this.props.__NEXT_DATA__.locale || 'uz'}>
				<Head>
					<meta name="robots" content="index,follow" />
					<link rel="icon" type="image/svg+xml" href="/img/logo/favicon.svg" />
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}
