import React, { ComponentType } from 'react';
import Frame from './Frame';
export default function withLayout<P extends object>(Component: ComponentType<P>) {
	return function Layout(props: P) {
		return (
			<Frame>
				<Component {...props} />
			</Frame>
		);
	};
}
