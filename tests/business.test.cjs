const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const W=require('../business.js');

function fixture(){
  const context=vm.createContext({WBA:W,localStorage:{getItem:()=>null},sessionStorage:{getItem:()=>null},window:{addEventListener(){}},console,Date});
  vm.runInContext(fs.readFileSync(require.resolve('../app.js'),'utf8'),context);
  const data=W.migrate(JSON.parse(JSON.stringify(vm.runInContext('seedData()',context))));
  const direction=data.users[0],photographer=data.users.find(u=>u.id==='u3'),manager=data.users.find(u=>u.id==='u2');
  const admin={id:'test-admin',role:'admin',status:'Activo',points:[]};data.users.push(admin);
  const shift=data.shifts.find(s=>s.id==='j1');
  W.assignMaterials(data,direction,shift,{frame:30,sticker:40,paper:50,glue:2});
  W.prepare(data,photographer,shift.id,{tools:Object.fromEntries(shift.deviceIds.map(id=>[id,{status:'received'}])),cashOpeningARS:10000});
  return {data,direction,photographer,manager,admin,shift};
}
const input=(extra={})=>({items:[{productId:'pr2',qty:1,price:18000}],currency:'ARS',payment:'Efectivo',exchangeRateARS:1,status:'Cobrada',received:18000,...extra});
test('Canonical permissions and point scope',()=>{
  assert.equal(W.permission({role:'manager',status:'Activo'},'Rentabilidad','view'),false);
  assert.equal(W.permission({role:'manager',status:'Activo'},'Ventas','delete'),false);
  assert.equal(W.permission({role:'pointManager',status:'Activo'},'Comisiones','view'),false);
  assert.equal(W.permission({role:'auditor',status:'Activo'},'Ventas','create'),false);
  assert.equal(W.scope({role:'pointManager',points:['p1']},'p2'),false);
  assert.equal(W.scope({role:'photographer',points:[]},'p1'),false);
});
test('Sale updates stock, materials, cash, history and commission together',()=>{
  const {data,photographer,shift}=fixture();
  const stock=data.stock.find(r=>r.pointId==='p1'&&r.productId==='pr2'),before=stock.available;
  const sale=W.sell(data,photographer,shift.id,input());
  assert.equal(stock.available,before-1);assert.equal(shift.materialConsumed.paper,2);
  assert.equal(sale.costARS,1800);assert.equal(sale.commission,2700);assert.equal(W.cash(data,shift).ARS,53000);
  data.products.find(p=>p.id==='pr2').cost=99999;
  assert.equal(sale.costARS,1800);assert.ok(data.stockMovements.some(m=>m.saleId===sale.id));
});
test('Sale cannot bypass preparation, ownership or active shift',()=>{
  const {data,photographer,shift}=fixture();shift.toolsConfirmed=false;
  assert.throws(()=>W.sell(data,photographer,shift.id,input()),/equipos/);
  shift.toolsConfirmed=true;assert.throws(()=>W.sell(data,photographer,'j2',input()),/alcance/);
  shift.status='Cerrada por fotógrafo';assert.throws(()=>W.sell(data,photographer,shift.id,input()),/activa/);
});
test('Foreign cash uses actual currency and gives change in ARS',()=>{
  const {data,photographer,shift}=fixture();
  const sale=W.sell(data,photographer,shift.id,input({currency:'USD',exchangeRateARS:1500,items:[{productId:'pr2',qty:1,price:12}],received:20}));
  assert.equal(sale.total,12);assert.equal(sale.totalARS,18000);assert.equal(sale.changeARS,12000);
  assert.equal(W.cash(data,shift).USD,20);assert.equal(W.cash(data,shift).ARS,23000);
  assert.equal(W.cash(data,shift).USD*1500+W.cash(data,shift).ARS-shift.cashOpeningARS,43000);
});
test('Insufficient change, stock and below-minimum prices do not mutate in transaction',()=>{
  const {data,photographer,shift}=fixture();const before=JSON.stringify(data);
  assert.throws(()=>W.transaction(data,W.sell,photographer,shift.id,input({currency:'USD',exchangeRateARS:1500,items:[{productId:'pr2',qty:1,price:12}],received:100})),/vuelto/);
  assert.throws(()=>W.transaction(data,W.sell,photographer,shift.id,input({items:[{productId:'pr2',qty:1,price:14000}],received:14000})),/mínimo/);
  assert.throws(()=>W.transaction(data,W.sell,photographer,shift.id,input({items:[{productId:'pr2',qty:1000,price:18000}],received:18000000})),/Stock insuficiente/);
  assert.equal(JSON.stringify(data),before);
});
test('Manager requests, a different admin approves, and ledgers reverse exactly once',()=>{
  const {data,photographer,manager,admin,shift}=fixture();
  const sale=W.sell(data,photographer,shift.id,input());
  assert.throws(()=>W.annul(data,manager,sale.id,'Duplicada'),/Solo Dirección/);
  const req=W.request(data,manager,sale.id,'Duplicada');W.resolve(data,admin,req.id,true,'Comprobante duplicado');
  assert.equal(sale.status,'Anulada');assert.equal(shift.materialConsumed.paper,0);
  assert.throws(()=>W.resolve(data,admin,req.id,true,'Otra vez'),/resuelta/);
  assert.equal(data.materialMovements.filter(m=>m.saleId===sale.id&&m.type==='Reversión por anulación').length,3);
  assert.ok(data.notifications.some(n=>n.recipient==='direction'));
});
test('Requests cannot approve themselves or silently approve a changed sale',()=>{
  const {data,photographer,admin,direction,shift}=fixture();const sale=W.sell(data,photographer,shift.id,input());
  const req=W.request(data,admin,sale.id,'Revisar');assert.throws(()=>W.resolve(data,admin,req.id,true,'Aprobar'),/otra persona/);
  sale.notes='Modificada';assert.throws(()=>W.resolve(data,direction,req.id,true,'Aprobar'),/cambió/);
});
function closure(f,extra={}){
  const {data,shift}=f;const cash=W.cash(data,shift),declared={...cash};declared.ARS=Math.max(0,cash.ARS-shift.cashOpeningARS);
  return {commissionMethod:'Transferencia',returned:Object.fromEntries(Object.entries(shift.materialReceived).map(([k,v])=>[k,v-(shift.materialConsumed[k]||0)])),glueUsed:0,declared,materialStatus:'ok',pointStatus:'ok',...extra};
}
test('Close conserves each currency, returns stock, creates settlement and blocks sales',()=>{
  const f=fixture(),{data,photographer,manager,admin,shift}=f;
  W.sell(data,photographer,shift.id,input({currency:'USD',exchangeRateARS:1500,items:[{productId:'pr2',qty:1,price:12}],received:12}));
  const r=W.close(data,photographer,shift.id,closure(f));
  assert.equal(r.status,'Presentada');assert.equal(r.currencies.USD,12);assert.equal(r.currencyDifferences.USD,0);
  assert.equal(shift.status,'Cerrada por fotógrafo');assert.ok(data.settlements.find(s=>s.shiftId===shift.id));
  assert.throws(()=>W.sell(data,photographer,shift.id,input()),/activa/);
  W.review(data,manager,r.id,{notes:'Stock y caja conciliados'});
  W.review(data,admin,r.id,{notes:'Aprobación final',approve:true});assert.equal(r.status,'Aprobada por administración');
});
test('Differences require observation and cannot be validated as reconciled',()=>{
  const f=fixture(),{data,photographer,manager,shift}=f,c=closure(f);c.declared.ARS-=100;
  const r=W.close(data,photographer,shift.id,c);assert.equal(r.status,'Con diferencia');
  assert.throws(()=>W.review(data,manager,r.id,{notes:'Sin revisar'}),/diferencias/);
  W.review(data,manager,r.id,{notes:'Faltan 100 ARS',observe:true});assert.equal(r.status,'Observada');
});
test('Period lock applies to sales, stock and changes',()=>{
  const {data,photographer,direction,shift}=fixture();data.closedPeriods.push(W.date().slice(0,7));
  assert.throws(()=>W.sell(data,photographer,shift.id,input()),/cerrado/);
  assert.throws(()=>W.stockMovement(data,direction,{productId:'pr2',pointId:'p1',type:'Ingreso de stock',qty:1,reason:'Reposición'}),/cerrado/);
});
test('Transfer conserves inventory and cannot create stock from a negative balance',()=>{
  const {data,direction}=fixture(),before=data.stock.filter(x=>x.productId==='pr2').reduce((n,x)=>n+x.available,0);
  W.stockMovement(data,direction,{productId:'pr2',pointId:'p1',destinationId:'p2',type:'Transferencia',qty:10,reason:'Reposición'});
  assert.equal(data.stock.filter(x=>x.productId==='pr2').reduce((n,x)=>n+x.available,0),before);
  assert.throws(()=>W.stockMovement(data,direction,{productId:'pr2',pointId:'p1',type:'Daño',qty:9999,reason:'Daño'}),/insuficiente/);
});
test('Migration preserves original records and flags unknown historical costs',()=>{
  const {data}=fixture();const historic=data.sales.find(s=>s.id==='v1001');
  assert.equal(historic.total,25000);assert.equal(historic.historicalComplete,false);assert.equal(historic.costARS,undefined);
  const first=JSON.stringify(data);W.migrate(data);assert.equal(JSON.stringify(data),first);
});
test('Positive material differences also require documented administrative authorization',()=>{
  const f=fixture(),{data,photographer,manager,admin,shift}=f,c=closure(f);c.returned.frame+=1;
  const r=W.close(data,photographer,shift.id,c);
  assert.equal(r.status,'Con diferencia');
  assert.throws(()=>W.review(data,manager,r.id,{notes:'Ignorar sobrante'}),/diferencias/);
  assert.throws(()=>W.review(data,manager,r.id,{notes:'Autorizar',authorizeDifferences:true}),/Solo Administración/);
  W.review(data,admin,r.id,{notes:'Sobrante recibido de la jornada anterior, documentado',authorizeDifferences:true});
  W.review(data,manager,r.id,{notes:'Sobrante autorizado y conciliado'});
  W.review(data,admin,r.id,{notes:'Aprobación final con diferencia documentada',approve:true});
  assert.equal(r.stock.find(x=>x.materialId==='frame').difference,1);
  assert.equal(r.differenceAuthorization.userId,admin.id);
});
test('Reviewed commercial agreements enter finance with currency and contract snapshot',()=>{
  const {data,admin,manager}=fixture();
  const record=W.settleAlly(data,admin,{allyId:'a2',month:W.date().slice(0,7),value:10,currency:'USD',exchangeRateARS:1500,reference:'Acuerdo mixto revisado con comprobante'});
  assert.equal(record.totalARS,15000);assert.equal(record.agreementSnapshot.name,'Buenos Aires Bus');
  data.allies.find(a=>a.id==='a2').percentage=99;
  assert.equal(record.agreementSnapshot.percentage,20);
  assert.throws(()=>W.settleAlly(data,manager,{...record}),/Solo Administración/);
});
test('Cash commission cannot consume the photographer opening fund',()=>{
  const f=fixture(),{data,photographer,shift}=f;
  W.sell(data,photographer,shift.id,input({currency:'USD',exchangeRateARS:1500,items:[{productId:'pr2',qty:1,price:12}],received:12}));
  // 25k ARS from the seeded sale is available here; force a foreign-only shift.
  data.sales=data.sales.filter(s=>s.shiftId!==shift.id||s.currency==='USD');
  assert.throws(()=>W.close(data,photographer,shift.id,closure(f,{commissionMethod:'Efectivo'})),/recaudación ARS/);
});
