import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {paymentInputError} from '../src/lib/governance';

const file={name:'recibo.webp',size:1024} as File;
test('acepta un comprobante WEBP con importe y referencia válidos',()=>{
 assert.equal(paymentInputError('4000.00','REC-1542',file),null);
});
test('explica por qué un pago no puede firmarse',()=>{
 assert.match(paymentInputError('4.000,00','REC-1542',file)||'',/sin separadores/);
 assert.match(paymentInputError('4000','12',file)||'',/referencia/);
 assert.match(paymentInputError('4000','REC-1542',null)||'',/comprobante/);
});
