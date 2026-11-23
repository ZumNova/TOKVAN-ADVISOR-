import {staffRequest} from './sharedSubmissions';
export const linkRegulatedIssuance=(account:string,submissionId:string,transactionHash:string)=>staffRequest('link',account,{submissionId,transactionHash},'/api/regulated-issuances');
