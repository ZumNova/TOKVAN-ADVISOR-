import test from 'node:test';
import assert from 'node:assert/strict';
import {Wallet,verifyMessage} from 'ethers';
import {buildSiweMessage} from '../server/auth.js';
import {clearSessionCookie,sessionCookie} from '../server/staffSession.js';

test('SIWE message binds domain, URI, chain, nonce and expiration to the signer',async()=>{
 const wallet=Wallet.createRandom(),issued='2026-11-25T12:00:00.000Z',expires='2026-11-25T12:05:00.000Z';
 const message=buildSiweMessage('tokvan-advisor.vercel.app',wallet.address,'https://tokvan-advisor.vercel.app',11155111,'a1b2c3d4e5f60708',issued,expires,'11111111-2222-4333-8444-555555555555');
 assert.match(message,/^tokvan-advisor\.vercel\.app wants you to sign in with your Ethereum account:/);
 assert.match(message,/URI: https:\/\/tokvan-advisor\.vercel\.app/);
 assert.match(message,/Version: 1/);assert.match(message,/Chain ID: 11155111/);assert.match(message,/Nonce: a1b2c3d4e5f60708/);assert.match(message,/Expiration Time: 2026-11-25T12:05:00\.000Z/);
 const signature=await wallet.signMessage(message);assert.equal(verifyMessage(message,signature),wallet.address);
 assert.notEqual(verifyMessage(message.replace('11155111','1'),signature),wallet.address);
});

test('administrative cookie is short, HttpOnly, Secure and SameSite Strict',()=>{
 const cookie=sessionCookie('a'.repeat(64),900);
 assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Strict/);assert.match(cookie,/Max-Age=900/);assert.match(clearSessionCookie(),/Max-Age=0/);
});
