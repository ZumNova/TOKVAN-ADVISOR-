import {staffRequest} from './sharedSubmissions';
export const linkRegulatedIssuance=(account:string,submissionId:string,transactionHash:string,acknowledgeAdminDifference=false)=>staffRequest('link',account,{submissionId,transactionHash,acknowledgeAdminDifference},'/api/regulated-issuances');
