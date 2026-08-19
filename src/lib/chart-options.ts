import { ORDER_STATUS_META, CLIENT_STATUS_META } from '$lib/domain/order-status';
import type { Client, OrderStatus } from '$lib/domain/types';
import type { ClientPerformance, RevenuePoint, StatusSlice } from '$lib/domain/stats';
import { formatCurrency } from '$lib/domain/money';

const TEXT = '#a1a1aa';
const GRID = 'rgba(255,255,255,0.06)';

export function buildStatusDonutOption(distribution: StatusSlice[]): Record<string, unknown> {
	return {
		animationDuration: 900,
		animationEasing: 'cubicOut',
		color: distribution.map((d) => d.color),
		tooltip: {
			trigger: 'item',
			backgroundColor: 'rgba(24,24,27,0.95)',
			borderColor: 'rgba(255,255,255,0.1)',
			textStyle: { color: '#fafafa' },
			formatter: '{b}: {c} orders ({d}%)'
		},
		legend: {
			bottom: 0,
			textStyle: { color: TEXT, fontSize: 11 }
		},
		series: [
			{
				name: 'Status',
				type: 'pie',
				radius: ['52%', '78%'],
				center: ['50%', '44%'],
				itemStyle: {
					borderColor: 'transparent',
					borderWidth: 0,
					shadowBlur: 14,
					shadowColor: 'rgba(124,58,237,0.35)'
				},
				label: { show: false },
				emphasis: { label: { show: false }, scaleSize: 6 },
				data: distribution.map((d) => ({
					name: ORDER_STATUS_META[d.status as OrderStatus]?.label ?? d.status,
					value: d.count
				}))
			}
		]
	};
}

export function buildTopClientsBarOption(topClients: ClientPerformance[]): Record<string, unknown> {
	return {
		animationDuration: 900,
		animationEasing: 'cubicOut',
		tooltip: {
			trigger: 'axis',
			backgroundColor: 'rgba(24,24,27,0.95)',
			borderColor: 'rgba(255,255,255,0.1)',
			textStyle: { color: '#fafafa' }
		},
		grid: { left: 8, right: 16, top: 8, bottom: 0, containLabel: true },
		xAxis: {
			type: 'category',
			data: topClients.map((t) => t.client.name),
			axisLabel: { color: TEXT, fontSize: 11, interval: 0, rotate: topClients.length > 4 ? 24 : 0 },
			axisLine: { lineStyle: { color: GRID } },
			axisTick: { show: false }
		},
		yAxis: {
			type: 'value',
			minInterval: 1,
			axisLabel: { color: TEXT, fontSize: 11 },
			splitLine: { lineStyle: { color: GRID } }
		},
		series: [
			{
				name: 'Orders',
				type: 'bar',
				data: topClients.map((t) => t.orderCount),
				barMaxWidth: 36,
				itemStyle: {
					borderRadius: [6, 6, 0, 0],
					shadowBlur: 12,
					shadowColor: 'rgba(212,175,55,0.4)',
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: '#f4e3a3' },
							{ offset: 1, color: '#b8860b' }
						]
					}
				}
			}
		]
	};
}

export function buildRevenueTimelineOption(timeline: RevenuePoint[]): Record<string, unknown> {
	return {
		animationDuration: 1000,
		animationEasing: 'cubicOut',
		tooltip: {
			trigger: 'axis',
			backgroundColor: 'rgba(24,24,27,0.95)',
			borderColor: 'rgba(255,255,255,0.1)',
			textStyle: { color: '#fafafa' },
			valueFormatter: (v: number) => formatCurrency(v)
		},
		grid: { left: 8, right: 16, top: 16, bottom: 0, containLabel: true },
		xAxis: {
			type: 'category',
			boundaryGap: false,
			data: timeline.map((t) => t.label),
			axisLabel: { color: TEXT, fontSize: 11 },
			axisLine: { lineStyle: { color: GRID } },
			axisTick: { show: false }
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				color: TEXT,
				fontSize: 11,
				formatter: (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)
			},
			splitLine: { lineStyle: { color: GRID } }
		},
		series: [
			{
				name: 'Revenue',
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 6,
				data: timeline.map((t) => t.revenueCents),
				lineStyle: {
					color: '#d4af37',
					width: 2.5,
					shadowBlur: 14,
					shadowColor: 'rgba(212,175,55,0.6)'
				},
				itemStyle: { color: '#d4af37', borderColor: '#fff', borderWidth: 2 },
				areaStyle: {
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(212,175,55,0.38)' },
							{ offset: 1, color: 'rgba(212,175,55,0.02)' }
						]
					}
				}
			}
		]
	};
}

export function buildTopClientsRevenueOption(
	topClients: ClientPerformance[]
): Record<string, unknown> {
	return {
		animationDuration: 900,
		animationEasing: 'cubicOut',
		tooltip: {
			trigger: 'axis',
			backgroundColor: 'rgba(24,24,27,0.95)',
			borderColor: 'rgba(255,255,255,0.1)',
			textStyle: { color: '#fafafa' },
			valueFormatter: (v: number) => formatCurrency(v)
		},
		grid: { left: 8, right: 16, top: 8, bottom: 0, containLabel: true },
		xAxis: {
			type: 'category',
			data: topClients.map((t) => t.client.name),
			axisLabel: { color: TEXT, fontSize: 11, interval: 0, rotate: topClients.length > 4 ? 24 : 0 },
			axisLine: { lineStyle: { color: GRID } },
			axisTick: { show: false }
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				color: TEXT,
				fontSize: 11,
				formatter: (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)
			},
			splitLine: { lineStyle: { color: GRID } }
		},
		series: [
			{
				name: 'Revenue',
				type: 'bar',
				data: topClients.map((t) => t.revenueCents),
				barMaxWidth: 36,
				itemStyle: {
					borderRadius: [6, 6, 0, 0],
					shadowBlur: 12,
					shadowColor: 'rgba(212,175,55,0.4)',
					color: {
						type: 'linear',
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: '#f4e3a3' },
							{ offset: 1, color: '#b8860b' }
						]
					}
				}
			}
		]
	};
}

export function buildClientStatusDonutOption(clients: Client[]): Record<string, unknown> {
	const counts = new Map<string, number>();
	for (const c of clients) {
		counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
	}
	const data = [...counts.entries()].map(([status, count]) => ({
		name: CLIENT_STATUS_META[status as keyof typeof CLIENT_STATUS_META]?.label ?? status,
		value: count
	}));
	return {
		animationDuration: 900,
		animationEasing: 'cubicOut',
		color: [...counts.keys()].map(
			(s) => CLIENT_STATUS_META[s as keyof typeof CLIENT_STATUS_META]?.dot ?? '#71717a'
		),
		tooltip: {
			trigger: 'item',
			backgroundColor: 'rgba(24,24,27,0.95)',
			borderColor: 'rgba(255,255,255,0.1)',
			textStyle: { color: '#fafafa' },
			formatter: '{b}: {c} clients ({d}%)'
		},
		legend: { bottom: 0, textStyle: { color: TEXT, fontSize: 11 } },
		series: [
			{
				name: 'Clients',
				type: 'pie',
				radius: ['52%', '78%'],
				center: ['50%', '44%'],
				itemStyle: { borderColor: 'transparent', borderWidth: 0 },
				label: { show: false },
				emphasis: { label: { show: false }, scaleSize: 6 },
				data
			}
		]
	};
}
