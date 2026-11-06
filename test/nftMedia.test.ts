import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Wallet} from 'ethers';
import {createMediaHandlers} from '../server/nftMedia';
import {MAX_IMAGE_BYTES,mediaMessage,validateMediaPayload} from '../src/lib/nftMedia';
const signer=Wallet.createRandom();
const payload={name:'San Pedro #1',description:'NFT de prueba',mime:'image/png',imageBase64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='};
const imageCid='bafkreidvbhs33ighmljlvr7zbv2ywwzcmp5adtf4kqvlly67cy56bdtmve',metadataCid='bafy'+'b'.repeat(55);
async function request(p=payload,issuedAt=Date.now(),signed=p) {
 const signature=await signer.signMessage(mediaMessage(signed,signer.address,issuedAt));
 return new Request('https://tokvan-advisor.vercel.app/api/nft-media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload:p,account:signer.address,issuedAt,signature})});
}
test('unconfigured service exposes no credentials and fails before upload',async()=>{
 const handlers=createMediaHandlers();assert.deepEqual(await (await handlers.GET()).json(),{configured:false,maxImageBytes:MAX_IMAGE_BYTES});
 assert.equal((await handlers.POST(await request())).status,503);
});
test('publishes image and JSON to public IPFS with a signed exact payload',async()=>{
 const calls:{body:FormData;headers:HeadersInit}[]=[];
 const fetcher=(async(url,init)=>{assert.equal(url,'https://uploads.pinata.cloud/v3/files');calls.push({body:init!.body as FormData,headers:init!.headers!});return Response.json({data:{cid:calls.length===1?imageCid:metadataCid}});}) as typeof fetch;
 const handlers=createMediaHandlers({jwt:'server-secret',accounts:[signer.address],fetcher});
 const result=await handlers.POST(await request());assert.equal(result.status,200);assert.equal(result.headers.get('Cache-Control'),'no-store');const data=await result.json();
 assert.equal(data.metadataUri,`ipfs://${metadataCid}`);assert.deepEqual(data.metadata,{name:payload.name,description:payload.description,image:`ipfs://${imageCid}`});
 assert.equal(calls.length,2);
 for(const call of calls){assert.equal(call.body.get('network'),'public');assert.equal(new Headers(call.headers).get('Authorization'),'Bearer server-secret');}
 assert.equal((calls[0].body.get('file') as File).type,'image/png');
 assert.deepEqual(JSON.parse(await (calls[1].body.get('file') as File).text()),data.metadata);
 assert.ok(!JSON.stringify(data).includes('server-secret'));
});
test('rejects unknown wallet, altered data, expired signatures and invalid images before Pinata',async()=>{
 let calls=0;const fetcher=(async()=>{calls++;throw new Error('unexpected');}) as typeof fetch;
 const handlers=createMediaHandlers({jwt:'secret',accounts:[signer.address],fetcher});
 assert.equal((await createMediaHandlers({jwt:'secret',accounts:[],fetcher}).POST(await request())).status,403);
 assert.equal((await handlers.POST(await request({...payload,name:'Tampered'},Date.now(),payload))).status,403);
 assert.equal((await handlers.POST(await request(payload,Date.now()-181000))).status,400);
 assert.equal((await handlers.POST(await request(payload,Date.now()+60000))).status,400);
 assert.equal((await handlers.POST(await request({...payload,imageBase64:Buffer.from('<svg>not png</svg>').toString('base64')}))).status,400);
 assert.equal(calls,0);
});
test('enforces payload limits and reports partial upload without exposing provider errors',async()=>{
 assert.throws(()=>validateMediaPayload({...payload,mime:'image/svg+xml'}));
 assert.throws(()=>validateMediaPayload({...payload,name:' '}));
 assert.throws(()=>validateMediaPayload({...payload,imageBase64:'a'.repeat(MAX_IMAGE_BYTES*2)}));
 const handlers=createMediaHandlers({jwt:'secret',accounts:[signer.address]});
 const big=new Request('https://example.com',{method:'POST',headers:{'Content-Type':'application/json','Content-Length':'4000000'},body:'{}'});
 assert.equal((await handlers.POST(big)).status,413);
 let calls=0;const fetcher=(async()=>{calls++;return calls===1?Response.json({data:{cid:imageCid}}):new Response('provider-secret',{status:429});}) as typeof fetch;
 const response=await createMediaHandlers({jwt:'secret',accounts:[signer.address],fetcher}).POST(await request());
 assert.equal(response.status,502);const body=await response.json();assert.equal(body.imageUploaded,true);assert.equal(body.imageUri,`ipfs://${imageCid}`);assert.ok(!JSON.stringify(body).includes('provider-secret'));
});
