import {staffRequest} from './sharedSubmissions';

const endpoint='/api/participants';
export type RegisteredToken={token_address:string;factory_address:string;chain_id:number;token_name:string;token_symbol:string;admin_wallet:string;claim_authority:string;project_reference:string;created_at:string};
export type ParticipantRow={id:string;wallet_address:string;internal_reference:string;proposed_country:number|null;proposed_by:string;created_at:string;updated_at:string};
export type ParticipantRoster={token:RegisteredToken|null;items:ParticipantRow[]};
export const loadParticipants=(account:string,tokenAddress:string)=>staffRequest('list',account,{tokenAddress},endpoint) as Promise<ParticipantRoster>;
export const registerRegulatedToken=(account:string,tokenAddress:string,factoryAddress:string,adminWallet:string,claimAuthority:string,projectReference:string,tokenName:string,tokenSymbol:string)=>staffRequest('register',account,{tokenAddress,factoryAddress,adminWallet,claimAuthority,projectReference,tokenName,tokenSymbol},endpoint);
export const proposeParticipant=(account:string,tokenAddress:string,walletAddress:string,internalReference:string,proposedCountry:number|null)=>staffRequest('propose',account,{tokenAddress,walletAddress,internalReference,proposedCountry},endpoint);
