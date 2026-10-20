// Swiper 8's root exports map omits its existing declaration file. Reuse its
// public types for the modules this app imports under Next 16's bundler resolver.
// Runtime imports and the installed carousel version remain unchanged.
declare module 'swiper' {
	import type { SwiperModule } from 'swiper/types';
	export { Swiper, SwiperOptions } from 'swiper/types';
	export const A11y: SwiperModule;
	export const Autoplay: SwiperModule;
	export const Mousewheel: SwiperModule;
	export const Pagination: SwiperModule;
}
