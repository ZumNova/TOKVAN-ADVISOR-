import React from 'react';
import {X} from 'lucide-react';

export type InstitutionalDocument='terms'|'privacy'|'cookies';

const documents:Record<InstitutionalDocument,{title:string;updated:string;sections:{heading:string;body:string}[]}>= {
 terms:{title:'Términos y condiciones de uso',updated:'Versión informativa · noviembre de 2026',sections:[
  {heading:'1. Alcance',body:'TOKVANT ofrece herramientas de diagnóstico, simulación, preparación documental y soporte tecnológico para proyectos de tokenización. El uso del portal no constituye aprobación de un proyecto, oferta pública, recomendación de inversión, asesoramiento legal, contable o financiero, ni garantiza un despliegue en producción.'},
  {heading:'2. Evaluación y elegibilidad',body:'Toda información enviada debe ser completa, lícita y verificable. Para operar emisiones permissionadas, las personas deberán superar controles KYC y las entidades controles KYB, además de AML, elegibilidad, jurisdicción y demás revisiones que correspondan. Completar una solicitud no equivale a superar esos controles.'},
  {heading:'3. Activos, derechos y documentación',body:'El solicitante es responsable de acreditar la existencia, titularidad, valuación y disponibilidad del activo o derecho propuesto. Un token no crea por sí solo propiedad, renta, participación o derecho de cobro: ese alcance debe surgir de contratos y documentos válidos revisados para la jurisdicción aplicable.'},
  {heading:'4. Wallets y blockchain',body:'El usuario controla su wallet, claves y firmas. TOKVANT nunca solicita frases semilla. Las operaciones blockchain pueden ser públicas, irreversibles y generar costos de red. Antes de firmar, el usuario debe comprobar red, contrato, dirección destinataria, cantidades y permisos.'},
  {heading:'5. Pruebas y terceros',body:'Las funciones identificadas como prueba, simulación o Sepolia no representan una emisión productiva. El portal puede utilizar proveedores de infraestructura, almacenamiento, RPC, IPFS y wallets. Sus servicios tienen términos y disponibilidad propios.'},
  {heading:'6. Uso permitido',body:'No se permite enviar contenido ilícito, malicioso, engañoso, que infrinja derechos de terceros o intente alterar la seguridad del portal. TOKVANT puede detener una evaluación o restringir el acceso cuando detecte riesgos técnicos, regulatorios o de integridad.'},
  {heading:'7. Contacto y actualización',body:'Estos términos pueden actualizarse cuando cambien las funciones o el marco operativo. Los términos definitivos de cada servicio se establecen en su propuesta y contrato particular. Consultas: pieruccifrancoemmanuel@gmail.com.'},
 ]},
 privacy:{title:'Privacidad y tratamiento de datos',updated:'Versión informativa · noviembre de 2026',sections:[
  {heading:'1. Datos tratados',body:'Podemos recibir datos de contacto, organización, identificación fiscal, wallet pública, características del proyecto, documentación adjunta, registros técnicos y comunicaciones. No deben enviarse frases semilla, claves privadas ni información personal que no sea necesaria para evaluar el proyecto.'},
  {heading:'2. Finalidades',body:'Los datos se utilizan para responder consultas, evaluar solicitudes, preparar propuestas, administrar expedientes, verificar pagos, proteger el servicio, mantener trazabilidad y cumplir obligaciones contractuales o regulatorias aplicables.'},
  {heading:'3. KYC, KYB y AML',body:'Cuando el servicio o la emisión lo requiera, TOKVANT o un proveedor autorizado podrá solicitar verificaciones KYC para personas, KYB para entidades y controles AML, sanciones y elegibilidad. Esos controles se informarán antes de solicitar documentación adicional.'},
  {heading:'4. Proveedores y transferencias',body:'La información puede procesarse mediante proveedores de hosting, base de datos, almacenamiento, correo, blockchain e IPFS. Una wallet y las transacciones registradas en una blockchain pública pueden permanecer visibles de forma permanente. Los documentos privados no se publican en blockchain salvo una acción expresa y revisada.'},
  {heading:'5. Conservación y seguridad',body:'Los datos se conservan durante el tiempo necesario para la evaluación, relación contractual, trazabilidad y obligaciones aplicables. Se aplican controles de acceso, sesiones firmadas, separación de documentos privados y verificación de integridad, sin que ningún sistema pueda garantizar riesgo cero.'},
  {heading:'6. Derechos y consultas',body:'La persona interesada puede solicitar información, actualización, corrección o eliminación cuando resulte aplicable y técnicamente posible. Para consultas de privacidad escriba a pieruccifrancoemmanuel@gmail.com. La solicitud podrá requerir verificación de identidad.'},
 ]},
 cookies:{title:'Cookies y almacenamiento local',updated:'Versión informativa · noviembre de 2026',sections:[
  {heading:'1. Cookies necesarias',body:'El acceso administrativo utiliza una cookie de sesión HttpOnly, Secure y SameSite=Strict. Es necesaria para mantener una sesión SIWE temporal y no puede ser leída por el código del navegador. Cerrar sesión la revoca.'},
  {heading:'2. Almacenamiento del navegador',body:'El portal utiliza almacenamiento local para conservar borradores, preferencias, autorizaciones importadas y referencias técnicas de prueba. Esa información permanece en el navegador y se separa por dominio. Puede eliminarse desde las opciones del navegador, aunque se perderán los borradores locales.'},
  {heading:'3. Analítica y publicidad',body:'TOKVANT no utiliza actualmente cookies publicitarias ni perfiles de comportamiento en este portal. Si se incorporan herramientas analíticas o de terceros que requieran consentimiento, esta información y los controles disponibles deberán actualizarse antes de activarlas.'},
  {heading:'4. Servicios externos',body:'Los enlaces a LinkedIn, WhatsApp, exploradores blockchain, wallets y otros servicios abren plataformas externas que aplican sus propias políticas de cookies y privacidad.'},
 ]},
};

export function InstitutionalModal({document,onClose}:{document:InstitutionalDocument;onClose:()=>void}){
 const content=documents[document];
 return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="institutional-title" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <article className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#39547C] bg-[#0D1625] p-6 text-[#E4ECFA] shadow-2xl sm:p-8">
   <div className="flex items-start justify-between gap-4 border-b border-[#2B3E5D] pb-5">
    <div><h2 id="institutional-title" className="text-2xl font-bold text-white">{content.title}</h2><p className="mt-1 text-xs text-[#8FA6C8]">{content.updated}</p></div>
    <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg border border-[#39547C] p-2 hover:bg-[#17253B]"><X size={20}/></button>
   </div>
   <div className="mt-6 space-y-6">{content.sections.map(section=><section key={section.heading}><h3 className="font-semibold text-[#B2D4FF]">{section.heading}</h3><p className="mt-2 text-sm leading-7 text-[#B8C9E1]">{section.body}</p></section>)}</div>
   <p className="mt-8 border-t border-[#2B3E5D] pt-5 text-xs leading-6 text-[#8FA6C8]">Documento general para transparencia del portal. Cada proyecto puede requerir términos particulares y revisión profesional según su estructura y jurisdicción.</p>
  </article>
 </div>;
}
