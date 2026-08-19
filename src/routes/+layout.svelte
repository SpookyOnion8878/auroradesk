<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { store, refreshData } from '$lib/stores/data.svelte';
	import { cn } from '$lib/utils';
	import { RefreshCw, WifiOff, LayoutDashboard, BarChart3, Users, Package } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let { children } = $props();

	const nav = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/analytics', label: 'Analytics', icon: BarChart3 },
		{ href: '/clients', label: 'Clients', icon: Users },
		{ href: '/orders', label: 'Orders', icon: Package }
	] as const;

	let retrying = $state(false);
	let refreshing = $state(false);

	onMount(() => {
		void refreshData();
	});

	function active(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	async function retryLoad() {
		retrying = true;
		await refreshData();
		retrying = false;
	}

	async function refresh() {
		refreshing = true;
		await refreshData();
		refreshing = false;
		toast.success('Data refreshed');
	}
</script>

<svelte:head><title>AuroraDesk</title></svelte:head>

<div class="aurora flex min-h-dvh flex-col bg-background text-foreground">
	<header class="glass sticky top-0 z-40 border-b border-border/60">
		<div class="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
			<a
				href={resolve('/dashboard')}
				class="group flex items-center gap-2 font-semibold tracking-tight"
			>
				<span
					class="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-white shadow-lg shadow-brand/40 transition-transform duration-300 group-hover:scale-105"
				>
					<Package class="size-4" />
				</span>
				<span class="hidden text-base font-semibold sm:inline"
					>Aurora<span class="text-gradient">Desk</span></span
				>
			</a>

			<nav class="ml-2 hidden items-center gap-1 sm:ml-6 sm:flex">
				{#each nav as item (item.href)}
					<a
						href={resolve(item.href)}
						class={cn(
							'relative rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 hover:scale-[1.03] active:scale-95',
							active(item.href)
								? 'bg-gradient-to-r from-brand/20 to-accent/15 text-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--brand)_35%,transparent)]'
								: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
						)}
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="ml-auto flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					onclick={refresh}
					disabled={refreshing}
					title="Refresh data"
					class="hover:bg-brand/15 hover:text-foreground"
				>
					<RefreshCw class={cn('size-4', refreshing && 'animate-spin')} />
				</Button>
				<ThemeToggle />
			</div>
		</div>
		<div
			class="h-px w-full bg-gradient-to-r from-transparent via-brand/70 to-transparent opacity-70"
		></div>
	</header>

	{#if store.loading && store.clients.length === 0 && store.orders.length === 0}
		<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:pb-6">
			<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{#each Array.from({ length: 4 }, (_, i) => i) as i (i)}
					<Skeleton class="h-28 rounded-2xl" />
				{/each}
			</div>
			<div class="mt-4 grid gap-4 lg:grid-cols-3">
				<Skeleton class="h-72 rounded-2xl lg:col-span-2" />
				<Skeleton class="h-72 rounded-2xl" />
			</div>
		</main>
	{:else if store.loadError}
		<main
			class="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-6 pb-24 sm:pb-6"
		>
			<div
				class="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center"
			>
				<div
					class="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
				>
					<WifiOff class="size-5" />
				</div>
				<h2 class="text-lg font-semibold">Could not load data</h2>
				<p class="text-sm text-muted-foreground">{store.loadError}</p>
				<Button onclick={retryLoad} disabled={retrying} class="mt-2">
					{retrying ? 'Retrying…' : 'Retry'}
				</Button>
			</div>
		</main>
	{:else}
		<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:pb-6">
			{#key page.url.pathname}
				<div class="animate-in duration-300 fade-in slide-in-from-bottom-1">
					<svelte:boundary>
						{@render children()}
						{#snippet failed(_error, reset)}
							<div
								class="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center"
							>
								<h2 class="text-lg font-semibold">Something went wrong</h2>
								<p class="text-sm text-muted-foreground">
									An unexpected error occurred while rendering this page.
								</p>
								<Button onclick={reset}>Try again</Button>
							</div>
						{/snippet}
					</svelte:boundary>
				</div>
			{/key}
		</main>
	{/if}

	<!-- Mobile bottom navigation -->
	<nav
		class="glass fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border/60 px-2 pb-[env(safe-area-inset-bottom)] sm:hidden"
	>
		{#each nav as item (item.href)}
			{@const Icon = item.icon}
			<a
				href={resolve(item.href)}
				class={cn(
					'flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium transition-all duration-200 active:scale-90',
					active(item.href) ? 'text-gradient' : 'text-muted-foreground hover:text-foreground'
				)}
			>
				<Icon class="size-5" />
				{item.label}
			</a>
		{/each}
	</nav>

	<footer class="hidden border-t border-border py-4 sm:block">
		<p class="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
			AuroraDesk — local-first order tracking. Data stays on this machine.
		</p>
	</footer>
</div>

<Toaster richColors closeButton position="top-right" />
