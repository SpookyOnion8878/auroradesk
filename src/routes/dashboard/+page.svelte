<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import KpiCard from '$lib/components/KpiCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Chart from '$lib/components/charts/Chart.svelte';
	import OrderFormDialog from '$lib/components/OrderFormDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { DollarSign, ShoppingCart, Users, Crown, Plus, RefreshCw } from '@lucide/svelte';
	import { store, refreshData } from '$lib/stores/data.svelte';
	import { resolve } from '$app/paths';
	import { formatCurrency, formatNumber } from '$lib/domain/money';
	import { formatDate } from '$lib/domain/dates';
	import { nextStatuses } from '$lib/domain/order-status';
	import { kpis, statusDistribution, topClientsByOrders, growthMetrics } from '$lib/domain/stats';
	import { buildStatusDonutOption, buildTopClientsBarOption } from '$lib/chart-options';
	import { api, ApiError } from '$lib/api';
	import { toast } from 'svelte-sonner';

	const k = $derived(kpis(store.clients, store.orders));
	const g = $derived(growthMetrics(store.clients, store.orders));
	const topClients = $derived(topClientsByOrders(store.clients, store.orders, 5));

	const donutOption = $derived(buildStatusDonutOption(statusDistribution(store.orders)));
	const barOption = $derived(buildTopClientsBarOption(topClients));

	const recentOrders = $derived(
		[...store.orders].sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1)).slice(0, 5)
	);

	let orderDialogOpen = $state(false);

	async function advance(order: import('$lib/domain/types').Order) {
		const target = nextStatuses(order.status)[0];
		if (!target) return;
		try {
			await api.orders.setStatus(order.id, target);
			await refreshData();
			toast.success(`${order.orderId} → ${target}`);
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Failed to update status');
		}
	}
</script>

<PageHeader title="Dashboard" description="Overview of your store performance right now.">
	{#snippet actions()}
		<Button onclick={() => (orderDialogOpen = true)} class="btn-gradient"
			><Plus class="size-4" /> New Order</Button
		>
	{/snippet}
</PageHeader>

{#if store.orders.length === 0 && store.clients.length === 0}
	<EmptyState
		title="No data yet"
		description="Add your first client and order to see the dashboard light up."
	>
		{#snippet action()}
			<Button onclick={() => (orderDialogOpen = true)}
				><Plus class="size-4" /> Create your first order</Button
			>
		{/snippet}
	</EmptyState>
{:else}
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		<KpiCard
			label="Total revenue"
			value={formatCurrency(k.totalRevenueCents)}
			hint={`${formatNumber(k.totalOrders)} orders`}
			tone="emerald"
			delay={0}
		>
			{#snippet icon()}<DollarSign class="size-4" />{/snippet}
		</KpiCard>
		<KpiCard
			label="Active orders"
			value={formatNumber(k.totalOrders - k.deliveredOrders - k.cancelledOrders)}
			hint={`${formatNumber(k.deliveredOrders)} delivered`}
			tone="blue"
			delay={80}
		>
			{#snippet icon()}<ShoppingCart class="size-4" />{/snippet}
		</KpiCard>
		<KpiCard
			label="Total clients"
			value={formatNumber(k.totalClients)}
			hint={`${formatNumber(k.vipClients)} VIP`}
			tone="purple"
			delay={160}
		>
			{#snippet icon()}<Users class="size-4" />{/snippet}
		</KpiCard>
		<KpiCard
			label="Conversion rate"
			value={`${g.completionRatePercent}%`}
			hint="orders converted to delivered"
			tone="amber"
			delay={240}
		>
			{#snippet icon()}<Crown class="size-4" />{/snippet}
		</KpiCard>
	</div>

	<div class="mt-4 grid gap-4 lg:grid-cols-3">
		<div
			class="glass card-hover animate-in rounded-2xl border border-border p-4 delay-100 duration-300 fade-in slide-in-from-bottom-3 lg:col-span-2"
		>
			<h2 class="mb-3 text-sm font-semibold">Top clients by orders</h2>
			{#if topClients.length === 0}
				<p class="py-10 text-center text-sm text-muted-foreground">No orders to chart yet.</p>
			{:else}
				<Chart option={barOption} height="280px" />
			{/if}
		</div>

		<div
			class="glass card-hover animate-in rounded-2xl border border-border p-4 delay-150 duration-300 fade-in slide-in-from-bottom-3"
		>
			<h2 class="mb-3 text-sm font-semibold">Orders by status</h2>
			{#if store.orders.length === 0}
				<p class="py-10 text-center text-sm text-muted-foreground">No orders yet.</p>
			{:else}
				<Chart option={donutOption} height="280px" />
			{/if}
		</div>
	</div>

	<div class="mt-4 grid gap-4 lg:grid-cols-2">
		<div
			class="glass card-hover animate-in overflow-hidden rounded-2xl border border-border delay-200 duration-300 fade-in slide-in-from-bottom-3"
		>
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 class="text-sm font-semibold">Recent orders</h2>
				<a href={resolve('/orders')} class="text-gradient text-xs font-medium hover:underline"
					>View all</a
				>
			</div>
			{#if recentOrders.length === 0}
				<p class="px-4 py-10 text-center text-sm text-muted-foreground">No orders yet.</p>
			{:else}
				<ul class="divide-y divide-border">
					{#each recentOrders as order (order.id)}
						<li
							class="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-brand/5"
						>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{order.title}</p>
								<p class="text-xs text-muted-foreground">
									{order.orderId} · {formatDate(order.orderDate)}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<span class="text-sm font-semibold">{formatCurrency(order.amountCents)}</span>
								<StatusBadge status={order.status} />
								{#if nextStatuses(order.status).length > 0}
									<Button
										variant="ghost"
										size="sm"
										title={`Advance to ${nextStatuses(order.status)[0]}`}
										onclick={() => advance(order)}
										class="hover:bg-brand/15 hover:text-foreground"
									>
										<RefreshCw class="size-3.5" />
									</Button>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div
			class="glass card-hover animate-in overflow-hidden rounded-2xl border border-border delay-200 duration-300 fade-in slide-in-from-bottom-3"
		>
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 class="text-sm font-semibold">Top clients</h2>
				<a href={resolve('/clients')} class="text-gradient text-xs font-medium hover:underline"
					>View all</a
				>
			</div>
			{#if topClients.length === 0}
				<p class="px-4 py-10 text-center text-sm text-muted-foreground">No clients yet.</p>
			{:else}
				<ul class="divide-y divide-border">
					{#each topClients as { client, orderCount } (client.id)}
						<li
							class="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-brand/5"
						>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{client.name}</p>
								<p class="text-xs text-muted-foreground">{client.company || '—'}</p>
							</div>
							<div class="flex shrink-0 items-center gap-2">
								<span class="text-sm text-muted-foreground">
									{formatNumber(orderCount)} order{orderCount === 1 ? '' : 's'}
								</span>
								<StatusBadge status={client.status} kind="client" />
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{/if}

<OrderFormDialog bind:open={orderDialogOpen} clients={store.clients} onSaved={refreshData} />
