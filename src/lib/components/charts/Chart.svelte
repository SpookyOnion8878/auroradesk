<script lang="ts">
	import { onMount } from 'svelte';
	import type { EChartsOption, EChartsType } from 'echarts';
	import { cn } from '$lib/utils';

	let {
		option,
		height = '100%',
		class: className
	}: { option: EChartsOption | null; height?: string; class?: string } = $props();

	let el = $state<HTMLDivElement | null>(null);
	let chart = $state<EChartsType | null>(null);
	let instance: EChartsType | null = null;
	let ro: ResizeObserver | null = null;

	onMount(() => {
		let disposed = false;
		import('echarts').then((mod) => {
			if (disposed || !el) return;
			instance = mod.init(el, 'dark', { renderer: 'canvas' });
			chart = instance;
			if (option) instance.setOption(option, { notMerge: true });
			ro = new ResizeObserver(() => instance?.resize());
			ro.observe(el);
		});
		return () => {
			disposed = true;
			ro?.disconnect();
			instance?.dispose();
			instance = null;
			chart = null;
		};
	});

	$effect(() => {
		if (chart && option) {
			chart.setOption(option, { notMerge: true });
		}
	});
</script>

<div bind:this={el} class={cn('w-full', className)} style:height></div>
