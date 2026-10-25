import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SYMBOLS, payout, spin } from '../public/slot-engine.js';
test('every triple pays its advertised multiplier and includes the wager', () => {
  SYMBOLS.forEach((s,i) => {
    assert.deepEqual(payout([i,i,i],10), {multiplier:s.multiplier,award:s.multiplier*10});
    assert.equal(spin(100,10,()=>i).balance,90+s.multiplier*10);
  });
});
test('pairs return the bet in all three positions; distinct symbols lose', () => {
  for (const reels of [[0,0,1],[0,1,0],[1,0,0]]) assert.equal(payout(reels,25).award,25);
  assert.equal(payout([0,1,2],25).award,0);
  let n=0; assert.equal(spin(25,25,()=>n++).balance,0);
});
test('rejects invalid, insufficient, and fractional bets and malformed reels', () => {
  for (const [balance,bet] of [[0,1],[9,10],[-1,1],[100,2],[100,1.5],[NaN,1]]) assert.throws(()=>spin(balance,bet));
  assert.throws(()=>payout([0,1,6],10));
  assert.throws(()=>payout([0,1],10));
});
test('all 216 equiprobable outcomes yield the published 83.33% return', () => {
  let total=0,hits=0;
  for(let a=0;a<6;a++)for(let b=0;b<6;b++)for(let c=0;c<6;c++){const {award}=payout([a,b,c],1);total+=award;if(award)hits++;}
  assert.equal(total,180);assert.equal(hits,96);assert.equal((100*total/216).toFixed(2),'83.33');
});
