'use strict';

// Shared business rules for the integrated frontend. Server enforcement remains
// necessary for production; this module also runs under Node for regression tests.
const WBA = (() => {
  const roleNames = {direction:'Dirección', admin:'Administración', manager:'Encargado General', pointManager:'Encargado de Punto', photographer:'Fotógrafo', partner:'Aliado Comercial', auditor:'Auditor'};
  const routeModules = {dashboard:'Dashboard general', usuarios:'Usuarios', puntos:'Puntos de venta', productos:'Productos y precios', jornadas:'Jornadas', ventas:'Ventas', rendiciones:'Rendiciones', stock:'Stock', dispositivos:'Dispositivos', objetivos:'Objetivos', comisiones:'Comisiones', finanzas:'Rentabilidad', reportes:'Reportes', auditoria:'Auditoría', aliados:'Aliados', ajustes:'Solicitudes', fotografo:'Jornadas'};
  const actions = ['view','create','edit','delete','approve','export'];
  const rules = {
"Dirección":{scope:"Acceso total",color:"green",summary:["Total","Total","Permitida con auditoría","Completa"],permissions:{default:["yes","yes","yes","yes","yes","yes"]}},
"Administración":{scope:"Admin + Finanzas",color:"blue",summary:["Amplio","Administrativa/financiera","Solo lógica + notifica Dirección","Completa autorizada"],permissions:{default:["yes","yes","yes","limited","yes","yes"],"Usuarios":["yes","yes","limited","no","no","yes"],"Auditoría":["yes","no","no","no","no","yes"]}},
"Encargado General":{scope:"Operativo total",color:"yellow",summary:["Todos los puntos operativos","Operativa","No permitida","No ve rentabilidad neta"],permissions:{default:["yes","yes","yes","no","limited","yes"],"Usuarios":["limited","no","no","no","no","no"],"Gastos":["no","no","no","no","no","no"],"Rentabilidad":["no","no","no","no","no","no"],"Liquidaciones":["limited","no","no","no","no","no"],"Auditoría":["limited","no","no","no","no","no"],"Aliados":["limited","no","no","no","no","no"]}},
"Encargado de Punto":{scope:"Solo punto asignado",color:"purple",summary:["Punto asignado","Programación y operación","No permitida","No visible"],permissions:{default:["limited","limited","limited","no","no","limited"],"Usuarios":["no","no","no","no","no","no"],"Productos y precios":["limited","no","no","no","no","no"],"Comisiones":["no","no","no","no","no","no"],"Liquidaciones":["no","no","no","no","no","no"],"Gastos":["no","no","no","no","no","no"],"Rentabilidad":["no","no","no","no","no","no"],"Cierres":["limited","no","no","no","no","no"],"Auditoría":["no","no","no","no","no","no"],"Aliados":["no","no","no","no","no","no"]}},
"Fotógrafo":{scope:"Solo información propia",color:"gray",summary:["Personal","Ventas propias en jornada","No permitida","No visible"],permissions:{default:["no","no","no","no","no","no"],"Dashboard general":["limited","no","no","no","no","no"],"Jornadas":["limited","limited","limited","no","no","no"],"Ventas":["limited","yes","limited","no","no","no"],"Rendiciones":["limited","yes","limited","no","no","no"],"Stock":["limited","no","no","no","no","no"],"Objetivos":["limited","no","no","no","no","no"],"Ranking":["limited","no","no","no","no","no"],"Comisiones":["limited","no","no","no","no","no"],"Capacitaciones":["limited","no","no","no","no","no"]}},
"Aliado Comercial":{scope:"Punto asociado externo",color:"gray",summary:["Punto asociado","No edita","No permitida","Solo su comisión"],permissions:{default:["no","no","no","no","no","no"],"Dashboard general":["limited","no","no","no","no","limited"],"Jornadas":["limited","no","no","no","no","limited"],"Ventas":["limited","no","no","no","no","limited"],"Objetivos":["limited","no","no","no","no","limited"],"Aliados":["limited","no","no","no","no","limited"]}}
};
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const clone = value => JSON.parse(JSON.stringify(value));
  const id = prefix => prefix + (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const date = () => { const d=new Date(); return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
  const time = () => new Date().toISOString();
  const amount = value => Math.round(Number(value)*100)/100;
  function permission(user, module, action='view') {
    if (!user || user.status!=='Activo') return false;
    if (user.role==='auditor') return ['view','export'].includes(action) && !['Usuarios','Solicitudes'].includes(module);
    if (module==='Reportes') return ['direction','admin','manager','pointManager','partner'].includes(user.role) && ['view','export'].includes(action);
    if (module==='Solicitudes') return ['direction','admin','manager','pointManager'].includes(user.role) && (['view','create','export'].includes(action) || (action==='approve' && ['direction','admin'].includes(user.role)));
    const rule=rules[roleNames[user.role]];
    const values=rule?.permissions[module] || rule?.permissions.default;
    return ['yes','limited'].includes(values?.[actions.indexOf(action)]);
  }
  function scope(user, pointId) {
    return !!user && (['direction','admin','manager','auditor'].includes(user.role) || user.points?.includes(pointId));
  }
  function own(user, shift) { return scope(user,shift.pointId) && (user.role!=='photographer' || shift.photographerId===user.id); }
  function requirePermission(user,module,action,pointId) {
    check(permission(user,module,action),'Tu rol no permite esta acción.');
    if (pointId) check(scope(user,pointId),'El punto no está asignado a tu usuario.');
  }
  function openPeriod(data,day=date()) { check(!data.closedPeriods?.includes(day.slice(0,7)), 'El período está cerrado. Se requiere un ajuste administrativo.'); }
  function audit(data,user,action,entity,before,after,reason) {
    data.audit.unshift({id:id('au'),datetime:time(),userId:user.id,role:user.role,action,entity,before:typeof before==='string'?before:JSON.stringify(before),after:typeof after==='string'?after:JSON.stringify(after),reason});
  }
  const materials = [{id:'frame',name:'Portarretratos',expected:30},{id:'sticker',name:'Stickers',expected:40},{id:'paper',name:'Hojas',expected:50},{id:'glue',name:'Voligoma',expected:2}];
  function migrate(data) {
    data.adjustments ??= []; data.incidents ??= []; data.notifications ??= []; data.closedPeriods ??= [];
    data.materials ??= clone(materials);
    data.materialStock ??= data.points.flatMap(p=>materials.map(m=>({pointId:p.id,materialId:m.id,available:300})));
    data.materialMovements ??= []; data.deviceHistory ??= []; data.settlements ??= [];data.allySettlements??=[];
    for (const p of data.points) {
      p.productIds ??= data.products.filter(x=>x.active).map(x=>x.id);
      p.currencies ??= ['ARS','USD','BRL','EUR','CLP','UYU','PEN','MXN'];
      p.payments ??= ['Efectivo','Transferencia','Tarjeta de crédito','Tarjeta de débito','Mercado Pago','QR'];
      p.exchangeRates ??= {ARS:1,USD:1500,BRL:300};
      p.prices ??= {pr2:{ARS:18000,USD:12,BRL:50}};
      p.minimums ??= {cash:15000,transfer:15000,card:16000};
      p.instructions ??= 'Verificar stock, equipos y condiciones del punto antes de iniciar.';
    }
    for (const p of data.products) {
      p.recipe ??= p.stock ? {frame:p.id==='pr4'?3:1,sticker:p.id==='pr4'?3:1,paper:p.id==='pr4'?6:2} : {};
      p.priceHistory ??= [];
    }
    // Historical records are never retroactively priced from today's catalog.
    for (const s of data.sales) {
      s.totalARS ??= s.currency==='ARS'?s.total:null;
      s.exchangeRateARS ??= s.currency==='ARS'?1:null;
      s.historicalComplete ??= false;
    }
    for (const s of data.shifts) {
      s.materialAssignment ??= {};
      s.materialConsumed ??= {};
      s.deviceIds ??= data.devices.filter(d=>d.responsibleId===s.photographerId&&d.pointId===s.pointId).map(d=>d.id);
      s.toolsConfirmed ??= false;
      s.cashOpeningARS ??= null;
    }
    data.schemaVersion=2;
    return data;
  }
  function incident(data,user,shift,category,detail) {
    const record={id:id('inc'),datetime:time(),shiftId:shift.id,pointId:shift.pointId,userId:user.id,category,detail,status:'Pendiente'};
    data.incidents.unshift(record);
    data.notifications.unshift({id:id('nt'),datetime:time(),pointId:shift.pointId,shiftId:shift.id,text:`${category}: ${detail}`,recipient:'manager',read:false});
    return record;
  }
  function assignMaterials(data,user,shift,assignment) {
    requirePermission(user,'Stock','create',shift.pointId); openPeriod(data,shift.date);
    check(Object.keys(shift.materialAssignment).length===0,'Esta jornada ya tiene material asignado.');
    for (const [materialId,qty] of Object.entries(assignment)) {
      const row=data.materialStock.find(x=>x.pointId===shift.pointId&&x.materialId===materialId);
      check(row && Number.isInteger(qty) && qty>=0 && row.available>=qty,'Stock de materiales insuficiente o cantidad inválida.');
    }
    for (const [materialId,qty] of Object.entries(assignment)) {
      data.materialStock.find(x=>x.pointId===shift.pointId&&x.materialId===materialId).available-=qty;
      data.materialMovements.unshift({id:id('mm'),datetime:time(),pointId:shift.pointId,shiftId:shift.id,materialId,qty,type:'Asignación a jornada',userId:user.id});
    }
    shift.materialAssignment=clone(assignment);
    audit(data,user,'Asignó materiales',`Jornada ${shift.id}`,'-',assignment,'Preparación de jornada');
  }
  function start(data,user,shiftId,input) {
    const s=data.shifts.find(x=>x.id===shiftId);
    check(s && own(user,s),'Jornada no disponible.'); requirePermission(user,'Jornadas','edit',s.pointId); openPeriod(data,s.date);
    check(s.status==='Programada' && s.date===date(),'Solo puede iniciarse una jornada programada para hoy.');
    check(data.points.find(p=>p.id===s.pointId)?.status==='Activo','El punto no está activo.');
    check(!data.shifts.some(x=>x.id!==s.id&&x.photographerId===s.photographerId&&['En curso','Iniciada'].includes(x.status)),'El fotógrafo ya tiene una jornada activa.');
    check(input.stockAck && input.instructionAck,'Confirmá stock e indicaciones diarias.');
    check(input.location?.status==='verified'||(input.location?.status==='exception'&&input.location.reason?.trim()),'Validá ubicación o registrá una excepción con motivo.');
    check(Object.keys(s.materialAssignment).length>0,'El encargado debe asignar los materiales antes del inicio.');
    for (const key of Object.keys(s.materialAssignment)) check(Number.isInteger(input.received[key])&&input.received[key]>=0&&input.received[key]<=s.materialAssignment[key],'Cantidad recibida inválida. Los sobrantes requieren asignación del encargado.');
    s.materialReceived=clone(input.received); s.location=clone(input.location); s.startedAt=time(); s.status='En curso';
    if (input.location.status==='exception') incident(data,user,s,'Ubicación',input.location.reason);
    const missing=Object.keys(s.materialAssignment).filter(k=>input.received[k]!==s.materialAssignment[k]);
    if(missing.length) incident(data,user,s,'Stock inicial',missing.map(k=>`${k}: asignado ${s.materialAssignment[k]}, recibido ${input.received[k]}`).join('; '));
    audit(data,user,'Inició jornada',`Jornada ${s.id}`,'Programada',s.status,'Stock e instrucciones confirmados');
    return s;
  }
  function prepare(data,user,shiftId,input) {
    const s=data.shifts.find(x=>x.id===shiftId);
    check(s&&own(user,s),'Jornada no disponible.'); requirePermission(user,'Jornadas','edit',s.pointId); openPeriod(data,s.date);
    check(['En curso','Iniciada'].includes(s.status),'La jornada no está activa.');
    check(!s.toolsConfirmed,'El material inicial ya fue confirmado.');
    check(Object.keys(s.materialAssignment).length>0,'El encargado debe asignar materiales antes de confirmar la recepción.');
    for (const deviceId of s.deviceIds) {
      const v=input.tools[deviceId];
      check(v&&['received','missing'].includes(v.status),'Confirmá cada equipo asignado.');
      check(v.status!=='missing'||v.detail?.trim(),'Detallá los equipos faltantes.');
    }
    check(Number.isFinite(input.cashOpeningARS)&&input.cashOpeningARS>=0,'Informá un fondo de caja válido, incluso si es cero.');
    s.toolChecks=clone(input.tools); s.toolsConfirmed=true; s.cashOpeningARS=input.cashOpeningARS;
    s.materialReceived ??= clone(s.materialAssignment);
    for(const [deviceId,v] of Object.entries(input.tools)) if(v.status==='missing') incident(data,user,s,'Equipo faltante',`${deviceId}: ${v.detail}`);
    audit(data,user,'Confirmó material y abrió caja',`Jornada ${s.id}`,'Pendiente',{tools:input.tools,cash:s.cashOpeningARS},'Verificación inicial');
  }
  const activeSales=(data,shiftId)=>data.sales.filter(x=>x.shiftId===shiftId&&x.status!=='Anulada');
  function cash(data,s) {
    const balances={ARS:Number(s.cashOpeningARS||0)};
    for(const v of activeSales(data,s.id).filter(v=>v.payment==='Efectivo'&&v.status==='Cobrada')) {
      balances[v.currency]=(balances[v.currency]||0)+(v.currency==='ARS'?v.total:Number(v.received??v.total));
      if(v.currency!=='ARS') balances.ARS-=v.changeARS||0;
    }
    return balances;
  }
  function quote(data,shift,input) {
    const point=data.points.find(x=>x.id===shift.pointId);
    check(point&&point.status==='Activo','El punto no está activo.');
    check(point.payments.includes(input.payment)&&point.currencies.includes(input.currency),'Medio de pago o moneda no habilitados en el punto.');
    const rate=input.currency==='ARS'?1:Number(input.exchangeRateARS);
    check(Number.isFinite(rate)&&rate>0,'Se requiere una cotización válida.');
    check(input.items?.length>0,'Agregá al menos un producto.');
    const seen=new Set();
    const items=input.items.map(item=>{
      const p=data.products.find(x=>x.id===item.productId);
      check(p?.active&&point.productIds.includes(p.id),'Producto no habilitado para este punto.');
      check(!seen.has(p.id),'Consolidá la cantidad del mismo producto en una sola línea.'); seen.add(p.id);
      check(Number.isInteger(item.qty)&&item.qty>0,'La cantidad debe ser un entero positivo.');
      const price=Number(item.price);
      check(Number.isFinite(price)&&price>0,'Precio inválido.');
      const method=input.payment.startsWith('Tarjeta')?'card':input.payment==='Efectivo'?'cash':'transfer';
      const minimum=p.minimums?.[method] ?? Math.min(p.price,point.minimums[method]);
      check(price*rate+0.01>=minimum,`Precio menor al mínimo autorizado (${minimum} ARS) para ${p.name}.`);
      return {productId:p.id,name:p.name,qty:item.qty,price,costARS:p.cost,commissionRate:point.commission/100,listPriceARS:point.prices?.[p.id]?.ARS??p.price,minimumARS:minimum,recipe:clone(p.recipe),stock:p.stock};
    });
    const total=amount(items.reduce((n,i)=>n+i.price*i.qty,0));
    return {items,total,totalARS:amount(total*rate),exchangeRateARS:rate,commission:amount(total*rate*point.commission/100),costARS:amount(items.reduce((n,i)=>n+i.costARS*i.qty,0))};
  }
  function sell(data,user,shiftId,input) {
    const s=data.shifts.find(x=>x.id===shiftId);
    check(s&&own(user,s),'Jornada fuera de tu alcance.'); requirePermission(user,'Ventas','create',s.pointId); openPeriod(data,s.date);
    check(s.date===date()&&['En curso','Iniciada'].includes(s.status),'Se necesita una jornada activa de hoy.');
    check(s.toolsConfirmed&&s.cashOpeningARS!==null,'Confirmá equipos y abrí caja antes de vender.');
    const q=quote(data,s,input); const consumed={};
    for(const i of q.items) {
      if(i.stock) {
        const row=data.stock.find(x=>x.productId===i.productId&&x.pointId===s.pointId);
        check(row&&row.available>=i.qty,`Stock insuficiente de ${i.name}.`);
      }
      for(const [key,qty] of Object.entries(i.recipe)) consumed[key]=(consumed[key]||0)+qty*i.qty;
    }
    for(const [key,qty] of Object.entries(consumed)) check((s.materialReceived?.[key]||0)-(s.materialConsumed[key]||0)>=qty,`Material insuficiente: ${key}.`);
    check(['Cobrada','Pendiente de cobro'].includes(input.status),'Estado de venta inválido.');
    let changeARS=0,received=null;
    if(input.payment==='Efectivo') {
      check(input.status==='Cobrada','Las ventas en efectivo deben estar cobradas.');
      received=Number(input.received);
      check(Number.isFinite(received)&&received>=q.total,'El importe recibido no alcanza para la venta.');
      if(input.currency!=='ARS') {
        changeARS=amount((received-q.total)*q.exchangeRateARS);
        check(cash(data,s).ARS>=changeARS,'No hay pesos suficientes para entregar el vuelto.');
      }
    }
    const v={id:id('v'),datetime:time(),shiftId:s.id,photographerId:s.photographerId,pointId:s.pointId,...q,currency:input.currency,payment:input.payment,status:input.status,received,changeARS,notes:input.notes||'',discount:amount(q.items.reduce((n,i)=>n+Math.max(0,i.listPriceARS/q.exchangeRateARS-i.price)*i.qty,0)),discountARS:amount(q.items.reduce((n,i)=>n+Math.max(0,i.listPriceARS-i.price*q.exchangeRateARS)*i.qty,0)),surcharge:amount(q.items.reduce((n,i)=>n+Math.max(0,i.price-i.listPriceARS/q.exchangeRateARS)*i.qty,0)),historicalComplete:true,materialConsumption:consumed};
    for(const i of q.items) if(i.stock) {
      const row=data.stock.find(x=>x.productId===i.productId&&x.pointId===s.pointId);
      row.available-=i.qty; row.sold+=i.qty;
      data.stockMovements.unshift({id:id('m'),datetime:time(),productId:i.productId,pointId:s.pointId,shiftId:s.id,saleId:v.id,qty:i.qty,type:'Venta',origin:getPointName(data,s.pointId),destination:v.id,userId:user.id,status:'Confirmado',reason:'Venta registrada'});
    }
    for(const [key,qty] of Object.entries(consumed)) {
      s.materialConsumed[key]=(s.materialConsumed[key]||0)+qty;
      data.materialMovements.unshift({id:id('mm'),datetime:time(),pointId:s.pointId,shiftId:s.id,saleId:v.id,materialId:key,qty,type:'Consumo por venta',userId:user.id});
    }
    data.sales.unshift(v);
    const r=data.renditions.find(x=>x.shiftId===s.id);
    if(r&&r.status==='Pendiente') {r.expected=activeSales(data,s.id).reduce((n,x)=>n+(x.totalARS||0),0);r.difference=r.declared-r.expected;}
    audit(data,user,'Registró venta',`Venta ${v.id}`,'-',v,'Operación comercial');
    return v;
  }
  const getPointName=(data,pointId)=>data.points.find(x=>x.id===pointId)?.name||pointId;
  function request(data,user,saleId,reason) {
    const sale=data.sales.find(x=>x.id===saleId);
    check(sale&&scope(user,sale.pointId),'Venta no disponible.'); requirePermission(user,'Solicitudes','create',sale.pointId); openPeriod(data,sale.datetime.slice(0,10));
    check(reason?.trim(),'El motivo es obligatorio.'); check(sale.status!=='Anulada','La venta ya está anulada.');
    check(!data.adjustments.some(x=>x.saleId===saleId&&x.status==='Solicitada'),'Ya existe una solicitud pendiente para esta venta.');
    const r={id:id('aj'),saleId,pointId:sale.pointId,requestedBy:user.id,datetime:time(),reason:reason.trim(),status:'Solicitada',type:'Anular venta',snapshot:JSON.stringify(sale)};
    data.adjustments.unshift(r); audit(data,user,'Solicitó anulación',`Solicitud ${r.id}`,'-',r,'Pendiente de aprobación administrativa');
    return r;
  }
  function resolve(data,user,requestId,approve,reason) {
    requirePermission(user,'Solicitudes','approve');
    const r=data.adjustments.find(x=>x.id===requestId); check(r?.status==='Solicitada','La solicitud ya fue resuelta.');
    check(r.requestedBy!==user.id,'La solicitud debe ser revisada por otra persona.');
    check(reason?.trim(),'Documentá el motivo de aprobación o rechazo.');
    const sale=data.sales.find(x=>x.id===r.saleId); openPeriod(data,sale.datetime.slice(0,10));
    check(sale&&JSON.stringify(sale)===r.snapshot,'La venta cambió desde la solicitud. Revisá y volvé a solicitar el ajuste.');
    if(approve) annul(data,user,sale.id,reason);
    r.status=approve?'Aplicada':'Rechazada';r.resolvedBy=user.id;r.resolvedAt=time();r.resolutionReason=reason;
    data.notifications.unshift({id:id('nt'),datetime:time(),recipient:'direction',pointId:r.pointId,text:`${r.type} ${r.status.toLowerCase()}: ${r.saleId}`,read:false});
    audit(data,user,approve?'Aprobó ajuste':'Rechazó ajuste',`Solicitud ${r.id}`,'Solicitada',r.status,reason);
  }
  function annul(data,user,saleId,reason) {
    check(['direction','admin'].includes(user.role),'Solo Dirección o Administración puede anular ventas.');
    const sale=data.sales.find(x=>x.id===saleId); check(sale&&scope(user,sale.pointId),'Venta no disponible.');
    openPeriod(data,sale.datetime.slice(0,10)); check(reason?.trim(),'El motivo es obligatorio.');
    check(sale.status!=='Anulada','La venta ya está anulada.');
    const s=data.shifts.find(x=>x.id===sale.shiftId);
    check(s&&['En curso','Iniciada'].includes(s.status),'No se puede anular una venta de una jornada cerrada. Requiere ajuste de la rendición.');
    if(sale.payment==='Efectivo') check(cash(data,s)[sale.currency]>=(sale.currency==='ARS'?sale.total:Number(sale.received??sale.total)),'Efectivo insuficiente para reintegrar y revertir la venta.');
    const before=clone(sale); sale.status='Anulada';sale.annulledAt=time();sale.annulledBy=user.id;sale.annulmentReason=reason;
    for(const i of sale.items) {
      const p=data.products.find(x=>x.id===i.productId);
      if(i.stock ?? p?.stock) {
        const row=data.stock.find(x=>x.productId===i.productId&&x.pointId===sale.pointId);
        if(row) {row.available+=i.qty;row.sold-=i.qty;}
        data.stockMovements.unshift({id:id('m'),datetime:time(),productId:i.productId,pointId:s.pointId,shiftId:s.id,saleId,qty:i.qty,type:'Reversión por anulación',origin:saleId,destination:getPointName(data,s.pointId),userId:user.id,status:'Confirmado',reason});
      }
    }
    for(const [key,qty] of Object.entries(sale.materialConsumption||{})) {
      s.materialConsumed[key]-=qty;
      data.materialMovements.unshift({id:id('mm'),datetime:time(),pointId:s.pointId,shiftId:s.id,saleId,materialId:key,qty,type:'Reversión por anulación',userId:user.id});
    }
    audit(data,user,'Anuló venta',`Venta ${saleId}`,before,sale,reason);
  }
  function close(data,user,shiftId,input) {
    const s=data.shifts.find(x=>x.id===shiftId);
    check(s&&own(user,s),'Jornada no disponible.'); requirePermission(user,'Rendiciones','create',s.pointId); openPeriod(data,s.date);
    check(['En curso','Iniciada'].includes(s.status)&&s.toolsConfirmed&&s.cashOpeningARS!==null,'Prepará material y caja antes de cerrar la jornada.');
    const sales=activeSales(data,s.id),balances=cash(data,s),commission=amount(sales.filter(v=>v.status==='Cobrada').reduce((n,v)=>n+v.commission,0));
    const contract=data.points.find(p=>p.id===s.pointId)?.advanced;
    if(contract?.activeAgreement==='unit'&&contract.values.requestUnitAtClose&&!contract.values.allowCloseWithoutUnit)check(Number.isInteger(input.unitsReported)&&input.unitsReported>=0,'Informá tickets o pasajeros para el acuerdo comercial.');
    const businessARS=amount(balances.ARS-s.cashOpeningARS);
    check(['Efectivo','Transferencia'].includes(input.commissionMethod),'Elegí la forma de cobro de comisión.');
    check(input.commissionMethod!=='Efectivo'||businessARS>=commission,'La recaudación ARS no alcanza para pagar la comisión; seleccioná transferencia.');
    check(['ok','issue'].includes(input.materialStatus)&&['ok','issue'].includes(input.pointStatus),'Informá el estado final de material y punto.');
    check(input.materialStatus!=='issue'||input.materialDetail?.trim(),'Detallá el problema con los equipos.');
    check(input.pointStatus!=='issue'||input.pointDetail?.trim(),'Detallá el problema del punto.');
    const stock=[];
    for(const [key,initial] of Object.entries(s.materialReceived||{})) {
      const used=key==='glue'?Number(input.glueUsed):(s.materialConsumed[key]||0);
      check(Number.isFinite(used)&&used>=0&&used<=initial,'Consumo de material inválido.');
      const actual=input.returned[key];
      check(Number.isInteger(actual)&&actual>=0,'Completá todas las cantidades devueltas.');
      stock.push({materialId:key,initial,consumed:used,expected:initial-used,actual,difference:actual-(initial-used)});
    }
    const expected={...balances}; expected.ARS=amount(Math.max(0,businessARS)-(input.commissionMethod==='Efectivo'?commission:0));
    const differences={};
    for(const [currency,value] of Object.entries(expected)) {
      check(Number.isFinite(input.declared[currency])&&input.declared[currency]>=0,`Declaración de caja inválida: ${currency}.`);
      differences[currency]=amount(input.declared[currency]-value);
    }
    const observed=stock.some(x=>x.difference!==0)||Object.values(differences).some(x=>x!==0)||input.materialStatus==='issue'||input.pointStatus==='issue';
    const r={id:id('r'),shiftId:s.id,closedAt:time(),expected:sales.filter(v=>v.status==='Cobrada').reduce((n,v)=>n+v.totalARS,0),declared:input.declared.ARS,difference:differences.ARS,currencies:expected,declaredCurrencies:clone(input.declared),currencyDifferences:differences,openingCashARS:s.cashOpeningARS,openingRecoveredARS:Math.min(s.cashOpeningARS,Math.max(0,balances.ARS)),reimbursementARS:Math.max(0,-businessARS),commission,commissionMethod:input.commissionMethod,stock,stockReturned:stock.reduce((n,x)=>n+x.actual,0),stockMissing:stock.reduce((n,x)=>n+Math.max(0,-x.difference),0),equipmentReturned:input.materialStatus==='ok',materialStatus:input.materialStatus,materialDetail:input.materialDetail,pointStatus:input.pointStatus,pointDetail:input.pointDetail,photographerNotes:input.notes||'',managerNotes:'',status:observed?'Con diferencia':'Presentada',pendingSales:sales.filter(v=>v.status==='Pendiente de cobro').map(v=>v.id)};
    const old=data.renditions.findIndex(x=>x.shiftId===s.id);
    r.unitsReported=Number.isInteger(input.unitsReported)?input.unitsReported:null;
    if(old>=0)data.renditions[old]=r;else data.renditions.unshift(r);
    for(const x of stock) {
      const row=data.materialStock.find(x2=>x2.pointId===s.pointId&&x2.materialId===x.materialId);
      if(row)row.available+=x.actual;
      data.materialMovements.unshift({id:id('mm'),datetime:time(),pointId:s.pointId,shiftId:s.id,materialId:x.materialId,qty:x.actual,type:'Devolución de jornada',userId:user.id});
    }
    s.status='Cerrada por fotógrafo';s.closedAt=r.closedAt;
    for(const d of data.devices.filter(x=>s.deviceIds.includes(x.id))) {
      d.status=input.materialStatus==='ok'?'Disponible':'En revisión';d.responsibleId=null;
      data.deviceHistory.unshift({id:id('dh'),datetime:time(),deviceId:d.id,shiftId:s.id,action:'Devolución',userId:user.id,status:d.status});
    }
    data.settlements.unshift({id:id('liq'),shiftId:s.id,photographerId:s.photographerId,pointId:s.pointId,commission,method:input.commissionMethod,status:'Pendiente de validación',createdAt:time()});
    if(observed)incident(data,user,s,'Cierre observado','Diferencias de caja, stock o estado operativo.');
    audit(data,user,'Presentó rendición',`Rendición ${r.id}`,'En curso',r,'Cierre de jornada');
    return r;
  }
  function review(data,user,renditionId,input) {
    const r=data.renditions.find(x=>x.id===renditionId),s=r&&data.shifts.find(x=>x.id===r.shiftId);
    check(s&&scope(user,s.pointId),'Rendición no disponible.'); requirePermission(user,'Rendiciones','edit',s.pointId);openPeriod(data,s.date);
    check(input.notes?.trim(),'Registrá el motivo de la revisión.');
    if(input.authorizeDifferences){
      check(['direction','admin'].includes(user.role),'Solo Administración autoriza diferencias documentadas.');
      check(['Con diferencia','Observada'].includes(r.status),'La rendición no tiene una observación pendiente.');
      r.differenceAuthorization={userId:user.id,at:time(),notes:input.notes};
      audit(data,user,'Autorizó diferencia documentada',`Rendición ${r.id}`,'Sin autorización',r.differenceAuthorization,input.notes);return;
    }
    if(input.approve) {
      check(['direction','admin'].includes(user.role),'Solo Administración o Dirección aprueba el cierre final.');
      check(r.status==='Validada por encargado','El encargado debe validar primero.');
      check(!r.pendingSales?.length,'Hay ventas pendientes de cobro.');
      r.status='Aprobada por administración';
    } else {
      check(['direction','admin','manager','pointManager'].includes(user.role),'No podés validar rendiciones.');
      check(['Presentada','Con diferencia','Observada'].includes(r.status),'La rendición no está presentada o ya fue validada.');
      if(!input.observe) check(r.differenceAuthorization||(!Object.values(r.currencyDifferences||{}).some(x=>x!==0)&&!r.stock?.some(x=>x.difference!==0)&&!r.stockMissing&&r.materialStatus==='ok'&&r.pointStatus==='ok'),'La rendición tiene diferencias; registrá una observación y solicitá autorización administrativa.');
      r.status=input.observe?'Observada':'Validada por encargado';
    }
    r.managerNotes=input.notes;s.status=r.status;
    const l=data.settlements.find(x=>x.shiftId===s.id);if(l)l.status=input.approve?'Aprobada':r.status==='Validada por encargado'?'Validada por encargado':'Observada';
    audit(data,user,input.approve?'Aprobó rendición':'Revisó rendición',`Rendición ${r.id}`,'Presentada',r.status,input.notes);
  }
  function schedule(data,user,input) {
    requirePermission(user,'Jornadas','create',input.pointId);openPeriod(data,input.date);
    const point=data.points.find(p=>p.id===input.pointId),photographer=data.users.find(u=>u.id===input.photographerId);
    check(point?.status==='Activo'&&photographer?.role==='photographer'&&photographer.status==='Activo','Punto o fotógrafo no disponibles.');
    check(photographer.points.includes(point.id),'El fotógrafo no tiene asignado este punto.');
    check(input.date>=date()&&input.start<input.end,'Fecha u horario inválidos.');
    check(Number.isInteger(input.target)&&input.target>0,'Objetivo inválido.');
    check(!data.shifts.some(s=>s.photographerId===photographer.id&&s.date===input.date&&input.start<s.end&&input.end>s.start),'El fotógrafo tiene otra jornada en ese horario.');
    const day=point.advanced?.schedule?.[(new Date(input.date+'T12:00:00').getDay()+6)%7];
    if(day){
      check(day.operates,'El punto no opera ese día.');
      const configured=day.shiftCount==='2'?[[day.shift1Start,day.shift1End],[day.shift2Start,day.shift2End]]:[[day.shift1Start||day.open,day.shift1End||day.close]];
      const valid=configured.some(([start,end])=>input.start>=start&&input.end<=end) || (point.advanced.values.allowFullShift && input.start>=day.open && input.end<=day.close);
      check(valid || (point.advanced.values.allowScheduleOverride && input.overrideReason?.trim()),'Horario fuera de los turnos configurados; se requiere una excepción autorizada con motivo.');
      if(!point.advanced.values.allowMultiplePhotographers)check(!data.shifts.some(s=>s.pointId===point.id&&s.date===input.date&&input.start<s.end&&input.end>s.start),'El punto no admite varios fotógrafos simultáneos.');
    }
    const deviceIds=input.deviceIds||[];
    for(const deviceId of deviceIds){const d=data.devices.find(d=>d.id===deviceId);check(d&&['Disponible','Devuelto'].includes(d.status),'Equipo no disponible.');check(!data.shifts.some(s=>['Programada','En curso','Iniciada'].includes(s.status)&&s.deviceIds.includes(deviceId)),'El equipo ya está reservado para otra jornada.');}
    const shift={id:id('j'),date:input.date,photographerId:photographer.id,pointId:point.id,start:input.start,end:input.end,managerId:user.id,target:input.target,stockAssigned:Object.values(input.assignment).reduce((a,b)=>a+b,0),weather:input.weather||'Sin informar',status:'Programada',notes:input.notes||'',overrideReason:input.overrideReason||'',deviceIds,materialAssignment:{},materialConsumed:{},toolsConfirmed:false,cashOpeningARS:null};
    data.shifts.unshift(shift);assignMaterials(data,user,shift,input.assignment);
    for(const deviceId of deviceIds){const d=data.devices.find(d=>d.id===deviceId);d.status='Asignado';d.responsibleId=photographer.id;d.pointId=point.id;data.deviceHistory.unshift({id:id('dh'),datetime:time(),deviceId,shiftId:shift.id,action:'Asignación',userId:user.id,status:'Asignado'});}
    audit(data,user,'Programó jornada',shift.id,'-',shift,'Asignación operativa');return shift;
  }
  function stockMovement(data,user,input) {
    requirePermission(user,'Stock','create',input.pointId);openPeriod(data);
    check(Number.isInteger(input.qty)&&input.qty>0&&input.reason?.trim(),'Cantidad y motivo obligatorios.');
    check(['Ingreso de stock','Transferencia','Daño','Baja','Devolución'].includes(input.type),'Tipo de movimiento inválido.');
    if(['Baja','Devolución'].includes(input.type))check(['direction','admin'].includes(user.role),'Esta operación requiere Administración.');
    const material=!!input.materialId,key=material?'materialId':'productId',itemId=input[key],rows=material?data.materialStock:data.stock;
    check((material?data.materials:data.products).some(x=>x.id===itemId),'Artículo no encontrado.');
    let row=rows.find(x=>x[key]===itemId&&x.pointId===input.pointId);
    if(!row){row={pointId:input.pointId,[key]:itemId,available:0,assigned:0,sold:0,damaged:0};rows.push(row);}
    if(['Transferencia','Daño','Baja'].includes(input.type))check(row.available>=input.qty,'Stock insuficiente.');
    if(input.type==='Transferencia'){
      check(input.destinationId!==input.pointId&&data.points.some(p=>p.id===input.destinationId),'Seleccioná otro punto de destino.');
      check(scope(user,input.destinationId),'Destino fuera de tu alcance.');
      let target=rows.find(x=>x[key]===itemId&&x.pointId===input.destinationId);
      if(!target){target={pointId:input.destinationId,[key]:itemId,available:0,assigned:0,sold:0,damaged:0};rows.push(target);}
      row.available-=input.qty;target.available+=input.qty;
    }else if(['Daño','Baja'].includes(input.type)){row.available-=input.qty;row.damaged=(row.damaged||0)+(input.type==='Daño'?input.qty:0);}
    else row.available+=input.qty;
    const record={id:id('m'),datetime:time(),...input,userId:user.id,status:'Confirmado',origin:getPointName(data,input.pointId),destination:input.destinationId?getPointName(data,input.destinationId):input.type};
    (material?data.materialMovements:data.stockMovements).unshift(record);audit(data,user,'Registró movimiento',record.id,'-',record,input.reason);return record;
  }
  function collect(data,user,saleId,reason) {
    check(['direction','admin'].includes(user.role),'El cobro debe confirmarlo Administración.');
    const sale=data.sales.find(x=>x.id===saleId);check(sale?.status==='Pendiente de cobro','La venta no está pendiente.');openPeriod(data,sale.datetime.slice(0,10));check(reason?.trim(),'Registrá la referencia del cobro.');
    sale.status='Cobrada';sale.collectedAt=time();sale.collectionReference=reason;
    const r=data.renditions.find(r=>r.shiftId===sale.shiftId);
    if(r){r.pendingSales=(r.pendingSales||[]).filter(id=>id!==saleId);r.commission=(r.commission||0)+sale.commission;const l=data.settlements.find(x=>x.shiftId===sale.shiftId);if(l){l.commission=r.commission;l.status='Pendiente de validación';}if(r.closedAt){r.status='Observada';r.managerNotes='Cobro posterior al cierre: revisar comisión adicional.';data.shifts.find(s=>s.id===sale.shiftId).status='Observada';}}
    audit(data,user,'Confirmó cobro',sale.id,'Pendiente de cobro','Cobrada',reason);
  }
  function closePeriod(data,user,month) {
    check(['direction','admin'].includes(user.role),'Solo Administración o Dirección puede cerrar el período.');
    check(/^\d{4}-\d{2}$/.test(month)&&month<=date().slice(0,7),'Período inválido.');
    check(!data.closedPeriods.includes(month),'El período ya está cerrado.');
    const shifts=data.shifts.filter(s=>s.date.startsWith(month));
    check(shifts.every(s=>s.status==='Aprobada por administración'),'Hay jornadas sin aprobación administrativa.');
    check(!data.sales.some(s=>s.datetime.startsWith(month)&&['Pendiente de cobro','Observada'].includes(s.status)),'Hay cobros pendientes u observados.');
    check(!data.adjustments.some(r=>r.status==='Solicitada'&&data.sales.find(s=>s.id===r.saleId)?.datetime.startsWith(month)),'Hay solicitudes de ajuste pendientes.');
    check(!data.settlements.some(l=>shifts.some(s=>s.id===l.shiftId)&&l.status!=='Pagada'),'Hay liquidaciones sin pagar.');
    check(data.allies.filter(a=>a.status==='Activo'&&(!a.validFrom||a.validFrom.slice(0,7)<=month)&&(!a.validTo||a.validTo.slice(0,7)>=month)).every(a=>data.allySettlements.some(l=>l.allyId===a.id&&l.month===month&&l.status==='Aprobada')),'Hay acuerdos comerciales sin liquidación revisada para el período.');
    data.closedPeriods.push(month);if(month===data.company.currentMonth)data.company.monthlyStatus='Cerrado';audit(data,user,'Cerró período mensual',month,'Abierto','Cerrado','Controles administrativos completos');
  }
  function settleAlly(data,user,input) {
    check(['direction','admin'].includes(user.role),'Solo Administración o Dirección revisa liquidaciones comerciales.');
    const ally=data.allies.find(a=>a.id===input.allyId);check(ally,'Aliado no encontrado.');openPeriod(data,input.month+'-01');
    check(/^\d{4}-\d{2}$/.test(input.month)&&Number.isFinite(input.value)&&input.value>=0,'Período o importe inválidos.');
    check(Number.isFinite(input.exchangeRateARS)&&input.exchangeRateARS>0,'Cotización inválida.');
    check(input.reference?.trim(),'Documentá el cálculo revisado y su referencia.');
    const existing=data.allySettlements.find(l=>l.allyId===ally.id&&l.month===input.month);
    const record={id:existing?.id||id('la'),...input,totalARS:amount(input.value*input.exchangeRateARS),status:'Aprobada',reviewedBy:user.id,reviewedAt:time(),agreementSnapshot:clone(ally)};
    if(existing)Object.assign(existing,record);else data.allySettlements.push(record);
    audit(data,user,'Revisó liquidación comercial',record.id,existing?'Revisión anterior':'-',record,input.reference);return record;
  }
  function transaction(data,command,...args) { const next=clone(data); const result=command(next,...args); return {data:next,result}; }
  return {rules,roleNames,routeModules,actions,materials,permission,scope,own,requirePermission,openPeriod,migrate,clone,id,date,time,amount,audit,incident,assignMaterials,start,prepare,quote,sell,cash,request,resolve,annul,close,review,schedule,stockMovement,collect,closePeriod,settleAlly,transaction};
})();
if(typeof module!=='undefined') module.exports=WBA;
