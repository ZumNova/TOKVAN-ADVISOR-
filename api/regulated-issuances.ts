import {POST as handlePost} from '../server/regulatedIssuances.js';
export async function POST(request:Request){return handlePost(request);}
