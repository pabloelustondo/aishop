// Real agent composition, Auth/Storage/Firestore emulators and a fixture-only provider transport.
import assert from 'node:assert/strict';
import { createAgentAnalysisStore } from '../src/agent-analysis-store.js';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { mintEmulatorUser } from '../../e2e/server/emulator-auth.mjs';
import { createFirebaseAgentHandler } from '../src/firebase-agent-handler.js';
for (const key of ['FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST','FIREBASE_STORAGE_EMULATOR_HOST']) {
 assert.match(process.env[key] ?? '', /^(127\.0\.0\.1|localhost):\d+$/, `${key} must be local`);
}
initializeApp({projectId:'demo-aishop-e2e',storageBucket:'demo-aishop-e2e.appspot.com'});
const events=[];
let scenario='success';
let faultReference;
const report={summary:'fixture',identifiedProducts:[{name:'Fixture product',count:2,confidence:'high',visibleEvidence:['fixture']}],uncertainItems:[]};
const handler=createFirebaseAgentHandler({apiKey:'offline-fixture-only',environment:'emulator',release:'fixture',logger:{info:e=>events.push(e),error:e=>events.push(e)},fetchImpl:async()=>{ if(scenario==='persistence') await faultReference.delete(); return new Response(JSON.stringify(scenario==='success'?{status:'completed',model:'gpt-5.4-mini',usage:{input_tokens:100,output_tokens:50},output_text:JSON.stringify(report)}:{status:'incomplete',incomplete_details:{reason:'max_output_tokens'},usage:{input_tokens:100,output_tokens:1200},output_text:'PRIVATE-MARKER {'}),{status:200,headers:{'x-request-id':'req_fixture'}}); }});
const server=createServer(async(req,res)=>{
 try {const chunks=[];for await(const c of req) chunks.push(c);req.rawBody=Buffer.concat(chunks);await handler(req,res);}
 catch {res.writeHead(500);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try {
 const {idToken,uid}=await mintEmulatorUser();
 const store=createAgentAnalysisStore({firestore:getFirestore(),serverTimestamp:FieldValue.serverTimestamp});
 const ownerKey=createHash('sha256').update(uid).digest('hex');
 const concurrentId=randomUUID();
 await store.create({ownerKey,analysisId:concurrentId,fileName:'fixture',mediaType:'image/jpeg',sha256:'a'.repeat(64),byteLength:1});
 const reservations=await Promise.allSettled([1,2].map(()=>store.markAnalyzing({ownerKey,analysisId:concurrentId})));
 assert.equal(reservations.filter(r=>r.status==='fulfilled').length,1,'only one concurrent reservation wins');
 assert.equal((await store.read({ownerKey,analysisId:concurrentId})).runCount,1);
 const reserved=reservations.find(r=>r.status==='fulfilled').value;
 await store.markFailed({ownerKey,analysisId:concurrentId,runId:reserved.runId,reason:'fixture_complete'});
 const base=`http://127.0.0.1:${server.address().port}/v1/agent/analyses`;
 const call=(path='',body)=>fetch(base+path,{method:'POST',headers:{authorization:`Bearer ${idToken}`,...(body instanceof FormData?{}:{'content-type':'application/json'}),'x-cloud-trace-context':'a'.repeat(32)+'/1;o=1'},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
 const form=new FormData();form.append('file',new Blob([readFileSync(new URL('../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/accepted-detail.jpg',import.meta.url))],{type:'image/jpeg'}),'PRIVATE-MARKER.jpg');
 const upload=await call('',form);assert.equal(upload.status,201);
 const id=(await upload.json()).analysis.analysisId;
 faultReference=getFirestore().collection('agentAnalyses').doc(createHash('sha256').update(uid).digest('hex')).collection('analyses').doc(id);
 let response=await call(`/${id}/run`);assert.equal(response.status,200);
 response=await call(`/${id}/run`,{context:'PRIVATE-MARKER ignore top shelf'});assert.equal(response.status,200);
 scenario='limit';
 response=await call(`/${id}/run`,{context:'PRIVATE-MARKER include all'});assert.equal(response.status,502);
 const failed=await response.json(); const reference=failed.error.requestId;
 assert.equal(reference,response.headers.get('x-request-id'));
 const record=await (await fetch(base+'/'+id,{headers:{authorization:`Bearer ${idToken}`}})).json();
 const runs=record.analysis.runs;
 assert.deepEqual(runs.map(r=>r.trigger),['initial','refine','refine']);
 const diagnostic=runs.at(-1).diagnostics;
 assert.equal(diagnostic.failureClass,'provider_output_limit');assert.equal(diagnostic.usage.outputTokens,1200);
 assert.equal(diagnostic.requestId,reference);assert.equal(diagnostic.maxOutputTokens,1200);
 assert.equal(diagnostic.providerRequestId,'req_fixture');
 assert.ok(events.some(e=>e.event==='provider.failed'&&e.requestId===reference&&e.runId===runs.at(-1).runId));
 assert.ok(events.some(e=>e.event==='run.failed'&&e.requestId===reference));
 assert.ok(!JSON.stringify(events).includes('PRIVATE-MARKER'));
 assert.ok(!JSON.stringify(runs.map(r=>r.diagnostics)).includes('PRIVATE-MARKER'));
 scenario='success';response=await call(`/${id}/run`,{context:'same note'});assert.equal(response.status,200);
 assert.equal((await response.json()).analysis.runs.at(-1).trigger,'retry');
 scenario='persistence';
 const from=events.length;
 response=await call(`/${id}/run`,{context:'force fixture output limit and emulator record removal'});
 assert.equal(response.status,502,'original provider error survives failed database settlement');
 const lastEvents=events.slice(from);
 assert.ok(lastEvents.some(e=>e.event==='provider.failed'&&e.failureClass==='provider_output_limit'));
 assert.ok(lastEvents.some(e=>e.event==='persistence.failed'&&e.failureClass==='persistence_failed'));
 assert.ok(!lastEvents.some(e=>e.event==='run.failed'),'unsettled run must not claim durable failure');
 console.log('PASS step 06: composed diagnostics, output limit, correlation, refinement/retry and redaction (fixture provider).');
} finally {await new Promise(resolve=>server.close(resolve));}
