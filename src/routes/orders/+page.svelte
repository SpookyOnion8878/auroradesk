<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import OrderFormDialog from '$lib/components/OrderFormDialog.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Plus, Search, Pencil, Trash2, Download } from '@lucide/svelte';
	import { store, refreshData } from '$lib/stores/data.svelte';
	import { api, ApiError } from '$lib/api';
	import { cn } from '$lib/utils';
	import { downloadCsv, timestampedFilename, toCsv } from '$lib/csv';
	import { formatCurrency } from '$lib/domain/money';
	import { formatDate } from '$lib/domain/dates';
	import { nextStatuses, ORDER_STATUS_META } from '$lib/domain/order-status';
	import type { Order, OrderStatus } from '$lib/domain/types';
	import { toast } from 'svelte-sonner';

	const statusFilters: { key: 'all' | OrderStatus; label: string }[] = [
		{ key: 'all', label: 'All' },
		...Object.entries(ORDER_STATUS_META).map(([key, meta]) => ({
			key: key as OrderStatus,
			label: meta.label
		}))
	];

	let search = $state('');
	let statusFilter = $state<'all' | OrderStatus>('all');
	let sortKey = $state<'orderDate' | 'amountCents'>('orderDate');
	let sortDir = $state<'asc' | 'desc'>('desc');

	let dialogOpen = $state(false);
	let editingOrder = $state<Order | null>(null);
	let deletingOrder = $state<Order | null>(null);
	let deleteOpen = $state(false);
	let deletingBusy = $state(false);
	let busyOrderId = $state<string | null>(null);

	const clientName = $derived(
		(id: string) => store.clients.find((c) => c.id === id)?.name ?? 'Unknown'
	);

	const filtered = $derived(
		store.orders
			.filter((o) => statusFilter === 'all' || o.status === statusFilter)
			.filter((o) => {
				const q = search.trim().toLowerCase();
				if (!q) return true;
				return (
					o.orderId.toLowerCase().includes(q) ||
					o.title.toLowerCase().includes(q) ||
					clientName(o.clientId).toLowerCase().includes(q)
				);
			})
			.sort((a, b) => {
				const dir = sortDir === 'asc' ? 1 : -1;
				return (a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0) * dir;
			})
	);

	const totalShownCents = $derived(filtered.reduce((sum, o) => sum + o.amountCents, 0));

	function toggleSort(key: 'orderDate' | 'amountCents') {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'desc';
		}
	}

	function openAdd() {
		editingOrder = null;
		dialogOpen = true;
	}

	function openEdit(order: Order) {
		editingOrder = order;
		dialogOpen = true;
	}

	async function confirmDelete() {
		if (!deletingOrder) return;
		deletingBusy = true;
		try {
			await api.orders.remove(deletingOrder.id);
			await refreshData();
			toast.success(`${deletingOrder.orderId} deleted`);
			deletingOrder = null;
			deleteOpen = false;
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Failed to delete order');
		} finally {
			deletingBusy = false;
		}
	}

	async function advance(order: Order, target: OrderStatus) {
		busyOrderId = order.id;
		try {
			await api.orders.setStatus(order.id, target);
			await refreshData();
			toast.success(`${order.orderId} → ${target}`);
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Failed to update status');
		} finally {
			busyOrderId = null;
		}
	}

	function exportCsv() {
		const rows = filtered.map((o) => [
			o.orderId,
			o.title,
			clientName(o.clientId),
			formatCurrency(o.amountCents),
			o.status,
			o.orderDate
		]);
		downloadCsv(
			timestampedFilename('orders'),
			toCsv(['Order ID', 'Title', 'Client', 'Amount', 'Status', 'Date'], rows)
		);
		toast.success(`Exported ${rows.length} orders`);
	}
</script>

<PageHeader title="Orders" description="Track every order from creation to delivery.">
	{#snippet actions()}
		<Button variant="outline" onclick={exportCsv} disabled={filtered.length === 0}>
			<Download class="size-4" /> Export CSV
		</Button>
		<Button onclick={openAdd} class="btn-gradient"><Plus class="size-4" /> Add Order</Button>
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
	<div class="relative w-full sm:max-w-xs">
		<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			placeholder="Search orders…"
			class="pl-9"
			bind:value={search}
			aria-label="Search orders"
		/>
	</div>
	<div
		class="scrollbar-hide flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1"
	>
		{#each statusFilters as f (f.key)}
			<button
				type="button"
				onclick={() => (statusFilter = f.key)}
				class={cn(
					'rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200',
					statusFilter === f.key
						? 'bg-gradient-to-r from-brand/25 to-accent/20 text-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--brand)_35%,transparent)]'
						: 'text-muted-foreground hover:text-foreground'
				)}
			>
				{f.label}
			</button>
		{/each}
	</div>
	<p class="text-xs text-muted-foreground sm:ml-auto">
		{filtered.length} of {store.orders.length} orders · {formatCurrency(totalShownCents)}
	</p>
</div>

{#if filtered.length === 0}
	<EmptyState
		title={store.orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
		description={store.orders.length === 0
			? 'Create your first order to start tracking.'
			: 'Try a different search term or status filter.'}
	>
		{#snippet action()}
			{#if store.orders.length === 0}
				<Button onclick={openAdd}><Plus class="size-4" /> Add Order</Button>
			{/if}
		{/snippet}
	</EmptyState>
{:else}
	<div
		class="glass animate-in overflow-hidden rounded-2xl border border-border duration-300 fade-in slide-in-from-bottom-3"
	>
		<div class="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow class="hover:bg-transparent">
						<TableHead>Order</TableHead>
						<TableHead class="hidden md:table-cell">Client</TableHead>
						<TableHead>
							<button
								type="button"
								class="flex items-center gap-1"
								onclick={() => toggleSort('amountCents')}
							>
								Amount
								{#if sortKey === 'amountCents'}
									<span class="text-muted-foreground">{sortDir === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</TableHead>
						<TableHead class="hidden sm:table-cell">Status</TableHead>
						<TableHead>
							<button
								type="button"
								class="flex items-center gap-1"
								onclick={() => toggleSort('orderDate')}
							>
								Date
								{#if sortKey === 'orderDate'}
									<span class="text-muted-foreground">{sortDir === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each filtered as order (order.id)}
						<TableRow class="transition-colors hover:bg-brand/5">
							<TableCell>
								<div class="min-w-0">
									<p class="truncate font-medium">{order.title}</p>
									<p class="text-xs text-muted-foreground">{order.orderId}</p>
								</div>
							</TableCell>
							<TableCell class="hidden md:table-cell">
								<span class="text-sm">{clientName(order.clientId)}</span>
							</TableCell>
							<TableCell class="font-medium whitespace-nowrap">
								{formatCurrency(order.amountCents)}
							</TableCell>
							<TableCell class="hidden sm:table-cell">
								<StatusBadge status={order.status} />
							</TableCell>
							<TableCell class="text-sm whitespace-nowrap text-muted-foreground">
								{formatDate(order.orderDate)}
							</TableCell>
							<TableCell class="text-right">
								<div class="flex items-center justify-end gap-1">
									{#if nextStatuses(order.status).length > 0}
										<select
											class="h-8 max-w-28 cursor-pointer rounded-md border border-border bg-muted/40 px-2 text-xs text-muted-foreground focus-visible:outline-none disabled:opacity-50"
											value=""
											disabled={busyOrderId === order.id}
											title="Advance status"
											onchange={(e) => {
												const target = e.currentTarget.value as OrderStatus;
												e.currentTarget.value = '';
												void advance(order, target);
											}}
										>
											<option value="" disabled>Advance…</option>
											{#each nextStatuses(order.status) as s (s)}
												<option value={s}>{ORDER_STATUS_META[s].label}</option>
											{/each}
										</select>
									{/if}
									<Button variant="ghost" size="icon" title="Edit" onclick={() => openEdit(order)}>
										<Pencil class="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										title="Delete"
										class="text-destructive hover:text-destructive"
										onclick={() => {
											deletingOrder = order;
											deleteOpen = true;
										}}
									>
										<Trash2 class="size-4" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	</div>
{/if}

<OrderFormDialog
	bind:open={dialogOpen}
	order={editingOrder}
	clients={store.clients}
	onSaved={() => {
		void refreshData();
	}}
/>

<ConfirmDialog
	bind:open={deleteOpen}
	busy={deletingBusy}
	onConfirm={confirmDelete}
	title={deletingOrder ? `Delete ${deletingOrder.orderId}?` : 'Delete order?'}
	description="This permanently removes the order and its status history."
	confirmLabel="Delete"
/>
