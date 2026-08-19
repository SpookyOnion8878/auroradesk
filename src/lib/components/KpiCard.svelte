<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		label,
		value,
		hint,
		icon,
		tone = 'default',
		delay = 0,
		class: className
	}: {
		label: string;
		value: string;
		hint?: string;
		icon?: import('svelte').Snippet;
		tone?: 'default' | 'emerald' | 'blue' | 'amber' | 'purple';
		delay?: number;
		class?: string;
	} = $props();

	const tiles = {
		default: 'from-brand to-brand-2 shadow-brand/40',
		emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/40',
		blue: 'from-blue-500 to-cyan-500 shadow-cyan-500/40',
		amber: 'from-amber-500 to-orange-500 shadow-amber-500/40',
		purple: 'from-brand to-accent shadow-brand/40'
	} as const;

	const blobs = {
		default: 'var(--brand)',
		emerald: '#10b981',
		blue: '#22d3ee',
		amber: '#f59e0b',
		purple: 'var(--accent)'
	} as const;
</script>

<div
	class={cn(
		'group card-hover relative animate-in overflow-hidden rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur duration-500 fade-in slide-in-from-bottom-3',
		className
	)}
	style:animation-delay={`${delay}ms`}
>
	<div
		class="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
		style:background={blobs[tone]}
	></div>
	<div class="flex items-start justify-between gap-2">
		<div
			class={cn(
				'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
				tiles[tone]
			)}
		>
			{@render icon?.()}
		</div>
	</div>
	<p class="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
	<p class="font-display text-gradient mt-0.5 text-2xl font-semibold tracking-tight">{value}</p>
	{#if hint}
		<p class="mt-1 text-xs text-muted-foreground">{hint}</p>
	{/if}
</div>
