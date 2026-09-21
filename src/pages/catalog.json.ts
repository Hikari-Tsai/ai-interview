import { loadCards, publicIndex } from '../lib/catalog';
export function GET(){return new Response(JSON.stringify(publicIndex(loadCards())),{headers:{'Content-Type':'application/json'}});}
