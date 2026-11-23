import {staffRequest} from './sharedSubmissions';
import type {TokenProject} from '../types';

export type AdminDossier={
 submission:{id:string;requestId:string;receivedAt:string;projectHash:string;project:TokenProject};
 privateContact:{contact:TokenProject['contact']|null;tax_id:string|null}|null;
 reviews:{id:string;role:string;decision:string;project_hash:string;signer_wallet:string;created_at:string;proof?:{comments?:string}}[];
 payments:{id:string;status:string;amount:string;currency:string;reference:string;file_name:string;file_sha256:string;signer_wallet:string|null;verified_at:string|null;created_at:string}[];
 authorizations:{id:string;project_hash:string;review_ids:string[];payment_id:string;signer_wallet:string;created_at:string}[];
 issuance:{id:string;standard:string;chain_id:number;factory_address:string;token_address:string;transaction_hash:string;block_number:number;token_name:string;token_symbol:string;admin_wallet:string;treasury_wallet:string;created_at:string}|null;
 collection:{id:string;standard:string;chain_id:number;factory_address:string;collection_address:string;transaction_hash:string;block_number:number;collection_name:string;collection_symbol:string;admin_wallet:string;max_items:string;created_at:string}|null;
 regulatedIssuance:{id:string;standard:string;chain_id:number;factory_address:string;token_address:string;transaction_hash:string;block_number:number;token_name:string;token_symbol:string;admin_wallet:string;dossier_hash:string;created_at:string}|null;
 collectionStorageReady:boolean;
 regulatedStorageReady:boolean;
};
export const loadAdminDossier=(account:string,submissionId:string)=>staffRequest('read',account,{submissionId},'/api/dossiers') as Promise<AdminDossier>;
