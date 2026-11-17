import {POST as handlePost} from '../server/collections.js';
export async function POST(request:Request){return handlePost(request);}
