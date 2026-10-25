import { SYMBOLS, BETS, spin } from './slot-engine.js';
const $ = selector => document.querySelector(selector);
const key = 'building-beta1-v1';
const fresh = () => ({ balance: 1000, bet: 10, spins: 0, best: 0, history: [] });
let state = fresh(), busy = false;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let animateReels = !motionPreference.matches;
try {
  const preference = localStorage.getItem('building-beta1-motion');
  if (preference !== null) animateReels = preference === 'on';
} catch { /* Use the device preference when storage is unavailable. */ }
function renderMotion() {
  $('#animate-reels').checked = animateReels;
  $('#animate-reels').disabled = busy;
  $('#motion-note').textContent = animateReels ? 'Reels roll and stop one at a time.' : 'Motion off. Enable to see the reels spin.';
}
$('#animate-reels').addEventListener('change', () => {
  animateReels = $('#animate-reels').checked;
  try { localStorage.setItem('building-beta1-motion', animateReels ? 'on' : 'off'); } catch { /* Session-only preference. */ }
  renderMotion();
});
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && Number.isSafeInteger(saved.balance) && saved.balance >= 0 && saved.balance < 1e12 && BETS.includes(saved.bet) && Number.isSafeInteger(saved.spins) && saved.spins >= 0 && Number.isSafeInteger(saved.best) && saved.best >= 0 && Array.isArray(saved.history) && saved.history.length <= 5 && saved.history.every(h => Number.isSafeInteger(h.bet) && BETS.includes(h.bet) && Number.isSafeInteger(h.award) && h.award >= 0 && Array.isArray(h.reels) && h.reels.length === 3 && h.reels.every(r => Number.isInteger(r) && r >= 0 && r < 6))) state = saved;
} catch { $('#save-note').textContent = 'Browser storage is unavailable. You can still play for this session.'; }
const format = number => number.toLocaleString('en-US');
function save() {
  try { localStorage.setItem(key, JSON.stringify(state)); }
  catch { $('#save-note').textContent = 'Browser storage is unavailable. Progress will only last for this session.'; }
}
function paintReel(index, symbol) {
  const reel = document.querySelectorAll('.reel')[index];
  reel.querySelector('.symbol').textContent = SYMBOLS[symbol].face;
  reel.querySelector('.symbol').setAttribute('aria-label', SYMBOLS[symbol].name);
  const ghosts = reel.querySelectorAll('.ghost');
  ghosts[0].textContent = SYMBOLS[(symbol + 5) % 6].face;
  ghosts[1].textContent = SYMBOLS[(symbol + 1) % 6].face;
}
async function animateReel(index, target, reduced) {
  const reel = document.querySelectorAll('.reel')[index];
  if (reduced) {
    await new Promise(resolve => setTimeout(resolve, 100 + index * 60));
    paintReel(index, target);
    return;
  }
  const start = SYMBOLS.findIndex(s => s.face === reel.querySelector('.symbol').textContent);
  const current = Math.max(0, start);
  const steps = 18 + index * 6 + (target - current + SYMBOLS.length) % SYMBOLS.length;
  const cellHeight = 92;
  const offset = (reel.clientHeight - cellHeight) / 2;
  const strip = document.createElement('div');
  strip.className = 'reel-strip';
  strip.setAttribute('aria-hidden', 'true');
  // Extra cells above and below keep the window full throughout the roll.
  for (let step = -2; step <= steps + 2; step++) {
    const cell = document.createElement('span');
    cell.className = 'strip-symbol';
    cell.textContent = SYMBOLS[(current + step + SYMBOLS.length) % SYMBOLS.length].face;
    strip.append(cell);
  }
  reel.classList.add('rolling');
  reel.append(strip);
  let animation;
  const from = offset - 2 * cellHeight;
  const to = offset - (steps + 2) * cellHeight;
  const duration = 1400 + index * 400;
  try {
    if (typeof strip.animate === 'function') {
      animation = strip.animate([
        { transform: `translateY(${from}px)` },
        { transform: `translateY(${to}px)` },
      ], { duration, easing: 'cubic-bezier(.12,.55,.22,1)', fill: 'forwards' });
      await animation.finished;
    } else {
      // Older browsers can scroll the strip without the Web Animations API.
      await new Promise(resolve => {
        const started = performance.now();
        function frame(now) {
          const progress = Math.min(1, (now - started) / duration);
          const eased = 1 - (1 - progress) ** 3;
          strip.style.transform = `translateY(${from + (to - from) * eased}px)`;
          if (progress < 1) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
    }
  } catch {
    // An interrupted visual effect must not leave a settled game stuck spinning.
  } finally {
    paintReel(index, target);
    reel.classList.remove('rolling');
    strip.remove();
    animation?.cancel();
  }
}
function render() {
  $('#balance').textContent = format(state.balance);
  $('#last-win').textContent = state.history.length ? format(state.history[0].award) : '—';
  $('#spin-count').textContent = format(state.spins);
  $('#best-win').textContent = format(state.best);
  $('#bet').value = String(state.bet);
  $('#spin').disabled = busy || state.balance < state.bet;
  $('#bet').disabled = busy;
  $('#reset').disabled = busy;
  $('#history').replaceChildren();
  for (const entry of state.history) {
    const li = document.createElement('li');
    const symbols = document.createElement('span');
    symbols.className = 'history-symbols';
    symbols.textContent = entry.reels.map(r => SYMBOLS[r].face).join(' ');
    symbols.setAttribute('aria-label',entry.reels.map(r => SYMBOLS[r].name).join(', '));
    const bet = document.createElement('small');
    bet.textContent = `BET ${entry.bet} · PAYOUT ${entry.award}`;
    const net = document.createElement('b');
    const difference = entry.award - entry.bet;
    net.textContent = difference === 0 ? 'Break even' : `${difference > 0 ? '+' : ''}${difference} credits net`;
    if (difference > 0) net.className = 'positive';
    li.append(symbols, bet, net);
    $('#history').append(li);
  }
  if (!state.history.length) {
    const li = document.createElement('li');
    li.className = 'empty-history';
    li.textContent = 'A clean slate. Your latest spins will appear here.';
    $('#history').append(li);
  }
}
function balanceMessage() {
  return state.balance === 0 ? 'No credits left. Start fresh to play again.' : state.balance < state.bet ? 'Choose a smaller bet or start fresh.' : 'Ready for your next spin.';
}
$('#paytable').innerHTML = [...SYMBOLS].reverse().map(s => `<div class="pay-row"><span class="pay-icons" aria-label="Three ${s.name}">${s.face} ${s.face} ${s.face}</span><b>${s.multiplier}×</b></div>`).join('');
$('#bet').addEventListener('change', () => {
  if (busy) return;
  const bet = Number($('#bet').value);
  if (!BETS.includes(bet)) return;
  state.bet = bet;
  save(); render();
  $('#result').textContent = balanceMessage();
  $('#result').classList.remove('win');
});
$('#spin').addEventListener('click', async () => {
  if (busy || state.balance < state.bet) return;
  busy = true;
  const bet = state.bet;
  const result = spin(state.balance, bet);
  // Settle and persist before animation so refreshing cannot refund a losing spin.
  state.balance = result.balance;
  state.spins++;
  state.best = Math.max(state.best, result.award);
  state.history.unshift({reels: result.reels, bet, award: result.award});
  state.history = state.history.slice(0,5);
  save();
  $('#spin').disabled = $('#bet').disabled = $('#reset').disabled = true;
  $('#spin').firstChild.textContent = 'SPINNING ';
  $('#result').textContent = 'Reels rolling…';
  $('#result').classList.remove('win');
  $('.machine').classList.remove('winner');
  $('#reels').classList.add('spinning');
  $('#reels').setAttribute('aria-busy','true');
  renderMotion();
  try {
    await Promise.all(result.reels.map((target, index) => animateReel(index, target, !animateReels)));
  } finally {
    $('#reels').classList.remove('spinning');
    $('#reels').setAttribute('aria-busy', 'false');
    busy = false;
    renderMotion();
    render();
    $('#spin').firstChild.textContent = 'SPIN ';
  }
  if (result.multiplier > 1) {
    $('#result').textContent = `Three ${SYMBOLS[result.reels[0]].name.toLowerCase()}! ${result.award} credits paid (+${result.award - bet} net).`;
    $('#result').classList.add('win');
    $('.machine').classList.add('winner');
  } else if (result.multiplier === 1) $('#result').textContent = 'A pair! Your bet is returned. Break even.';
  else $('#result').textContent = `No match this time. ${balanceMessage()}`;
});
$('#reset').addEventListener('click', () => { if (!busy) $('#reset-dialog').showModal(); });
$('#cancel-reset').addEventListener('click', () => $('#reset-dialog').close());
$('#confirm-reset').addEventListener('click', () => {
  if (busy) return;
  state = fresh(); save(); render();
  [5,5,5].forEach((symbol,i) => paintReel(i,symbol));
  $('.machine').classList.remove('winner');
  $('#result').classList.remove('win');
  $('#result').textContent = 'Fresh start. 1,000 demo credits, all yours.';
  $('#reset-dialog').close();
  $('#spin').focus();
});
(state.history[0]?.reels || [5,5,5]).forEach((symbol,i) => paintReel(i,symbol));
render();
renderMotion();
if (state.history.length) $('#result').textContent = `Welcome back. ${balanceMessage()}`;
