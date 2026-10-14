/** Convert the dominant mouse/trackpad wheel axis to horizontal pixels. */
export function horizontalWheelDelta(
	event: Pick<WheelEvent, 'deltaX' | 'deltaY' | 'deltaMode'>,
	viewportWidth: number,
) {
	const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
	const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportWidth : 1;
	return delta * unit;
}

export function listenToHorizontalWheel(element: HTMLDivElement, enabled: boolean) {
	const onWheel = (event: WheelEvent) => {
		// Leave browser zoom gestures and disabled controls untouched.
		if (!enabled || event.ctrlKey || event.metaKey || !event.cancelable) return;
		const delta = horizontalWheelDelta(event, element.clientWidth);
		if (!delta) return;
		event.preventDefault();
		element.scrollLeft += delta;
	};
	element.addEventListener('wheel', onWheel, { passive: false });
	return () => element.removeEventListener('wheel', onWheel);
}

/** Keep the rendered scene inside its repeated cycle while damping across an edge. */
export function wrapScrollOffset(offset: number) {
	return ((offset % 1) + 1) % 1;
}
