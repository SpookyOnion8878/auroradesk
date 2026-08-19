<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Chart from '$lib/components/charts/Chart.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { cn } from '$lib/utils';
	import { store } from '$lib/stores/data.svelte';
	import {
		revenueTimeline,
		statusDistribution,
		topClientsByOrders,
		growthMetrics,
		type RevenuePeriod
	} from '$lib/domain/stats';
	import {
		buildRevenueTimelineOption,
		buildStatusDonutOption,
		buildTopClientsRevenueOption,
		buildClientStatusDonutOption
	} from '$lib/chart-options';
	import { formatCurrency } from '$lib/domain/money';

	const periods: { key: RevenuePeriod; label: string }[] = [
		{ key: '30d', label: '30 days' },
		{ key: '90d', label: '90 days' },
		{ key: '12m', label: '12 months' },
		{ key: 'all', label: 'All time' }
	];

	let period = $state<RevenuePeriod>('90d');

	const timeline = $derived(revenueTimeline(store.orders, period));
	const timelineOption = $derived(buildRevenueTimelineOption(timeline));
	const donutOption = $derived(buildStatusDonutOption(statusDistribution(store.orders)));
	const clientDonutOption = $derived(buildClientStatusDonutOption(store.clients));
	const topRevenue = $derived(topClientsByOrders(store.clients, store.orders, 8));
	const topRevenueOption = $derived(buildTopClientsRevenueOption(topRevenue));
	const metrics = $derived(growthMetrics(store.clients, store.orders));

	const periodRevenue = $derived(timeline.reduce((sum, p) => sum + p.revenueCents, 0));
	const periodOrders = $derived(timeline.reduce((sum, p) => sum + p.orderCount, 0));
</script>

<PageHeader
	title="Analytics"
	description="Revenue and client performance from your real order data."
>
	{#snippet actions()}
		<div class="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
			{#each periods as p (p.key)}
				<button
					type="button"
					onclick={() => (period = p.key)}
					class={cn(
						'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
						period === p.key
							? 'bg-gradient-to-r from-brand/25 to-accent/20 text-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--brand)_35%,transparent)]'
							: 'text-muted-foreground hover:text-foreground'
					)}
				>
					{p.label}
				</button>
			{/each}
		</div>
	{/snippet}
</PageHeader>

{#if store.orders.length === 0}
	<EmptyState
		title="No analytics yet"
		description="Once you add orders, revenue trends and client performance appear here."
	/>
{:else}
	<div class="grid gap-4 lg:grid-cols-2">
		<div
			class="glass card-hover animate-in rounded-2xl border border-border p-4 duration-300 fade-in slide-in-from-bottom-3 lg:col-span-2"
		>
			<div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
				<h2 class="text-sm font-semibold">Revenue over time</h2>
				<p class="text-sm text-muted-foreground">
					{formatCurrency(periodRevenue)} · {periodOrders} order{periodOrders === 1 ? '' : 's'} in period
				</p>
			</div>
			<Chart option={timelineOption} height="300px" />
		</div>

		<div
			class="glass card-hover animate-in rounded-2xl border border-border p-4 delay-75 duration-300 fade-in slide-in-from-bottom-3"
		>
			<h2 class="mb-3 text-sm font-semibold">Orders by status</h2>
			<Chart option={donutOption} height="260px" />
		</div>

		<div
			class="glass card-hover animate-in rounded-2xl border border-border p-4 delay-75 duration-300 fade-in slide-in-from-bottom-3"
		>
			<h2 class="mb-3 text-sm font-semibold">Clients by status</h2>
			<Chart option={clientDonutOption} height="260px" />
		</div>

		<div
			class="glass card-hover animate-in rounded-2xl border border-border p-4 delay-75 duration-300 fade-in slide-in-from-bottom-3 lg:col-span-2"
		>
			<h2 class="mb-3 text-sm font-semibold">Top clients by revenue</h2>
			<Chart option={topRevenueOption} height="280px" />
		</div>
	</div>

	<div class="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
		<div
			class="glass card-hover animate-in rounded-2xl border border-border p-4 delay-75 duration-300 fade-in slide-in-from-bottom-3"
		>
			<p class="text-xs text-muted-foreground">VIP clients</p>
			<p class="text-gradient mt-0.5 text-2xl font-bold">{metrics.vipConversionPercent}%</p>
			<p class="mt-1 text-xs text-muted-foreground">of all clients</p>
		</div>
		<div
			class="glass card-hover animate-in rounded-2xl border border-border p-4 delay-150 duration-300 fade-in slide-in-from-bottom-3"
		>
			<p class="text-xs text-muted-foreground">Completion rate</p>
			<p class="text-gradient mt-0.5 text-2xl font-bold">{metrics.completionRatePercent}%</p>
			<p class="mt-1 text-xs text-muted-foreground">orders delivered</p>
		</div>
		<div
			class="glass card-hover animate-in rounded-2xl border border-border p-4 delay-150 duration-300 fade-in slide-in-from-bottom-3"
		>
			<p class="text-xs text-muted-foreground">Avg revenue per client</p>
			<p class="mt-0.5 text-lg font-bold">{formatCurrency(metrics.avgRevenuePerClientCents)}</p>
			<p class="mt-1 text-xs text-muted-foreground">across all time</p>
		</div>
		<div
			class="glass card-hover animate-in rounded-2xl border border-border p-4 delay-75 duration-300 fade-in slide-in-from-bottom-3"
		>
			<p class="text-xs text-muted-foreground">Cancellation rate</p>
			<p class="text-gradient mt-0.5 text-2xl font-bold">{metrics.cancellationRatePercent}%</p>
			<p class="mt-1 text-xs text-muted-foreground">of all orders</p>
		</div>
	</div>
{/if}
