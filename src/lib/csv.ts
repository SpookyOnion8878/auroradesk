export function toCsv(headers: string[], rows: (string | number)[][]): string {
	const escape = (value: string | number): string => {
		const text = String(value);
		if (/[",\n\r]/.test(text)) {
			return `"${text.replace(/"/g, '""')}"`;
		}
		return text;
	};
	const lines = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))];
	return lines.join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

export function timestampedFilename(base: string): string {
	const now = new Date();
	const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
		now.getDate()
	).padStart(2, '0')}`;
	return `${base}-${stamp}.csv`;
}
