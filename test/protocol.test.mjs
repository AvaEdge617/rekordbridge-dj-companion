import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIENT_NAME, PROTOCOL_VERSION, commandMessage, helloMessage } from '../protocol.js';
test('reconnection uses an optional session secret, not only the one-time room code', () => {
  assert.equal(helloMessage({clientId:'id',sessionCode:'123456',resumeToken:'secret'}).resumeToken, 'secret');
  assert.ok(!('resumeToken' in helloMessage({clientId:'id',sessionCode:'123456'})));
});
test('hello identifies the CueCraft touchscreen and protocol version', () => { const message = helloMessage({ clientId: 'cuecraft-test', sessionCode: 'ABC123' }); assert.equal(message.v, PROTOCOL_VERSION); assert.equal(message.client.name, CLIENT_NAME); assert.equal(message.client.surface, 'touchscreen'); });
test('continuous commands are normalized and bounded', () => { const message = commandMessage({ clientId: 'id', sessionCode: 'CODE', sequence: 4, type: 'mixer.crossfader', value: 5 }); assert.equal(message.command.value, 1); assert.equal(message.seq, 4); });
test('held commands use press and release phases', () => { assert.equal(commandMessage({ clientId: 'id', sessionCode: 'CODE', sequence: 1, type: 'deck1.cue', phase: 'release' }).command.phase, 'release'); });
test('unknown commands are rejected before transport', () => { assert.throws(() => commandMessage({ clientId: 'id', sessionCode: 'CODE', sequence: 1, type: 'mixer.sync' }), /Unsupported/); });
test('headphone cue is its own held command, separate from transport cue', () => { const m = commandMessage({ clientId: 'id', sessionCode: 'CODE', sequence: 2, type: 'deck2.headphoneCue', phase: 'press' }); assert.deepEqual(m.command, { type: 'deck2.headphoneCue', phase: 'press' }); assert.ok(helloMessage({ clientId: 'id', sessionCode: 'C' }).capabilities.includes('deck.headphoneCue')); });
