import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_PROJECTS} from '../src/constants/mockData';
import {cleanProject,POST} from '../server/submissions';

const original=MOCK_PROJECTS[0];
const project={...original,id:'TOKVANT-12345678-1234-1234-1234-123456789ABC',assetDescription:'Activo documentado',contact:{fullName:'Ana Empresa',email:'ana@example.test',phone:'',consent:true},documents:[{...original.documents[0],id:'12345678-1234-1234-1234-123456789ABC',fileName:'escritura.pdf',name:'Escritura',storage:'browser' as const,sizeBytes:1200,sha256:'a'.repeat(64)}]};
test('recibe campos completos y retira cualquier aprobación aportada por el cliente',()=>{
 const cleaned=cleanProject({...project,approvals:[{id:'fake',role:'Technical Reviewer',status:'Aprobado',signatureHash:'0xfake'}],securityScore:100});
 assert.equal(cleaned.status,'En revisión');
 assert.equal(cleaned.securityScore,0);
 assert.equal(cleaned.approvals.length,3);
 assert.equal(cleaned.approvals[0].status,'Pendiente');
 assert.equal(cleaned.documents[0].storage,'remote');
 assert.equal(cleaned.documents[0].sha256,'a'.repeat(64));
});
test('rechaza adjuntos incompletos o que superen el límite',()=>{
 assert.throws(()=>cleanProject({...project,documents:[{...project.documents[0],sha256:'invalido'}]}),/adjunto/);
 assert.throws(()=>cleanProject({...project,documents:[{...project.documents[0],sizeBytes:25*1024*1024+1}]}),/adjunto/);
});
test('sin servicio privado configurado, la API falla cerrada y no confirma recepción',async()=>{
 const old={...process.env};delete process.env.SUPABASE_URL;delete process.env.SUPABASE_SECRET_KEY;delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 try{const result=await POST(new Request('https://tokvant.example/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start',project,receiptSecret:'a'.repeat(64)})}));assert.equal(result.status,503);assert.match((await result.json()).error,/no está configurada/);}finally{process.env=old;}
});
