export type CompletionGroup = { id: string; label: string; cells: number[] };

const nine = Array.from({ length: 9 }, (_, i) => i);
export const completionGroups: CompletionGroup[] = [
  ...nine.map((r) => ({ id: `row-${r}`, label: `Row ${r + 1}`, cells: nine.map((c) => r * 9 + c) })),
  ...nine.map((c) => ({ id: `column-${c}`, label: `Column ${c + 1}`, cells: nine.map((r) => r * 9 + c) })),
  ...nine.map((b) => ({
    id: `box-${b}`, label: `Box ${b + 1}`,
    cells: nine.map((i) => (Math.floor(b / 3) * 3 + Math.floor(i / 3)) * 9 + (b % 3) * 3 + i % 3),
  })),
];

export function completedGroups(values: (number | null)[], solution: number[]): Set<string> {
  return new Set(completionGroups.filter((group) =>
    group.cells.every((index) => values[index] === solution[index]),
  ).map((group) => group.id));
}
