export const money = (n: number, currency = 'ARS') =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);

export const pct = (n: number) => `${n.toFixed(1)}%`;

export const todayKey = (d = new Date()) => {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

export function searchTokens(...fields: string[]): string[] {
  const set = new Set<string>();
  for (const f of fields) {
    for (const word of (f || '').toLowerCase().split(/\s+/)) {
      if (!word) continue;
      for (let i = 2; i <= Math.min(word.length, 12); i++) set.add(word.slice(0, i));
      set.add(word);
    }
  }
  return [...set].slice(0, 80);
}
