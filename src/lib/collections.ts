import {staffRequest} from './sharedSubmissions';
export const linkCollection=(account:string,submissionId:string,transactionHash:string,factoryDeploymentHash?:string)=>staffRequest('link',account,{submissionId,transactionHash,factoryDeploymentHash},'/api/collections');
