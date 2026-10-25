export const SYMBOLS = [
  { id: 'cherry', face: '🍒', name: 'Cherries', multiplier: 4 },
  { id: 'lemon', face: '🍋', name: 'Lemons', multiplier: 6 },
  { id: 'grape', face: '🍇', name: 'Grapes', multiplier: 8 },
  { id: 'bell', face: '🔔', name: 'Bells', multiplier: 12 },
  { id: 'diamond', face: '💎', name: 'Diamonds', multiplier: 20 },
  { id: 'seven', face: '7', name: 'Sevens', multiplier: 40 },
];
export const BETS = [1, 5, 10, 25, 50];
export function randomIndex() {
  const values = new Uint32Array(1);
  const limit = 4294967296 - (4294967296 % SYMBOLS.length);
  do { globalThis.crypto.getRandomValues(values); } while (values[0] >= limit);
  return values[0] % SYMBOLS.length;
}
export function payout(reels, bet) {
  if (reels.length !== 3 || !reels.every(r => Number.isInteger(r) && r >= 0 && r < SYMBOLS.length) || !BETS.includes(bet)) throw new Error('Invalid spin');
  const [a, b, c] = reels;
  const multiplier = a === b && b === c ? SYMBOLS[a].multiplier : a === b || b === c || a === c ? 1 : 0;
  return { multiplier, award: bet * multiplier };
}
export function spin(balance, bet, pick = randomIndex) {
  if (!Number.isSafeInteger(balance) || balance < bet || !BETS.includes(bet)) throw new Error('Not enough credits or invalid bet');
  const reels = Array.from({ length: 3 }, () => pick());
  return { reels, ...payout(reels, bet), balance: balance - bet + payout(reels, bet).award };
}
