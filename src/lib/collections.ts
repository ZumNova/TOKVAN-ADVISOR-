import {staffRequest} from './sharedSubmissions';
export const linkCollection=(account:string,submissionId:string,transactionHash:string)=>staffRequest('link',account,{submissionId,transactionHash},'/api/collections');
