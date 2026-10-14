require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { horizontalWheelDelta, listenToHorizontalWheel, wrapScrollOffset } = require('../libs/fiberScroll.ts');

function scroller(enabled = true) {
	const element = new EventTarget();
	element.clientWidth = 800;
	element.scrollLeft = 400;
	const stop = listenToHorizontalWheel(element, enabled);
	return { element, stop };
}
function wheel(values = {}) {
	const event = new Event('wheel', { cancelable: true });
	Object.assign(event, { deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, metaKey: false }, values);
	return event;
}

test('trackpad horizontal and mouse vertical wheel move photos without scrolling the page', () => {
	const { element, stop } = scroller();
	for (const values of [{ deltaX: 120 }, { deltaY: 80 }, { deltaX: -200 }, { deltaY: -60 }]) {
		const event = wheel(values);
		assert.equal(element.dispatchEvent(event), false, 'default page scroll must be cancelled');
		assert.equal(event.defaultPrevented, true);
	}
	assert.equal(element.scrollLeft, 340);
	stop();
});

test('diagonal gestures use one dominant axis and normalize line/page wheel units', () => {
	assert.equal(horizontalWheelDelta(wheel({ deltaX: 100, deltaY: 20 }), 800), 100);
	assert.equal(horizontalWheelDelta(wheel({ deltaX: 15, deltaY: -100 }), 800), -100);
	assert.equal(horizontalWheelDelta(wheel({ deltaX: -3, deltaMode: 1 }), 800), -48);
	assert.equal(horizontalWheelDelta(wheel({ deltaY: 1, deltaMode: 2 }), 800), 800);
});

test('zoom, zero and non-cancelable gestures remain native', () => {
	const { element, stop } = scroller();
	for (const event of [wheel({ deltaY: 100, ctrlKey: true }), wheel({ deltaX: 100, metaKey: true }), wheel(), new Event('wheel')]) {
		assert.equal(element.dispatchEvent(event), true);
		assert.equal(event.defaultPrevented, false);
	}
	assert.equal(element.scrollLeft, 400);
	stop();
});

test('disabled controls and removed listeners neither consume gestures nor move photos', () => {
	const disabled = scroller(false);
	assert.equal(disabled.element.dispatchEvent(wheel({ deltaY: 100 })), true);
	assert.equal(disabled.element.scrollLeft, 400);
	disabled.stop();
	const active = scroller();
	active.stop();
	assert.equal(active.element.dispatchEvent(wheel({ deltaX: 100 })), true);
	assert.equal(active.element.scrollLeft, 400);
});

test('infinite damping stays in the image cycle in either direction and across repeated loops', () => {
	for (const [offset, expected] of [[-0.8, 0.2], [1.2, 0.2], [-3.25, 0.75], [7.75, 0.75], [1, 0], [0, 0]]) {
		const phase = wrapScrollOffset(offset);
		assert.ok(phase >= 0 && phase < 1);
		assert.ok(Math.abs(phase - expected) < 1e-12);
	}
	const before = wrapScrollOffset(0.27);
	assert.ok(Math.abs(before - wrapScrollOffset(0.27 - 1)) < 1e-12);
	assert.ok(Math.abs(before - wrapScrollOffset(0.27 + 1)) < 1e-12);
});
