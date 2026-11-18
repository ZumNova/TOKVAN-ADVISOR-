import type {TokenProject} from '../types';

export function assetTypeFromLeadSector(sector:string):TokenProject['assetType']{
 if(sector.includes('Agropecuario'))return 'Agropecuario';
 if(sector.includes('Inmobiliario'))return 'Inmobiliario';
 if(sector.includes('Factoring'))return 'Deuda / Factoring';
 if(sector.includes('Infraestructura'))return 'Infraestructura';
 if(sector.includes('Carbono'))return 'Derechos de Emisión';
 if(sector.includes('Fondo de Inversión'))return 'Fondo Privado';
 return 'Otro';
}
