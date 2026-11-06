import {createMediaHandlers} from '../server/nftMedia.js';
export async function GET() {return createMediaHandlers({jwt: process.env.PINATA_JWT}).GET();}
export async function POST(request: Request) {return createMediaHandlers({jwt: process.env.PINATA_JWT}).POST(request);}
