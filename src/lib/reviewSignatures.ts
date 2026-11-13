import {getAddress, keccak256, toUtf8Bytes, verifyMessage} from 'ethers';
import deployment from '../../deployment/sepolia-participants.json';
import type {ApprovalStep,TokenProject} from '../types';
export type ReviewRole = ApprovalStep['role'];
export type ReviewDecision = Exclude<ApprovalStep['status'],'Pendiente'>;
export type ReviewProof = {projectId:string;stepId:string;role:ReviewRole;decision:ReviewDecision;comments:string;projectHash:string;timestamp:string;nonce:string;signer:string;signature:string};
export const reviewWallets:Record<ReviewRole,string>={
 'Technical Reviewer':deployment.participants.technicalReviewer,
 'Compliance Reviewer':deployment.participants.complianceReviewer,
 'Enterprise Board':deployment.participants.boardReviewer,
};
export const reviewRoleForWallet=(account:string|null):ReviewRole|null=>{
 if(!account)return null;
 try{return (Object.keys(reviewWallets) as ReviewRole[]).find(role=>getAddress(account)===getAddress(reviewWallets[role]))||null;}catch{return null;}
};
const stable=(value:unknown):unknown=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,stable(v)])):value;
export const projectReviewHash=(project:TokenProject)=>keccak256(toUtf8Bytes(JSON.stringify(stable({id:project.id,title:project.title,organizationName:project.organizationName,assetType:project.assetType,assetTypeOther:project.assetTypeOther,assetDescription:project.assetDescription,jurisdiction:project.jurisdiction,standard:project.standard,network:project.network,parameters:project.parameters,documents:project.documents.map(d=>({id:d.id,sha256:d.sha256,fileName:d.fileName})),clientWalletAddress:project.clientWalletAddress,clientWalletNetwork:project.clientWalletNetwork}))));
export const reviewMessage=(proof:Omit<ReviewProof,'signature'>)=>`TOKVANT dictamen de expediente\nOrigen: ${location.origin}\nExpediente: ${proof.projectId}\nPaso: ${proof.stepId}\nRol: ${proof.role}\nDecisión: ${proof.decision}\nObservaciones: ${proof.comments}\nVersión: ${proof.projectHash}\nFecha: ${proof.timestamp}\nNonce: ${proof.nonce}\nWallet: ${proof.signer}`;
export const validReview=(project:TokenProject,proof:ReviewProof)=>{
 try{return proof.projectId===project.id&&project.approvals.some(s=>s.id===proof.stepId&&s.role===proof.role)&&proof.projectHash===projectReviewHash(project)&&getAddress(proof.signer)===getAddress(reviewWallets[proof.role])&&verifyMessage(reviewMessage(proof),proof.signature)===getAddress(proof.signer)&&!Number.isNaN(Date.parse(proof.timestamp));}catch{return false;}
};
