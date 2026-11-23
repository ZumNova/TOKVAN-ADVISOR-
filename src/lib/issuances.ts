import {staffRequest} from './sharedSubmissions';

export type SharedIssuance={id:string;submission_id:string;project_hash:string;standard:'ERC-20';chain_id:number;factory_address:string;token_address:string;transaction_hash:string;block_number:number;project_id_hash:string;config_digest:string;token_name:string;token_symbol:string;admin_wallet:string;treasury_wallet:string;initial_supply_base_units:string;max_supply_base_units:string;recorded_by:string;created_at:string};
const endpoint='/api/issuances';
export const loadIssuance=(account:string,submissionId:string)=>staffRequest('list',account,{submissionId},endpoint) as Promise<{issuance:SharedIssuance|null}>;
export const linkIssuance=(account:string,submissionId:string,transactionHash:string,factoryDeploymentHash?:string)=>staffRequest('link',account,{submissionId,transactionHash,factoryDeploymentHash},endpoint) as Promise<{issuance:SharedIssuance}>;
