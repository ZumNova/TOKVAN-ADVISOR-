import {POST as handlePost} from '../server/dossiers.js';
export async function POST(request:Request){return handlePost(request);}
