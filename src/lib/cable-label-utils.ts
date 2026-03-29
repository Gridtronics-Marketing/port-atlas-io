/**
 * Formats cable names from type_specific_data into a compact label.
 * Sequential numeric runs are collapsed: 1,2,3,4 → "1-4", 1,2,5,6 → "1-2, 5-6"
 */

export function formatCableLabel(
  typeSpecificData: Record<string, any> | null | undefined,
  fallbackLabel?: string
): string | null {
  if (!typeSpecificData?.cable_names) return fallbackLabel ?? null;

  const cableNames: Record<string, string> = typeSpecificData.cable_names;
  const values = Object.values(cableNames).filter(Boolean);

  if (values.length === 0) return fallbackLabel ?? null;

  // Try to parse all as numbers for run-collapsing
  const nums = values.map(v => Number(v));
  const allNumeric = nums.every(n => !isNaN(n) && isFinite(n));

  if (allNumeric && nums.length > 0) {
    return collapseRuns(nums.sort((a, b) => a - b));
  }

  // Non-numeric: just comma-separate
  return values.join(', ');
}

function collapseRuns(sorted: number[]): string {
  if (sorted.length === 0) return '';
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
}
