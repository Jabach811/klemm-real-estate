import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync("C:/Dev/Joel's Workspaces/Personal/Work/Jack Klemm Real Estate/Klemm/api/contact.js",'utf8');
// Isolated VM context: dummy env, mocked fetch. No live network or mail.
import vm from 'node:vm';
let calls=[],failAt=0;
const context=vm.createContext({URLSearchParams,console:{error(){}},process:{env:{RESEND_API_KEY:'dummy-test',MAIL_FROM:'Test <test@example.com>',MAIL_TO:'jack-test@example.com',SITE_URL:'https://example.com'}},fetch:async(url,options)=>{calls.push({url,payload:JSON.parse(options.body)});return {ok:calls.length!==failAt,status:500,text:async()=> 'mocked failure'};}});
const mod=new vm.SourceTextModule(source,{context}); await mod.link(()=>{});await mod.evaluate();
async function run(body){calls=[];let result={};const res={status(n){result.status=n;return this},json(b){result.body=b;return this}};await mod.namespace.default({method:'POST',body},res);return result;}
assert.equal((await run({name:'Test'})).status,422);assert.equal(calls.length,0);console.log('PASS missing email: 422, no sends');
assert.equal((await run({name:'Test',email:'visitor@example.com'})).status,200);assert.equal(calls.length,2);assert.equal(calls[0].payload.reply_to,'visitor@example.com');assert.equal(calls[1].payload.reply_to,'jack-test@example.com');assert.deepEqual(calls[0].payload.to,['jack-test@example.com']);assert.deepEqual(calls[1].payload.to,['visitor@example.com']);console.log('PASS valid email: two sends, correct recipients and reply paths');
await run('email=visitor%40example.com&deliver=Email&deliver=Print');assert.match(calls[0].payload.html,/Delivery preference: Print/);assert.doesNotMatch(calls[0].payload.html,/Delivery preference: Email/);console.log('CONFIRMED duplicate delivery values: raw string body retains Print only');
failAt=2;assert.equal((await run({email:'visitor@example.com'})).status,502);assert.equal(calls.length,2);console.log('CONFIRMED second-send failure: 502 even though first send succeeded');
