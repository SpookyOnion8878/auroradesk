<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ClientFormDialog from '$lib/components/ClientFormDialog.svelte';
	import ClientDrawer from '$lib/components/ClientDrawer.svelte';
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
	import { Plus, Search, Pencil, Trash2, Eye, Download } from '@lucide/svelte';
	import { store, refreshData } from '$lib/stores/data.svelte';
	import { api, ApiError } from '$lib/api';
	import { cn } from '$lib/utils';
	import { downloadCsv, timestampedFilename, toCsv } from '$lib/csv';
	import { formatDate } from '$lib/domain/dates';
	import type { Client, ClientStatus } from '$lib/domain/types';
	import { toast } from 'svelte-sonner';

	const statusFilters: { key: 'all' | ClientStatus; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'active', label: 'Active' },
		{ key: 'inactive', label: 'Inactive' },
		{ key: 'vip', label: 'VIP' }
	];

	let search = $state('');
	let statusFilter = $state<'all' | ClientStatus>('all');
	let sortKey = $state<'name' | 'createdAt'>('name');
	let sortDir = $state<'asc' | 'desc'>('asc');

	let dialogOpen = $state(false);
	let editingClient = $state<Client | null>(null);
	let viewingClient = $state<Client | null>(null);
	let deletingClient = $state<Client | null>(null);
	let deleteOpen = $state(false);
	let deletingBusy = $state(false);

	const orderCountByClient = $derived(() => {
		const map: Record<string, number> = {};
		for (const o of store.orders) map[o.clientId] = (map[o.clientId] ?? 0) + 1;
		return map;
	});

	const filtered = $derived(
		store.clients
			.filter((c) => statusFilter === 'all' || c.status === statusFilter)
			.filter((c) => {
				const q = search.trim().toLowerCase();
				if (!q) return true;
				return (
					c.name.toLowerCase().includes(q) ||
					c.email.toLowerCase().includes(q) ||
					c.company.toLowerCase().includes(q) ||
					c.phone.toLowerCase().includes(q)
				);
			})
			.sort((a, b) => {
				const dir = sortDir === 'asc' ? 1 : -1;
				if (sortKey === 'createdAt') return a.createdAt.localeCompare(b.createdAt) * dir;
				return a.name.localeCompare(b.name) * dir;
			})
	);

	function toggleSort(key: 'name' | 'createdAt') {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	function openAdd() {
		editingClient = null;
		dialogOpen = true;
	}

	function openEdit(client: Client) {
		editingClient = client;
		dialogOpen = true;
	}

	async function confirmDelete() {
		if (!deletingClient) return;
		deletingBusy = true;
		try {
			await api.clients.remove(deletingClient.id);
			await refreshData();
			toast.success(`${deletingClient.name} deleted`);
			deletingClient = null;
			deleteOpen = false;
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Failed to delete client');
		} finally {
			deletingBusy = false;
		}
	}

	function exportCsv() {
		const rows = filtered.map((c) => [
			c.name,
			c.email,
			c.phone,
			c.company,
			c.status,
			orderCountByClient()[c.id] ?? 0
		]);
		downloadCsv(
			timestampedFilename('clients'),
			toCsv(['Name', 'Email', 'Phone', 'Company', 'Status', 'Order count'], rows)
		);
		toast.success(`Exported ${rows.length} clients`);
	}
</script>

<PageHeader title="Clients" description="Manage your customers and their details.">
	{#snippet actions()}
		<Button variant="outline" onclick={exportCsv} disabled={filtered.length === 0}>
			<Download class="size-4" /> Export CSV
		</Button>
		<Button onclick={openAdd} class="btn-gradient"><Plus class="size-4" /> Add Client</Button>
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
	<div class="relative w-full sm:max-w-xs">
		<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			placeholder="Search clients…"
			class="pl-9"
			bind:value={search}
			aria-label="Search clients"
		/>
	</div>
	<div class="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
		{#each statusFilters as f (f.key)}
			<button
				type="button"
				onclick={() => (statusFilter = f.key)}
				class={cn(
					'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
					statusFilter === f.key
						? 'bg-card text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				)}
			>
				{f.label}
			</button>
		{/each}
	</div>
	<p class="text-xs text-muted-foreground sm:ml-auto">
		{filtered.length} of {store.clients.length} client{store.clients.length === 1 ? '' : 's'}
	</p>
</div>

{#if filtered.length === 0}
	<EmptyState
		title={store.clients.length === 0 ? 'No clients yet' : 'No clients match your filters'}
		description={store.clients.length === 0
			? 'Add your first client to start tracking orders.'
			: 'Try a different search term or status filter.'}
	>
		{#snippet action()}
			{#if store.clients.length === 0}
				<Button onclick={openAdd}><Plus class="size-4" /> Add Client</Button>
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
						<TableHead>
							<button
								type="button"
								class="flex items-center gap-1"
								onclick={() => toggleSort('name')}
							>
								Name
								{#if sortKey === 'name'}
									<span class="text-muted-foreground">{sortDir === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</TableHead>
						<TableHead class="hidden md:table-cell">Contact</TableHead>
						<TableHead class="hidden sm:table-cell">Status</TableHead>
						<TableHead class="text-right">Orders</TableHead>
						<TableHead>
							<button
								type="button"
								class="flex items-center gap-1"
								onclick={() => toggleSort('createdAt')}
							>
								Created
								{#if sortKey === 'createdAt'}
									<span class="text-muted-foreground">{sortDir === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</button>
						</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each filtered as client (client.id)}
						<TableRow class="transition-colors hover:bg-brand/5">
							<TableCell>
								<div class="min-w-0">
									<p class="truncate font-medium">{client.name}</p>
									<p class="truncate text-xs text-muted-foreground sm:hidden">
										{client.email || '—'}
									</p>
								</div>
							</TableCell>
							<TableCell class="hidden md:table-cell">
								<p class="truncate text-sm">{client.email || '—'}</p>
								<p class="truncate text-xs text-muted-foreground">{client.phone || '—'}</p>
							</TableCell>
							<TableCell class="hidden sm:table-cell">
								<StatusBadge status={client.status} kind="client" />
							</TableCell>
							<TableCell class="text-right font-medium">
								{orderCountByClient()[client.id] ?? 0}
							</TableCell>
							<TableCell class="text-sm whitespace-nowrap text-muted-foreground">
								{formatDate(client.createdAt.slice(0, 10))}
							</TableCell>
							<TableCell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<Button
										variant="ghost"
										size="icon"
										title="View details"
										onclick={() => (viewingClient = client)}
									>
										<Eye class="size-4" />
									</Button>
									<Button variant="ghost" size="icon" title="Edit" onclick={() => openEdit(client)}>
										<Pencil class="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										title="Delete"
										class="text-destructive hover:text-destructive"
										onclick={() => {
											deletingClient = client;
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

<ClientFormDialog
	bind:open={dialogOpen}
	client={editingClient}
	onSaved={() => {
		void refreshData();
	}}
/>

<ClientDrawer
	bind:client={viewingClient}
	orders={store.orders}
	onEdit={(client) => {
		viewingClient = null;
		openEdit(client);
	}}
/>

<ConfirmDialog
	bind:open={deleteOpen}
	busy={deletingBusy}
	onConfirm={confirmDelete}
	title={deletingClient ? `Delete ${deletingClient.name}?` : 'Delete client?'}
	description="This permanently removes the client. Clients with orders cannot be deleted."
	confirmLabel="Delete"
/>
