import {test,after,before} from 'node:test';
import assert from 'node:assert/strict';
import {server} from '../server.js';
let base;
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(()=>new Promise(resolve=>server.close(resolve)));
test('serves the application and assets with correct MIME types',async()=>{for(const [route,type] of [['/','text/html'],['/app.js','text/javascript'],['/style.css','text/css']]){const res=await fetch(base+route);assert.equal(res.status,200);assert.ok(res.headers.get('content-type').startsWith(type));assert.ok((await res.text()).length>100);}});
test('reports health and handles missing paths and unsupported methods',async()=>{assert.deepEqual(await (await fetch(base+'/health')).json(),{status:'ok'});assert.equal((await fetch(base+'/missing')).status,404);assert.equal((await fetch(base+'/',{method:'POST'})).status,405);assert.equal((await fetch(base+'/%2e%2e%2fpackage.json')).status,403);});
