import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { retainOnly } from '../lab-model.js';
test('retainOnly keeps only the songs being previewed', () => { const cache = new Map([['a', 1], ['b', 2], ['c', 3], ['d', 4]]); assert.equal(retainOnly(cache, ['b', 'c']), 2); assert.deepEqual([...cache.keys()], ['b', 'c']); });
test('retainOnly with no ids releases everything', () => { const cache = new Map([['a', 1], ['b', 2]]); assert.equal(retainOnly(cache), 2); assert.equal(cache.size, 0); });
test('retainOnly ignores ids that are not cached', () => { const cache = new Map([['a', 1]]); assert.equal(retainOnly(cache, ['a', 'zzz']), 0); assert.deepEqual([...cache.keys()], ['a']); });
// Guard against regressions: importing audio must not keep the decoded buffer, and the lab must release audio when the pair changes or the lab closes.
const lab = readFileSync(new URL('../lab.js', import.meta.url), 'utf8');
const importFiles = lab.slice(lab.indexOf('async function importFiles'), lab.indexOf('\n}', lab.indexOf('async function importFiles')));
test('importing audio does not keep decoded audio in memory', () => { assert.ok(importFiles.length > 100); assert.doesNotMatch(importFiles, /buffers\.set\(/); });
test('opening a transition, previewing, removing, reordering, leaving and importing a plan release decoded audio', () => {
  assert.match(lab, /function openTransition[^}]*retainOnly\(buffers, selected\)/);
  assert.match(lab, /async function hear[\s\S]*?retainOnly\(buffers, \[a\.id, b\.id\]\)/);
  assert.match(lab, /\$\('leave-lab'\)[^\n]*retainOnly\(buffers\)/);
  assert.match(lab, /button\('Remove'[^\n]*retainOnly\(buffers\)/);
  assert.match(lab, /const move = direction[^\n]*retainOnly\(buffers\)/);
  assert.match(lab, /validatePlan\(raw\)[^\n]*retainOnly\(buffers\)/);
});
test('unused stored audio is cleaned only when a plan import replaces the plan, never at start-up or during an audio import', () => { assert.doesNotMatch(lab, /\npruneOrphans\(\);\s*$/); assert.match(lab, /renderRecipes\(\); const removed = await pruneOrphans\(\); message\(`Plan imported/); assert.match(lab, /async function pruneOrphans\(\) \{ if \(importing\) return 0;/); assert.match(lab, /relinked = \[\]; importing = true;/); assert.match(lab, /importing = false; save\(\);/); });
