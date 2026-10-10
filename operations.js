'use strict';

// Integrated screens consume the same state and the rules extracted from the
// advanced prototypes. Originals remain unchanged as functional references.
function visibleData() {
  const d=state.data,u=currentUser();
  if(!u)return d;
  const module=WBA.routeModules[state.route],specialOnly=module&&!WBA.permission(u,module,'view');
  const pointScope=id=>WBA.scope(u,id)&&(!specialOnly||(d.specialPermissions||[]).some(g=>g.userId===u.id&&g.module===module&&g.action==='view'&&g.pointId===id&&g.expires>=today()));
  const points=d.points.filter(p=>pointScope(p.id));
  const shifts=d.shifts.filter(s=>WBA.own(u,s)&&pointScope(s.pointId));
  const ids=new Set(shifts.map(s=>s.id));
  return {...d,points,shifts,sales:d.sales.filter(s=>ids.has(s.shiftId)),renditions:d.renditions.filter(r=>ids.has(r.shiftId)),stock:d.stock.filter(s=>WBA.scope(u,s.pointId)),materialStock:d.materialStock.filter(s=>WBA.scope(u,s.pointId)),materialMovements:d.materialMovements.filter(s=>WBA.scope(u,s.pointId)),devices:d.devices.filter(s=>WBA.scope(u,s.pointId)||(s.responsibleId===u.id)),stockMovements:d.stockMovements.filter(s=>s.pointId?WBA.scope(u,s.pointId):['direction','admin','manager','auditor'].includes(u.role)),expenses:d.expenses.filter(s=>WBA.scope(u,s.pointId)),adjustments:d.adjustments.filter(s=>WBA.scope(u,s.pointId)),allies:d.allies.filter(s=>s.pointIds.some(p=>WBA.scope(u,p))),incidents:d.incidents.filter(s=>WBA.scope(u,s.pointId)&&(u.role!=='photographer'||s.userId===u.id)),settlements:d.settlements.filter(s=>WBA.scope(u,s.pointId)&&(u.role!=='photographer'||s.photographerId===u.id))};
}
function can(module,action='view') {
  const u=currentUser();
  return WBA.permission(u,module,action)||!!u&&(state.data.specialPermissions||[]).some(g=>g.userId===u.id&&g.module===module&&g.action===action&&g.expires>=today()&&WBA.scope(u,g.pointId));
}
function guard(module,action='edit',pointId) {
  try {WBA.requirePermission(currentUser(),module,action,pointId);WBA.openPeriod(state.data);return true;}
  catch(e){toast('Acción no disponible',e.message,'warning');return false;}
}
function command(fn,...args) {
  const previous=state.data;
  try {
    const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(stored&&(stored.revision||0)!==(state.data.revision||0)){
      state.data=WBA.migrate(stored);closeModal();render();toast('Datos actualizados','Otra pestaña modificó los datos. Volvé a realizar la acción.','warning');return false;
    }
    const change=WBA.transaction(state.data,fn,currentUser(),...args);
    state.data=change.data;saveData();return change.result ?? true;
  }catch(e){state.data=previous;toast('Revisá los datos',e.message,'danger');return false;}
}
const opt=(value,label,selected)=>`<option value="${escapeHtml(value)}" ${value===selected?'selected':''}>${escapeHtml(label)}</option>`;
const field=(label,name,value='',type='text',extra='')=>`<div class="form-field"><label for="f-${name}">${escapeHtml(label)}</label><input class="input" id="f-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${extra}></div>`;
const selectField=(label,name,options)=>`<div class="form-field"><label for="f-${name}">${escapeHtml(label)}</label><select class="select" id="f-${name}" name="${name}">${options}</select></div>`;
const noteField=(label,name,value='',required=false)=>`<div class="form-field full"><label for="f-${name}">${escapeHtml(label)}</label><textarea class="textarea" id="f-${name}" name="${name}" ${required?'required':''}>${escapeHtml(value)}</textarea></div>`;
function modalForm(id,title,body,save,label='Guardar',subtitle='') {
  showModal({title,subtitle,size:'modal-lg',body:`<form id="${id}"><div class="form-grid cols-3">${body}</div></form>`,footer:`<button class="btn btn-secondary" id="cancel-modal">Cancelar</button><button class="btn btn-primary" id="save-${id}">${label}</button>`});
  document.getElementById('cancel-modal').onclick=closeModal;
  document.getElementById(`save-${id}`).onclick=()=>{const form=document.getElementById(id);if(form.reportValidity())save(new FormData(form),form);};
}
function startShift(id) {
  const s=getShift(id);if(!s||!guard('Jornadas','edit',s.pointId))return;
  const body=selectField('Ubicación','locationStatus',opt('exception','Registrar excepción','exception'))+
    noteField('Motivo de excepción de ubicación','locationReason','',true)+
    state.data.materials.filter(m=>m.id in s.materialAssignment).map(m=>field(`${m.name}: asignado ${s.materialAssignment[m.id]}`,`received-${m.id}`,s.materialAssignment[m.id],'number','required min="0" step="1"')).join('')+
    `<div class="full"><p>${escapeHtml(getPoint(s.pointId).instructions)}</p><label class="checkbox-row"><input type="checkbox" name="stockAck" required> Confirmé cantidades recibidas</label><label class="checkbox-row"><input type="checkbox" name="instructionAck" required> Leí las indicaciones diarias</label><button class="btn btn-secondary" type="button" id="validate-location">Validar ubicación</button><p id="location-result" class="muted">La excepción se notificará al encargado.</p></div>`;
  let location=null;
  modalForm('start-form','Iniciar jornada',body,(f)=>{
    const received=Object.fromEntries(Object.keys(s.materialAssignment).map(k=>[k,Number(f.get(`received-${k}`))]));
    const result=command(WBA.start,id,{received,stockAck:f.has('stockAck'),instructionAck:f.has('instructionAck'),location:location||{status:'exception',reason:f.get('locationReason')}});
    if(result){closeModal();renderRoute();toast('Jornada iniciada','Ahora confirmá equipos y fondo de caja.','success');}
  },'Confirmar inicio','Stock, ubicación e instrucciones según el módulo de fotógrafo.');
  document.getElementById('validate-location').onclick=()=>{
    const p=getPoint(s.pointId),message=document.getElementById('location-result');
    if(!navigator.geolocation){message.textContent='Geolocalización no disponible. Registrá el motivo de excepción.';return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      // Receiving coordinates is not proof of proximity to the assigned point.
      if(Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)) {
        const rad=x=>x*Math.PI/180,a=Math.sin(rad(pos.coords.latitude-p.latitude)/2)**2+Math.cos(rad(p.latitude))*Math.cos(rad(pos.coords.latitude))*Math.sin(rad(pos.coords.longitude-p.longitude)/2)**2;
        const distance=6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
        if(distance<=(p.locationRadius||200)&&pos.coords.accuracy<=(p.locationRadius||200)){
          location={status:'verified',latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy,at:WBA.time()};
          document.getElementById('f-locationReason').required=false;message.textContent='Ubicación verificada dentro del radio autorizado.';return;
        }
      }
      message.textContent='No se pudo confirmar cercanía al punto. Registrá una excepción con motivo.';
    },()=>{message.textContent='Ubicación no disponible. Registrá una excepción con motivo.';},{timeout:5000});
  };
}
function prepareShift(id) {
  const s=getShift(id);if(!s||!guard('Jornadas','edit',s.pointId))return;
  const devices=s.deviceIds.map(id=>state.data.devices.find(d=>d.id===id)).filter(Boolean);
  const body=devices.map(d=>selectField(`${d.type} · ${d.code}`,`tool-${d.id}`,opt('','Seleccionar')+opt('received','Lo recibí')+opt('missing','No lo tengo'))+noteField(`Detalle si falta ${d.code}`,`detail-${d.id}`)).join('')+
    field('Fondo de caja inicial ARS','cashOpeningARS',s.cashOpeningARS??'','number','min="0" step="0.01" required')+
    `<p class="full muted">Los faltantes se notifican al encargado. Confirmar recepción no certifica el funcionamiento del equipo; se informa durante la jornada o al cierre.</p>`;
  modalForm('prepare-form','Confirmar material y abrir caja',body,f=>{
    const tools=Object.fromEntries(devices.map(d=>[d.id,{status:f.get(`tool-${d.id}`),detail:f.get(`detail-${d.id}`)}]));
    if(command(WBA.prepare,id,{tools,cashOpeningARS:Number(f.get('cashOpeningARS'))})){closeModal();renderRoute();}
  },'Confirmar y habilitar ventas');
}
function renderPhotographer() {
  setTitle('Mi jornada','Inicio · Material · Ventas · Cierre · Incidencias');
  const user=currentUser(),shifts=visibleData().shifts.filter(s=>s.photographerId===user.id&&s.date===today());
  const s=shifts.find(x=>['En curso','Iniciada'].includes(x.status))||shifts.find(x=>x.status==='Programada')||shifts[0];
  const view=document.getElementById('view');
  if(!s){view.innerHTML='<div class="empty-state"><h3>No tenés una jornada asignada para hoy</h3><p>El encargado debe programar el punto, materiales y equipos.</p></div>';return;}
  const sales=shiftSales(s.id),units=sum(sales,saleUnits),revenue=sum(sales,x=>x.totalARS),commission=sum(sales.filter(x=>x.status==='Cobrada'),x=>x.commission),active=['En curso','Iniciada'].includes(s.status),ready=active&&s.toolsConfirmed&&s.cashOpeningARS!==null;
  const r=state.data.renditions.find(r=>r.shiftId===s.id),cash=WBA.cash(state.data,s),incidents=state.data.incidents.filter(i=>i.shiftId===s.id);
  view.innerHTML=`<div class="photographer-workspace"><div class="photographer-hero"><div class="photographer-hero-top"><div><h2>¡Hola, ${escapeHtml(user.name)}!</h2><p>${escapeHtml(getPoint(s.pointId).name)} · ${s.start} a ${s.end}</p></div>${statusBadge(s.status)}</div><div class="hero-stat"><div class="hero-stat-label"><span>Objetivo diario</span><strong>${units} / ${s.target} productos</strong></div><div class="hero-progress"><span style="width:${Math.min(100,units/s.target*100||0)}%"></span></div><p>${units>=s.target?'¡Objetivo alcanzado!':`Faltan ${s.target-units} productos para el objetivo.`}</p></div><div class="grid cols-3"><div>Ventas ARS<strong class="hero-number">${money(revenue)}</strong></div><div>Comisión cobrada<strong class="hero-number">${money(commission)}</strong></div><div>Fondo inicial<strong class="hero-number">${s.cashOpeningARS===null?'Pendiente':money(s.cashOpeningARS)}</strong></div></div></div>
    <div class="workflow-steps">${['Inicio','Material y caja','Ventas','Rendición'].map((label,i)=>`<span class="badge ${i===0&&s.status!=='Programada'||i===1&&s.toolsConfirmed||i===3&&r?.closedAt?'success':'neutral'}">${i+1}. ${label}</span>`).join('')}</div>
    <div class="quick-actions">${s.status==='Programada'?`<button class="quick-action" id="photo-start-shift">${icon('play',30)}<strong>Iniciar jornada</strong><span>Ubicación, stock e indicaciones</span></button>`:''}${active&&!s.toolsConfirmed?`<button class="quick-action" id="photo-prepare">${icon('device',30)}<strong>Confirmar material y caja</strong><span>Equipos recibidos, faltantes y fondo</span></button>`:''}<button class="quick-action" id="photo-new-sale" ${ready?'':'disabled'}>${icon('sale',30)}<strong>Registrar venta</strong><span>Precios mínimos, monedas y vuelto</span></button><button class="quick-action" id="photo-close-shift" ${ready?'':'disabled'}>${icon('cash',30)}<strong>Cerrar y rendir</strong><span>Caja, materiales y estado final</span></button><button class="quick-action" id="photo-incident" ${active?'':'disabled'}>${icon('warning',30)}<strong>Informar incidencia</strong><span>Notificar al encargado</span></button><button class="quick-action" id="photo-weather" ${active?'':'disabled'}>${icon('map',30)}<strong>Informar clima</strong></button></div>
    <section class="card section-gap"><div class="card-header"><h3>Caja por moneda</h3></div><div class="card-body grid cols-3">${Object.entries(cash).map(([currency,value])=>`<div class="point-metric"><span>${currency}</span><strong>${money(value,currency)}</strong></div>`).join('')}</div></section>
    <section class="card section-gap"><div class="card-header"><h3>Material asignado y consumido</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Material</th><th>Recibido</th><th>Consumido</th><th>Disponible</th></tr></thead><tbody>${state.data.materials.filter(m=>m.id in s.materialAssignment).map(m=>`<tr><td>${m.name}</td><td>${s.materialReceived?.[m.id]??s.materialAssignment[m.id]}</td><td>${s.materialConsumed[m.id]||0}</td><td>${(s.materialReceived?.[m.id]??s.materialAssignment[m.id])-(s.materialConsumed[m.id]||0)}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="card section-gap"><div class="card-header"><h3>Ventas de la jornada · ${sales.length}</h3></div><div class="card-body timeline">${sales.map(v=>`<div class="timeline-item"><div class="timeline-dot">${icon('sale',16)}</div><div class="timeline-copy"><strong>${money(v.total,v.currency)} · ${saleUnits(v)} productos</strong><p>${escapeHtml(v.payment)} · Equiv. ${money(v.totalARS)} · TC ${v.exchangeRateARS??'sin histórico'}</p><time>${formatDate(v.datetime,true)} · ${escapeHtml(v.status)}</time></div></div>`).join('')||'<p>Sin ventas registradas.</p>'}</div></section>
    ${r?.closedAt?`<section class="card section-gap"><div class="card-header"><h3>Rendición ${escapeHtml(r.id)}</h3>${statusBadge(r.status)}</div><div class="card-body"><p>Comisión ${money(r.commission)} · ${escapeHtml(r.commissionMethod)}. Fondo recuperado: ${money(r.openingRecoveredARS)}. Reintegro pendiente: ${money(r.reimbursementARS)}.</p>${Object.entries(r.currencies||{}).map(([c,v])=>`<p>${c}: esperado ${money(v,c)}, declarado ${money(r.declaredCurrencies[c],c)}, diferencia ${money(r.currencyDifferences[c],c)}</p>`).join('')}<button class="btn btn-secondary" id="print-rendition">Imprimir liquidación</button></div></section>`:''}
    <section class="card section-gap"><div class="card-header"><h3>Incidencias · ${incidents.length}</h3></div><div class="card-body">${incidents.map(i=>`<p><strong>${escapeHtml(i.category)}</strong>: ${escapeHtml(i.detail)} ${statusBadge(i.status)}</p>`).join('')||'<p>Sin incidencias.</p>'}</div></section></div>`;
  document.getElementById('photo-start-shift')?.addEventListener('click',()=>startShift(s.id));
  document.getElementById('photo-prepare')?.addEventListener('click',()=>prepareShift(s.id));
  document.getElementById('photo-new-sale').onclick=()=>showSaleModal(s.id);
  document.getElementById('photo-close-shift').onclick=()=>closeShift(s.id);
  document.getElementById('photo-weather').onclick=()=>showWeatherModal(s);
  document.getElementById('photo-incident').onclick=()=>showIncidentModal(s.id);
  document.getElementById('print-rendition')?.addEventListener('click',()=>window.print());
}
function showIncidentModal(shiftId) {
  const s=getShift(shiftId);if(!s||!guard('Jornadas','edit',s.pointId))return;
  modalForm('incident-form','Informar incidencia',selectField('Categoría','category',['Equipo','Stock','Punto de venta','Clima','Caja','Otro'].map(x=>opt(x,x)).join(''))+noteField('Detalle','detail','',true),f=>{
    if(command((d,u)=>{WBA.requirePermission(u,'Jornadas','edit',s.pointId);WBA.openPeriod(d,s.date);if(!WBA.own(u,s))throw new Error('Jornada ajena.');const r=WBA.incident(d,u,s,f.get('category'),f.get('detail'));WBA.audit(d,u,'Informó incidencia',r.id,'-',r,'Notificación al encargado');return r;})){closeModal();renderRoute();}
  },'Notificar encargado');
}
function showSaleModal(prefilledShiftId='') {
  if(!guard('Ventas','create'))return;
  const shifts=activeShiftOptions().filter(s=>s.toolsConfirmed&&s.cashOpeningARS!==null);
  if(!shifts.length){toast('Primero prepará la jornada','Confirmá equipos y abrí caja para habilitar ventas.','warning');return;}
  let s=shifts.find(x=>x.id===prefilledShiftId)||shifts[0];
  let lines=[{productId:getPoint(s.pointId).productIds.find(id=>getProduct(id).active),qty:1,price:null}];
  const body=selectField('Jornada activa','shiftId',shifts.map(x=>opt(x.id,`${getUser(x.photographerId).name} · ${getPoint(x.pointId).name}`,s.id)).join(''))+
    selectField('Medio de pago','payment',getPoint(s.pointId).payments.map(x=>opt(x,x)).join(''))+
    selectField('Moneda','currency',getPoint(s.pointId).currencies.map(x=>opt(x,x,'ARS')).join(''))+
    field('Cotización ARS por unidad','exchangeRateARS',1,'number','required min="0.000001" step="any"')+
    selectField('Estado','status',opt('Cobrada','Cobrada','Cobrada')+opt('Pendiente de cobro','Pendiente de cobro'))+
    field('Efectivo recibido (moneda de venta)','received','','number','min="0" step="any"')+
    `<div class="full" id="sale-lines"></div><div class="full"><button class="btn btn-secondary" type="button" id="add-sale-line">+ Agregar producto</button></div><div class="full sale-summary" id="sale-preview" aria-live="polite"></div>`+noteField('Observaciones','notes');
  modalForm('sale-form','Registrar venta',body,(f)=>{
    const input={items:lines,currency:f.get('currency'),payment:f.get('payment'),status:f.get('status'),exchangeRateARS:Number(f.get('exchangeRateARS')),received:Number(f.get('received')),notes:f.get('notes')};
    if(input.payment==='Efectivo'&&f.get('received')===''){toast('Completá el efectivo recibido','','warning');return;}
    if(command(WBA.sell,s.id,input)){closeModal();renderRoute();toast('Venta registrada','Stock, caja, comisión y auditoría actualizados.','success');}
  },'Confirmar venta','Las condiciones aplicadas quedan guardadas como histórico.');
  const form=document.getElementById('sale-form');
  const listPrice=(productId)=>{const p=getProduct(productId),point=getPoint(s.pointId),currency=form.currency.value,rate=Number(form.exchangeRateARS.value);return point.prices?.[productId]?.[currency]??(currency==='ARS'?p.price:WBA.amount(p.price/rate));};
  const preview=()=>{
    try {
      const q=WBA.quote(state.data,s,{items:lines,currency:form.currency.value,payment:form.payment.value,exchangeRateARS:Number(form.exchangeRateARS.value)});
      const received=Number(form.received.value),foreign=form.currency.value!=='ARS',change=form.payment.value==='Efectivo'?Math.max(0,received-q.total)*(foreign?q.exchangeRateARS:1):0;
      document.getElementById('sale-preview').innerHTML=`<strong>Total ${money(q.total,form.currency.value)}</strong><p>Equivalente ${money(q.totalARS)} · Comisión ${money(q.commission)} · Vuelto ${money(change,foreign?'ARS':form.currency.value)}</p>`;
    }catch(e){document.getElementById('sale-preview').textContent=e.message;}
    form.exchangeRateARS.readOnly=form.currency.value==='ARS';
    form.received.required=form.payment.value==='Efectivo';
    form.received.disabled=form.payment.value!=='Efectivo';
  };
  const renderLines=()=>{
    document.getElementById('sale-lines').innerHTML=lines.map((l,i)=>`<div class="sale-line"><label>Producto<select class="select" data-line="${i}" data-key="productId">${getPoint(s.pointId).productIds.filter(id=>getProduct(id).active).map(id=>opt(id,getProduct(id).name,l.productId)).join('')}</select></label><label>Cantidad<input class="input" data-line="${i}" data-key="qty" value="${l.qty}" type="number" min="1" step="1" required></label><label>Precio unitario<input class="input" data-line="${i}" data-key="price" value="${l.price??listPrice(l.productId)}" type="number" min="0.01" step="any" required></label><button class="btn btn-secondary" data-remove="${i}" type="button" ${lines.length===1?'disabled':''}>Quitar</button></div>`).join('');
    lines.forEach(l=>{l.price??=listPrice(l.productId);});
    document.querySelectorAll('[data-line]').forEach(el=>el.onchange=()=>{
      const l=lines[Number(el.dataset.line)];l[el.dataset.key]=el.dataset.key==='productId'?el.value:Number(el.value);
      if(el.dataset.key==='productId'){l.price=null;renderLines();}preview();
    });
    document.querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{lines.splice(Number(el.dataset.remove),1);renderLines();preview();});
  };
  form.currency.onchange=()=>{form.exchangeRateARS.value=getPoint(s.pointId).exchangeRates[form.currency.value]??'';lines.forEach(l=>l.price=null);renderLines();preview();};
  form.exchangeRateARS.oninput=()=>{lines.forEach(l=>l.price=null);renderLines();preview();};
  form.shiftId.onchange=()=>{
    s=getShift(form.shiftId.value);
    form.payment.innerHTML=getPoint(s.pointId).payments.map(x=>opt(x,x)).join('');
    form.currency.innerHTML=getPoint(s.pointId).currencies.map(x=>opt(x,x,'ARS')).join('');form.exchangeRateARS.value=1;
    lines=[{productId:getPoint(s.pointId).productIds.find(id=>getProduct(id).active),qty:1,price:null}];renderLines();preview();
  };
  form.payment.onchange=preview;form.received.oninput=preview;
  document.getElementById('add-sale-line').onclick=()=>{const next=getPoint(s.pointId).productIds.find(id=>getProduct(id).active&&!lines.some(l=>l.productId===id));if(next){lines.push({productId:next,qty:1,price:null});renderLines();preview();}};
  renderLines();preview();
}
function closeShift(id) {
  const s=getShift(id);if(!s||!guard('Rendiciones','create',s.pointId))return;
  const cash=WBA.cash(state.data,s),sales=shiftSales(id),commission=sum(sales.filter(v=>v.status==='Cobrada'),v=>v.commission);
  const contract=getPoint(s.pointId).advanced;
  const body=(contract?.activeAgreement==='unit'?field('Tickets / pasajeros informados para el acuerdo','unitsReported','','number',`min="0" step="1" ${contract.values.requestUnitAtClose&&!contract.values.allowCloseWithoutUnit?'required':''}`):'')+selectField('Cobro de comisión','commissionMethod',opt('Transferencia','Transferencia','Transferencia')+opt('Efectivo','Descontar del efectivo ARS'))+
    state.data.materials.filter(m=>m.id in (s.materialReceived||{})).map(m=>field(`${m.name}: devolución teórica ${(s.materialReceived[m.id]||0)-(s.materialConsumed[m.id]||0)}`,`returned-${m.id}`,'','number','required min="0" step="1"')).join('')+
    field('Voligomas utilizadas','glueUsed','','number','required min="0" step="1"')+
    Object.entries(cash).map(([c,value])=>field(`Efectivo a rendir ${c} (teórico ${money(c==='ARS'?Math.max(0,value-s.cashOpeningARS):value,c)})`,`declared-${c}`,'','number','required min="0" step="0.01"')).join('')+
    selectField('Estado final de equipos','materialStatus',opt('','Seleccionar')+opt('ok','Devueltos en condiciones')+opt('issue','Con incidencia'))+
    noteField('Detalle de equipos','materialDetail')+selectField('Estado final del punto','pointStatus',opt('','Seleccionar')+opt('ok','En condiciones')+opt('issue','Con incidencia'))+noteField('Detalle del punto','pointDetail')+noteField('Observaciones de cierre','notes')+
    `<div class="full sale-summary" id="closure-summary"><strong>Comisión ${money(commission)}</strong><p>Fondo inicial ${money(s.cashOpeningARS)}. Si cobrás la comisión en efectivo, se descuenta del monto ARS a rendir. El fondo inicial es propio y se recupera primero. Las diferencias quedan observadas.</p></div>`;
  modalForm('closure-form','Cerrar jornada y presentar rendición',body,f=>{
    const returned=Object.fromEntries(Object.keys(s.materialReceived||{}).map(k=>[k,Number(f.get(`returned-${k}`))]));
    const declared=Object.fromEntries(Object.keys(cash).map(c=>[c,Number(f.get(`declared-${c}`))]));
    if(command(WBA.close,id,{returned,declared,unitsReported:f.get('unitsReported')===null||f.get('unitsReported')===''?null:Number(f.get('unitsReported')),glueUsed:Number(f.get('glueUsed')),commissionMethod:f.get('commissionMethod'),materialStatus:f.get('materialStatus'),materialDetail:f.get('materialDetail'),pointStatus:f.get('pointStatus'),pointDetail:f.get('pointDetail'),notes:f.get('notes')})){closeModal();renderRoute();toast('Rendición presentada','No se pueden registrar nuevas ventas en esta jornada.','success');}
  },'Cerrar y generar liquidación');
  document.getElementById('f-commissionMethod').onchange=e=>{
    const expected=Math.max(0,cash.ARS-s.cashOpeningARS)-(e.target.value==='Efectivo'?commission:0);
    document.getElementById('closure-summary').innerHTML=`<strong>ARS a rendir: ${money(expected)}</strong><p>Comisión: ${money(commission)} por ${escapeHtml(e.target.value)}. Fondo inicial: ${money(s.cashOpeningARS)}.</p>`;
  };
}

function renderRenditions() {
  setTitle('Rendiciones','Fotógrafo → Encargado → Administración');
  document.getElementById('view').innerHTML=`<div class="page-header"><div><h2>Control de rendiciones</h2><p>Se conservan los importes originales por moneda, diferencias, materiales y comisión.</p></div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Jornada</th><th>Fotógrafo</th><th>Monedas a rendir</th><th>Diferencias</th><th>Estado</th><th></th></tr></thead><tbody>${visibleData().renditions.map(r=>{
    const s=getShift(r.shiftId);return `<tr><td>${escapeHtml(getPoint(s?.pointId).name)}<span class="cell-subtitle">${formatDate(s?.date)}</span></td><td>${escapeHtml(getUser(s?.photographerId).name)}</td><td>${Object.entries(r.currencies||{ARS:r.expected}).map(([c,v])=>money(v,c)).join('<br>')}</td><td>${Object.entries(r.currencyDifferences||{ARS:r.difference}).map(([c,v])=>money(v,c)).join('<br>')}<span class="cell-subtitle">Stock faltante: ${r.stockMissing||0}</span></td><td>${statusBadge(r.status)}</td><td><button class="btn btn-secondary btn-sm review-rendition" data-id="${r.id}">Ver / revisar</button></td></tr>`;
  }).join('')}</tbody></table></div></div>`;
  document.querySelectorAll('.review-rendition').forEach(b=>b.onclick=()=>showRenditionModal(b.dataset.id));
}
function showRenditionModal(id) {
  const r=visibleData().renditions.find(r=>r.id===id);if(!r)return;
  const s=getShift(r.shiftId);
  showModal({title:`Rendición de ${getUser(s.photographerId).name}`,subtitle:`${getPoint(s.pointId).name} · ${formatDate(s.date)}`,size:'modal-lg',body:`<div class="grid cols-3"><div class="point-metric"><span>Comisión</span><strong>${money(r.commission)} · ${escapeHtml(r.commissionMethod||'Pendiente')}</strong></div><div class="point-metric"><span>Fondo recuperado</span><strong>${money(r.openingRecoveredARS)}</strong></div><div class="point-metric"><span>Reintegro pendiente</span><strong>${money(r.reimbursementARS)}</strong></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Moneda</th><th>Esperado</th><th>Declarado</th><th>Diferencia</th></tr></thead><tbody>${Object.entries(r.currencies||{ARS:r.expected}).map(([c,v])=>`<tr><td>${c}</td><td>${money(v,c)}</td><td>${money(r.declaredCurrencies?.[c]??r.declared,c)}</td><td>${money(r.currencyDifferences?.[c]??r.difference,c)}</td></tr>`).join('')}</tbody></table></div><div class="table-wrap"><table class="table"><thead><tr><th>Material</th><th>Recibido</th><th>Consumido</th><th>Teórico</th><th>Devuelto</th><th>Diferencia</th></tr></thead><tbody>${(r.stock||[]).map(x=>`<tr><td>${escapeHtml(state.data.materials.find(m=>m.id===x.materialId)?.name||x.materialId)}</td><td>${x.initial}</td><td>${x.consumed}</td><td>${x.expected}</td><td>${x.actual}</td><td>${x.difference}</td></tr>`).join('')}</tbody></table></div><p>${statusBadge(r.status)} · Equipos: ${escapeHtml(r.materialStatus||'Pendiente')} · Punto: ${escapeHtml(r.pointStatus||'Pendiente')}</p><p>${escapeHtml(r.materialDetail||'')} ${escapeHtml(r.pointDetail||'')} ${escapeHtml(r.photographerNotes||'')}</p><p>${escapeHtml(r.managerNotes||'')}</p>${can('Rendiciones','edit')&&r.closedAt?`<form id="review-form">${noteField('Motivo de revisión','notes','',true)}${selectField('Acción','action',['Presentada','Con diferencia','Observada'].includes(r.status)?opt('validate','Validar rendición')+opt('observe','Observar')+(['direction','admin'].includes(currentUser().role)&&['Con diferencia','Observada'].includes(r.status)?opt('authorize','Autorizar diferencia documentada'):''):r.status==='Validada por encargado'&&['direction','admin'].includes(currentUser().role)?opt('approve','Aprobar administrativamente'):opt('none','Sin acciones disponibles'))}</form>`:'<p class="muted">Consulta de rendición. El fotógrafo debe completar su cierre antes de validar.</p>'}`,footer:`<button class="btn btn-secondary" id="cancel-modal">Cerrar</button>${can('Rendiciones','edit')&&r.closedAt?'<button class="btn btn-primary" id="save-review">Registrar revisión</button>':''}`});
  document.getElementById('cancel-modal').onclick=closeModal;
  document.getElementById('save-review')?.addEventListener('click',()=>{
    const form=document.getElementById('review-form');if(!form.reportValidity())return;const f=new FormData(form);
    if(f.get('action')==='none')return;
    if(command(WBA.review,id,{notes:f.get('notes'),approve:f.get('action')==='approve',observe:f.get('action')==='observe',authorizeDifferences:f.get('action')==='authorize'})){closeModal();renderRoute();}
  });
}
function showAnnulSale(id) {
  const sale=visibleData().sales.find(s=>s.id===id);if(!sale)return;
  const direct=['direction','admin'].includes(currentUser().role);
  if(!direct&&!can('Solicitudes','create'))return;
  modalForm('annul-form',direct?'Anular venta con auditoría':'Solicitar anulación',noteField('Motivo obligatorio','reason','',true),f=>{
    const ok=command(direct?WBA.annul:WBA.request,id,f.get('reason'));
    if(ok){closeModal();renderRoute();toast(direct?'Venta anulada':'Solicitud enviada',direct?'Stock, materiales y caja revertidos.':'Administración debe revisar la solicitud.','success');}
  },direct?'Confirmar anulación':'Enviar a Administración');
}
function renderAdjustments() {
  setTitle('Solicitudes de ajuste','Los encargados solicitan; Administración o Dirección revisa');
  const rows=visibleData().adjustments;
  document.getElementById('view').innerHTML=`<div class="page-header"><div><h2>Ajustes de ventas</h2><p>Las operaciones confirmadas conservan su historial. Cada solicitud requiere motivo y una segunda persona para aprobar.</p></div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Solicitante</th><th>Venta</th><th>Motivo</th><th>Estado</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${formatDate(r.datetime,true)}</td><td>${escapeHtml(getUser(r.requestedBy).name)}</td><td>${escapeHtml(r.saleId)}</td><td>${escapeHtml(r.reason)}</td><td>${statusBadge(r.status)}</td><td>${r.status==='Solicitada'&&can('Solicitudes','approve')?`<button class="btn btn-secondary review-adjustment" data-id="${r.id}">Revisar</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6">No hay solicitudes.</td></tr>'}</tbody></table></div></div>`;
  document.querySelectorAll('.review-adjustment').forEach(b=>b.onclick=()=>modalForm('adjustment-form','Revisar solicitud',selectField('Resolución','approve',opt('yes','Aprobar anulación')+opt('no','Rechazar'))+noteField('Motivo de resolución','reason','',true),f=>{if(command(WBA.resolve,b.dataset.id,f.get('approve')==='yes',f.get('reason'))){closeModal();renderRoute();}}));
}
function renderUsers() {
  setTitle('Usuarios y roles','Matriz de permisos y alcance por punto');
  const tab=state.filters.userTab||'users';
  document.getElementById('view').innerHTML=`<div class="page-header"><div><h2>Usuarios, roles y permisos</h2><p>Reglas del módulo avanzado: ver, crear, editar, baja lógica, aprobar y exportar.</p></div>${can('Usuarios','create')?'<button class="btn btn-primary" id="new-user">+ Nuevo usuario</button>':''}</div><div class="action-row section-gap">${[['users','Usuarios'],['matrix','Matriz de permisos'],['specials','Permisos temporales']].map(([key,label])=>`<button class="btn ${key===tab?'btn-primary':'btn-secondary'} user-tab" data-tab="${key}">${label}</button>`).join('')}</div><div id="users-body" class="section-gap"></div>`;
  document.querySelectorAll('.user-tab').forEach(b=>b.onclick=()=>{state.filters.userTab=b.dataset.tab;renderUsers();});
  document.getElementById('new-user')?.addEventListener('click',()=>showUserModal());
  const body=document.getElementById('users-body');
  if(tab==='matrix'){
    const selected=state.filters.matrixRole||'direction';
    body.innerHTML=`<div class="card"><div class="card-header"><h3>Matriz por rol</h3><select class="select" id="matrix-role">${Object.entries(roles).map(([key,r])=>opt(key,r.label,selected)).join('')}</select></div><div class="table-wrap"><table class="table"><thead><tr><th>Módulo</th>${WBA.actions.map(a=>`<th>${escapeHtml({view:'Ver',create:'Crear',edit:'Editar',delete:'Baja lógica',approve:'Aprobar',export:'Exportar'}[a])}</th>`).join('')}</tr></thead><tbody>${[...new Set(Object.values(WBA.routeModules))].map(module=>`<tr><td>${module}</td>${WBA.actions.map(a=>`<td>${WBA.permission({role:selected,status:'Activo'},module,a)?'✓':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    document.getElementById('matrix-role').onchange=e=>{state.filters.matrixRole=e.target.value;renderUsers();};return;
  }
  if(tab==='specials'){
    body.innerHTML=`<div class="card"><div class="card-header"><h3>Accesos temporales de consulta</h3>${currentUser().role==='direction'?'<button class="btn btn-primary" id="new-special">+ Otorgar permiso</button>':''}</div><div class="card-body"><p>Los permisos temporales habilitan consultas o exportaciones puntuales. Las correcciones y anulaciones mantienen el circuito de solicitud y aprobación.</p></div><div class="table-wrap"><table class="table"><thead><tr><th>Usuario</th><th>Módulo</th><th>Acción</th><th>Punto</th><th>Vence</th><th>Estado</th></tr></thead><tbody>${(state.data.specialPermissions||[]).map(x=>`<tr><td>${escapeHtml(getUser(x.userId).name)}</td><td>${escapeHtml(x.module)}</td><td>${escapeHtml(x.action)}</td><td>${escapeHtml(getPoint(x.pointId).name)}</td><td>${formatDate(x.expires)}</td><td>${statusBadge(x.expires>=today()?'Activo':'Vencido')}</td></tr>`).join('')}</tbody></table></div></div>`;
    document.getElementById('new-special')?.addEventListener('click',showSpecialModal);return;
  }
  const list=currentUser().role==='manager'?state.data.users.filter(u=>u.role==='photographer'||u.id===currentUser().id):state.data.users;
  body.innerHTML=`<div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Usuario</th><th>Rol</th><th>Ciudad / puntos</th><th>Estado</th><th></th></tr></thead><tbody>${list.map(u=>`<tr><td>${escapeHtml(u.name)}<span class="cell-subtitle">${escapeHtml(u.email)}</span></td><td>${roleBadge(u.role)}</td><td>${escapeHtml(u.city||'Buenos Aires')} · ${u.points.length?u.points.map(id=>escapeHtml(getPoint(id).name)).join(', '):['direction','admin','manager','auditor'].includes(u.role)?'Todos los puntos':'Sin puntos asignados'}</td><td>${statusBadge(u.status)}</td><td>${can('Usuarios','edit')?`<button class="btn btn-secondary edit-user" data-id="${u.id}">Editar</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>`;
  document.querySelectorAll('.edit-user').forEach(b=>b.onclick=()=>showUserModal(b.dataset.id));
}
function showSpecialModal() {
  if(currentUser().role!=='direction')return;
  const consultModules=['Stock','Objetivos','Ranking','Comisiones','Liquidaciones'];
  modalForm('special-form','Permiso temporal',selectField('Usuario','userId',state.data.users.map(u=>opt(u.id,u.name)).join(''))+selectField('Módulo','module',consultModules.map(x=>opt(x,x)).join(''))+selectField('Acción','action',opt('view','Consultar')+opt('export','Exportar'))+selectField('Punto','pointId',state.data.points.map(p=>opt(p.id,p.name)).join(''))+field('Vencimiento','expires',today(),'date','required')+noteField('Motivo','reason','',true),f=>{
    if(command((d,u)=>{
      if(u.role!=='direction')throw new Error('Solo Dirección otorga permisos temporales.');
      if(f.get('expires')<today())throw new Error('El permiso ya está vencido.');
      const target=d.users.find(x=>x.id===f.get('userId'));if(!WBA.scope(target,f.get('pointId')))throw new Error('El punto debe estar asignado al usuario.');
      const grant={id:uid('sp'),userId:target.id,module:f.get('module'),action:f.get('action'),pointId:f.get('pointId'),expires:f.get('expires'),reason:f.get('reason'),grantedBy:u.id};d.specialPermissions??=[];d.specialPermissions.push(grant);WBA.audit(d,u,'Otorgó permiso temporal',grant.id,'-',grant,grant.reason);
    })){closeModal();renderUsers();}
  });
}
function renderPoints() {
  setTitle('Puntos de venta','Editor avanzado: horarios, contactos y acuerdos');
  if(!can('Puntos de venta','edit')||currentUser().role==='pointManager'){
    document.getElementById('view').innerHTML=`<div class="page-header"><div><h2>Puntos asignados</h2><p>Consulta operativa del punto. La configuración comercial requiere Administración.</p></div></div><div class="grid cols-2">${visibleData().points.map(p=>`<section class="card"><div class="card-header"><h3>${escapeHtml(p.name)}</h3>${statusBadge(p.status)}</div><div class="card-body"><p>${escapeHtml(p.city)} · ${escapeHtml(p.address)}</p><p>Horario: ${escapeHtml(p.schedule)}</p><p>Objetivo diario: ${p.dailyTarget} · Stock mínimo: ${p.minStock}</p><p>${escapeHtml(p.instructions)}</p></div></section>`).join('')}</div>`;
    return;
  }
  document.getElementById('view').innerHTML=`<div class="page-header"><div><h2>Configuración integral de puntos</h2><p>Horarios, turnos, aliados y acuerdos del módulo avanzado se guardan en el sistema compartido.</p></div><button class="btn btn-secondary" id="point-operational">Productos, caja y objetivos</button></div><iframe id="point-editor" class="point-editor-frame" title="Editor avanzado de puntos de venta" src="point-editor.html"></iframe>`;
  document.getElementById('point-operational').onclick=()=>{
    modalForm('select-point','Elegir punto',selectField('Punto','pointId',visibleData().points.map(p=>opt(p.id,p.name)).join('')),f=>{closeModal();showPointModal(f.get('pointId'));},'Configurar operación');
  };
}
function showPointModal(id='') {
  if(!id){renderPoints();return;}
  const p=getPoint(id);if(!guard('Puntos de venta','edit',id))return;
  const body=field('Objetivo diario','dailyTarget',p.dailyTarget,'number','min="1" required')+field('Objetivo mensual','monthlyTarget',p.monthlyTarget,'number','min="1" required')+field('Comisión fotógrafo (%)','commission',p.commission,'number','min="0" max="100" required')+field('Stock mínimo','minStock',p.minStock,'number','min="0" required')+
    field('Cotización USD → ARS','usd',p.exchangeRates.USD,'number','min="0.000001" step="any" required')+field('Cotización BRL → ARS','brl',p.exchangeRates.BRL,'number','min="0.000001" step="any" required')+
    field('Mínimo ARS efectivo','cash',p.minimums.cash,'number','min="0" required')+field('Mínimo ARS transferencia','transfer',p.minimums.transfer,'number','min="0" required')+field('Mínimo ARS tarjeta','card',p.minimums.card,'number','min="0" required')+
    field('Latitud del punto','latitude',p.latitude??'','number','min="-90" max="90" step="any"')+field('Longitud del punto','longitude',p.longitude??'','number','min="-180" max="180" step="any"')+field('Radio autorizado (metros)','locationRadius',p.locationRadius||200,'number','min="1" required')+
    `<div class="full"><label>Productos habilitados</label><div class="grid cols-3">${state.data.products.map(x=>`<label class="checkbox-row"><input type="checkbox" name="productIds" value="${x.id}" ${p.productIds.includes(x.id)?'checked':''}> ${escapeHtml(x.name)}</label>`).join('')}</div></div>`+
    `<div class="full"><h4>Precios por producto y moneda (vacío usa conversión del precio base)</h4><div class="form-grid cols-3">${state.data.products.map(x=>['ARS','USD','BRL'].map(c=>field(`${x.name} · ${c}`,`price-${x.id}-${c}`,p.prices?.[x.id]?.[c]??'','number','min="0.01" step="any"')).join('')).join('')}</div></div>`+
    `<div class="full"><label>Medios de pago habilitados</label><div class="grid cols-3">${['Efectivo','Transferencia','Tarjeta de crédito','Tarjeta de débito','Mercado Pago','QR'].map(x=>`<label class="checkbox-row"><input type="checkbox" name="payments" value="${x}" ${p.payments.includes(x)?'checked':''}> ${x}</label>`).join('')}</div></div>`+noteField('Indicaciones diarias','instructions',p.instructions,true);
  modalForm('point-operation-form',`Operación · ${p.name}`,body,f=>{
    if(command((d,u)=>{
      WBA.requirePermission(u,'Puntos de venta','edit',id);const point=d.points.find(x=>x.id===id),before=WBA.clone(point);
      if(!f.getAll('productIds').length||!f.getAll('payments').length)throw new Error('Habilitá al menos un producto y un medio de pago.');
      Object.assign(point,{dailyTarget:Number(f.get('dailyTarget')),monthlyTarget:Number(f.get('monthlyTarget')),commission:Number(f.get('commission')),minStock:Number(f.get('minStock')),productIds:f.getAll('productIds'),payments:f.getAll('payments'),exchangeRates:{...point.exchangeRates,USD:Number(f.get('usd')),BRL:Number(f.get('brl'))},minimums:{cash:Number(f.get('cash')),transfer:Number(f.get('transfer')),card:Number(f.get('card'))},latitude:f.get('latitude')===''?null:Number(f.get('latitude')),longitude:f.get('longitude')===''?null:Number(f.get('longitude')),locationRadius:Number(f.get('locationRadius')),instructions:f.get('instructions')});
      point.prices={};for(const product of d.products){point.prices[product.id]={};for(const currency of ['ARS','USD','BRL']){const value=f.get(`price-${product.id}-${currency}`);if(value!=='')point.prices[product.id][currency]=Number(value);}}
      WBA.audit(d,u,'Configuró operación del punto',point.id,before,point,'Parámetros para nuevas jornadas y ventas');
    })){closeModal();renderPoints();}
  });
}
const pointEditorBaseline=new Map();
window.wbaPointBridge={
  read(template){
    const records=visibleData().points.map(p=>{
      if(p.advanced)return WBA.clone(p.advanced);
      const a=state.data.allies.find(a=>a.pointIds.includes(p.id)),r=WBA.clone(template);
      Object.assign(r,{id:p.id,createdAt:p.createdAt||'',activeAgreement:({"Porcentaje fijo":'percentage',"Canon mensual fijo":'fixed',"Canon fijo":'fixed',"Esquema mixto":'combined'})[a?.agreement]||'percentage'});
      Object.assign(r.values,{pointName:p.name,pointCode:p.id,city:p.city,address:p.address,internalManager:p.manager,pointState:({Activo:'active',Pausado:'suspended',Finalizado:'finished'})[p.status]||'draft',partnerName:a?.name||p.ally,partnerLegalName:a?.legalName||'',agreementStatus:a?.status==='Activo'?'active':'draft',agreementFrom:a?.validFrom||'',agreementTo:a?.validTo||'',percentageValue:String(a?.percentage||0),fixedValue:String(a?.fixedFee||0),settlementFrequency:({Mensual:'monthly',Quincenal:'fortnightly',Semanal:'weekly'})[a?.frequency]||'monthly'});
      const times=p.schedule?.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
      if(times)r.schedule=r.schedule.map(day=>({...day,open:times[1],close:times[2],shiftCount:'1',shift1Start:times[1],shift1End:times[2]}));
      if(a?.contact)r.contacts=[{name:a.name,role:'Contacto comercial',email:a.contact.includes('@')?a.contact:'',phone:a.contact.includes('@')?'':a.contact}];
      if(r.activeAgreement==='combined')r.combinedRules=[{type:'percentage',label:'Porcentaje',value:String(a.percentage)},{type:'fixed',label:'Canon fijo',value:String(a.fixedFee)}];
      return r;
    });
    pointEditorBaseline.clear();records.forEach(r=>pointEditorBaseline.set(r.id,JSON.stringify(r)));
    return records;
  },
  canDelete(id){
    if(!guard('Puntos de venta','delete',id))return false;
    if(state.data.shifts.some(s=>s.pointId===id)||state.data.sales.some(s=>s.pointId===id)){toast('El punto tiene historial','Pausalo o finalizalo para conservar su trazabilidad.','warning');return false;}
    return true;
  },
  save(records){
    return command((d,u)=>{
      WBA.requirePermission(u,'Puntos de venta','edit');WBA.openPeriod(d);
      const current=d.points.filter(p=>WBA.scope(u,p.id));
      for(const p of current)if(!records.some(r=>r.id===p.id)){
        if(!can('Puntos de venta','delete'))throw new Error('Tu rol no puede dar de baja puntos.');
        if(d.shifts.some(s=>s.pointId===p.id)||d.sales.some(s=>s.pointId===p.id))throw new Error('El punto tiene historial. Pausalo o finalizalo en lugar de eliminarlo.');
        d.points=d.points.filter(x=>x.id!==p.id);WBA.audit(d,u,'Dio de baja punto',p.id,p,'Baja lógica','Punto sin historial');
      }
      for(const r of records){
        if(pointEditorBaseline.get(r.id)===JSON.stringify(r))continue;
        const v=r.values;if(!v.pointName?.trim())throw new Error('El nombre del punto es obligatorio.');
        let p=d.points.find(x=>x.id===r.id);if(p&&!WBA.scope(u,p.id))throw new Error('Punto fuera de alcance.');
        if(p&&JSON.stringify(p.advanced)===JSON.stringify(r))continue;
        if(!p){WBA.requirePermission(u,'Puntos de venta','create');if(u.role==='pointManager')throw new Error('El encargado de punto solo puede consultar los puntos ya asignados.');p={id:r.id,dailyTarget:20,monthlyTarget:500,commission:15,minStock:40};d.points.push(p);}
        const before=WBA.clone(p);
        Object.assign(p,{name:v.pointName.trim(),city:v.city,address:v.address,status:({active:'Activo',suspended:'Pausado',finished:'Finalizado',preparation:'En preparación',draft:'Borrador'})[v.pointState]||'Borrador',manager:v.internalManager,ally:v.partnerName,advanced:WBA.clone(r),schedule:r.schedule.filter(x=>x.operates).map(x=>`${x.day||x.name||''} ${x.open||x.openTime||''}-${x.close||x.closeTime||''}`).join(' · ')});
        if(v.partnerName){
          let a=d.allies.find(a=>a.pointIds.includes(p.id));if(!a){a={id:uid('a'),pointIds:[p.id]};d.allies.push(a);}
          Object.assign(a,{name:v.partnerName,legalName:v.partnerLegalName,contact:r.contacts?.map(c=>c.email||c.phone||c.name).filter(Boolean).join(', '),agreement:({percentage:'Porcentaje fijo',unit:'Ticket / pasajero',fixed:'Canon fijo',combined:'Esquema mixto'})[r.activeAgreement],percentage:Number(v.percentageValue||0),fixedFee:Number(v.fixedValue||0),frequency:v.settlementFrequency,validFrom:v.agreementFrom,validTo:v.agreementTo,status:v.agreementStatus==='active'?'Activo':'Borrador',advanced:WBA.clone(r)});
        }
        WBA.audit(d,u,'Guardó punto avanzado',p.id,before,p,'Horarios, contactos y acuerdo compartidos');
      }
      WBA.migrate(d);
      records.forEach(r=>pointEditorBaseline.set(r.id,JSON.stringify(r)));
    });
  }
};

function showShiftModal() {
  if(!guard('Jornadas','create'))return;
  const body=field('Fecha','date',today(),'date','required')+
    selectField('Fotógrafo','photographerId',state.data.users.filter(u=>u.role==='photographer'&&u.status==='Activo').map(u=>opt(u.id,u.name)).join(''))+
    selectField('Punto de venta','pointId',visibleData().points.filter(p=>p.status==='Activo').map(p=>opt(p.id,p.name)).join(''))+
    field('Inicio','start','09:00','time','required')+field('Fin','end','18:00','time','required')+field('Objetivo diario','target',20,'number','required min="1" step="1"')+
    state.data.materials.map(m=>field(`Asignar ${m.name}`,`assign-${m.id}`,m.expected,'number','required min="0" step="1"')).join('')+
    `<div class="full"><label>Equipos disponibles</label><div class="grid cols-3">${state.data.devices.filter(d=>['Disponible','Devuelto'].includes(d.status)).map(d=>`<label class="checkbox-row"><input type="checkbox" name="deviceIds" value="${d.id}"> ${escapeHtml(d.code+' · '+d.type)}</label>`).join('')||'<p>No hay equipos libres.</p>'}</div></div>`+noteField('Motivo de excepción horaria (si corresponde)','overrideReason')+noteField('Indicaciones para la jornada','notes');
  modalForm('shift-form','Programar jornada y asignar material',body,f=>{
    const assignment=Object.fromEntries(state.data.materials.map(m=>[m.id,Number(f.get(`assign-${m.id}`))]));
    if(command(WBA.schedule,{date:f.get('date'),photographerId:f.get('photographerId'),pointId:f.get('pointId'),start:f.get('start'),end:f.get('end'),target:Number(f.get('target')),assignment,deviceIds:f.getAll('deviceIds'),overrideReason:f.get('overrideReason'),notes:f.get('notes')})){closeModal();renderShifts();}
  },'Guardar jornada');
  const inheritPoint=()=>{
    const point=getPoint(document.getElementById('f-pointId').value),day=point.advanced?.schedule?.[(new Date(document.getElementById('f-date').value+'T12:00:00').getDay()+6)%7];
    document.getElementById('f-target').value=point.dailyTarget;
    if(day){document.getElementById('f-start').value=day.shift1Start||day.open;document.getElementById('f-end').value=point.advanced.values.allowFullShift?day.close:day.shift1End||day.close;}
  };
  document.getElementById('f-pointId').onchange=inheritPoint;
  document.getElementById('f-date').onchange=inheritPoint;
  inheritPoint();
}
function showMaterialAssignment(id) {
  const s=getShift(id);if(!s||!guard('Stock','create',s.pointId))return;
  modalForm('assignment-form',`Asignar materiales · ${getUser(s.photographerId).name}`,state.data.materials.map(m=>field(m.name,m.id,m.expected,'number','required min="0" step="1"')).join(''),f=>{
    const values=Object.fromEntries(state.data.materials.map(m=>[m.id,Number(f.get(m.id))]));
    if(command((d,u)=>WBA.assignMaterials(d,u,d.shifts.find(x=>x.id===id),values))){closeModal();renderRoute();}
  });
}
function renderStock() {
  setTitle('Stock y materiales','Ingresos, transferencias, asignaciones, consumos y devoluciones');
  const d=visibleData();
  document.getElementById('view').innerHTML=`<div class="page-header"><div><h2>Inventario integrado</h2><p>Las ventas descuentan producto y materiales; el cierre devuelve los materiales declarados.</p></div>${can('Stock','create')?'<button class="btn btn-primary" id="new-stock-movement">+ Movimiento</button>':''}</div>
    <section class="card section-gap"><div class="card-header"><h3>Material disponible por punto</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Punto</th><th>Material</th><th>Disponible</th></tr></thead><tbody>${d.materialStock.map(x=>`<tr><td>${escapeHtml(getPoint(x.pointId).name)}</td><td>${escapeHtml(state.data.materials.find(m=>m.id===x.materialId)?.name||x.materialId)}</td><td>${x.available}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="card section-gap"><div class="card-header"><h3>Producto disponible por punto</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Punto</th><th>Producto</th><th>Disponible</th><th>Vendido</th><th>Dañado</th></tr></thead><tbody>${d.stock.map(x=>`<tr><td>${escapeHtml(getPoint(x.pointId).name)}</td><td>${escapeHtml(getProduct(x.productId).name)}</td><td>${x.available}</td><td>${x.sold}</td><td>${x.damaged}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="card section-gap"><div class="card-header"><h3>Movimientos de materiales</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Material</th><th>Tipo</th><th>Cantidad</th><th>Jornada / punto</th><th>Usuario</th></tr></thead><tbody>${d.materialMovements.slice(0,100).map(x=>`<tr><td>${formatDate(x.datetime,true)}</td><td>${escapeHtml(state.data.materials.find(m=>m.id===x.materialId)?.name||x.materialId)}</td><td>${escapeHtml(x.type)}</td><td>${x.qty}</td><td>${escapeHtml(x.shiftId||getPoint(x.pointId).name)}</td><td>${escapeHtml(getUser(x.userId).name)}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="card section-gap"><div class="card-header"><h3>Movimientos de productos</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Origen</th><th>Destino</th><th>Motivo</th></tr></thead><tbody>${d.stockMovements.slice(0,100).map(x=>`<tr><td>${formatDate(x.datetime,true)}</td><td>${escapeHtml(getProduct(x.productId).name)}</td><td>${escapeHtml(x.type)}</td><td>${x.qty}</td><td>${escapeHtml(x.origin||'')}</td><td>${escapeHtml(x.destination||'')}</td><td>${escapeHtml(x.reason||'')}</td></tr>`).join('')}</tbody></table></div></section>`;
  document.getElementById('new-stock-movement')?.addEventListener('click',showStockMovementModal);
}
function showStockMovementModal() {
  if(!guard('Stock','create'))return;
  const options=state.data.products.filter(p=>p.stock).map(p=>opt(`product:${p.id}`,p.name)).concat(state.data.materials.map(m=>opt(`material:${m.id}`,m.name))).join('');
  modalForm('stock-form','Registrar movimiento',selectField('Artículo','item',options)+selectField('Tipo','type',['Ingreso de stock','Transferencia','Daño','Baja','Devolución'].map(x=>opt(x,x)).join(''))+field('Cantidad','qty',1,'number','required min="1" step="1"')+selectField('Punto origen / afectado','pointId',visibleData().points.map(p=>opt(p.id,p.name)).join(''))+selectField('Destino (solo transferencia)','destinationId',opt('','Seleccionar')+visibleData().points.map(p=>opt(p.id,p.name)).join(''))+noteField('Motivo','reason','',true),f=>{
    const [kind,item]=f.get('item').split(':');
    if(command(WBA.stockMovement,{[kind==='material'?'materialId':'productId']:item,type:f.get('type'),qty:Number(f.get('qty')),pointId:f.get('pointId'),destinationId:f.get('destinationId'),reason:f.get('reason')})){closeModal();renderStock();}
  },'Registrar movimiento');
}
function renderCommissions() {
  setTitle('Comisiones y liquidaciones','Ventas cobradas → Rendición → Aprobación → Pago');
  const d=visibleData(),sales=d.sales.filter(v=>v.status==='Cobrada'&&v.datetime.startsWith(today().slice(0,7)));
  document.getElementById('view').innerHTML=`<div class="page-header"><div><h2>Liquidaciones de fotógrafos</h2><p>La comisión se conserva según el punto y las condiciones de cada venta. Las operaciones pendientes de cobro no se liquidan.</p></div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Fotógrafo</th><th>Ventas cobradas ARS</th><th>Comisión estimada</th></tr></thead><tbody>${state.data.users.filter(u=>u.role==='photographer'&&(currentUser().role!=='photographer'||u.id===currentUser().id)).map(u=>{const own=sales.filter(v=>v.photographerId===u.id);return `<tr><td>${escapeHtml(u.name)}</td><td>${money(sum(own,x=>x.totalARS))}</td><td>${money(sum(own,x=>x.commission))}</td></tr>`;}).join('')}</tbody></table></div></div><section class="card section-gap"><div class="card-header"><h3>Liquidaciones por jornada</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Jornada</th><th>Fotógrafo</th><th>Comisión</th><th>Medio</th><th>Estado</th><th></th></tr></thead><tbody>${d.settlements.map(l=>`<tr><td>${escapeHtml(l.shiftId)}</td><td>${escapeHtml(getUser(l.photographerId).name)}</td><td>${money(l.commission)}</td><td>${escapeHtml(l.method)}</td><td>${statusBadge(l.status)}</td><td>${l.status==='Aprobada'&&['direction','admin'].includes(currentUser().role)?`<button class="btn btn-primary pay-settlement" data-id="${l.id}">Registrar pago</button>`:''}</td></tr>`).join('')}</tbody></table></div></section>`;
  document.querySelectorAll('.pay-settlement').forEach(b=>b.onclick=()=>modalForm('payment-form','Registrar pago de liquidación',noteField('Referencia de pago / recibo','reference','',true),f=>{
    if(command((d,u)=>{
      if(!['direction','admin'].includes(u.role))throw new Error('Solo Administración registra pagos.');
      const l=d.settlements.find(l=>l.id===b.dataset.id),s=d.shifts.find(s=>s.id===l.shiftId);WBA.openPeriod(d,s.date);
      if(l.status!=='Aprobada')throw new Error('La liquidación debe estar aprobada.');
      l.status='Pagada';l.paidAt=WBA.time();l.reference=f.get('reference');WBA.audit(d,u,'Pagó liquidación',l.id,'Aprobada','Pagada',l.reference);
    })){closeModal();renderCommissions();}
  },'Confirmar pago'));
}
function renderFinance() {
  setTitle('Finanzas y cierres','Importes ARS con cotización y costo históricos');
  const d=visibleData(),month=today().slice(0,7),sales=d.sales.filter(v=>v.datetime.startsWith(month)&&v.status==='Cobrada'),expenses=d.expenses.filter(e=>e.date.startsWith(month));
  const allyCost=sum(state.data.allySettlements.filter(l=>l.month===month&&l.status==='Aprobada'),l=>l.totalARS);
  const revenue=sum(sales,x=>x.totalARS),commission=sum(sales,x=>x.commission),cost=sum(sales,x=>x.costARS),expense=sum(expenses.filter(e=>e.currency==='ARS'),e=>e.amount),incomplete=sales.filter(v=>!v.historicalComplete).length,foreignExpenses=expenses.filter(e=>e.currency!=='ARS').length;
  document.getElementById('view').innerHTML=`<div class="page-header"><div><h2>Resultado y cierre mensual</h2><p>${month} · ${state.data.closedPeriods.includes(month)?'Cerrado':'Abierto'}. Los importes de distintas monedas se normalizan con la cotización guardada en la venta.</p></div><div class="action-row">${can('Gastos','create')?'<button class="btn btn-secondary" id="new-expense">Registrar gasto</button>':''}${can('Cierres','approve')?'<button class="btn btn-primary" id="monthly-close">Cerrar período</button>':''}</div></div><div class="grid cols-4">${kpiCard('Venta cobrada',money(revenue),'sale','Equivalente ARS histórico')}${kpiCard('Costo de producto',money(cost),'box','Costo histórico registrado')}${kpiCard('Comisiones',money(commission),'trophy','Ventas cobradas')}${kpiCard('Resultado parcial',money(revenue-cost-commission-expense-allyCost),'finance',`Incluye ${money(allyCost)} de acuerdos revisados`)}</div>${incomplete||foreignExpenses?`<div class="callout section-gap"><strong>Resultado parcial</strong><p>${incomplete} ventas heredadas sin costo histórico completo y ${foreignExpenses} gastos en moneda extranjera sin cotización histórica. No se reconstruyen con valores actuales.</p></div>`:''}<div class="card section-gap"><div class="card-header"><h3>Gastos registrados</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Punto</th><th>Descripción</th><th>Importe</th><th>Estado</th></tr></thead><tbody>${expenses.map(e=>`<tr><td>${formatDate(e.date)}</td><td>${escapeHtml(getPoint(e.pointId).name)}</td><td>${escapeHtml(e.description)}</td><td>${money(e.amount,e.currency)}</td><td>${statusBadge(e.status)}</td></tr>`).join('')}</tbody></table></div></div>`;
  document.getElementById('new-expense')?.addEventListener('click',showExpenseModal);
  document.getElementById('monthly-close')?.addEventListener('click',showMonthlyClose);
}
function showMonthlyClose() {
  if(!guard('Cierres','approve'))return;
  modalForm('period-form','Cerrar período mensual',field('Período','month',today().slice(0,7),'month','required')+'<p class="full">Se exige aprobar todas las jornadas, confirmar cobros, resolver solicitudes y pagar liquidaciones. El cierre bloquea las operaciones ordinarias del período.</p>',f=>{
    if(command(WBA.closePeriod,f.get('month'))){closeModal();renderFinance();}
  },'Confirmar cierre');
}
function exportReport(type) {
  const module=({sales:'Ventas',shifts:'Jornadas',renditions:'Rendiciones',stock:'Stock',commissions:'Comisiones',expenses:'Gastos',audit:'Auditoría',points:'Puntos de venta'})[type];
  if(!module||!can(module,'export')){toast('Exportación no habilitada','Tu rol no permite exportar estos registros.','warning');return;}
  const d=visibleData();let rows=[];
  if(type==='sales')rows=d.sales.map(s=>({id:s.id,fecha:s.datetime,jornada:s.shiftId,fotografo:getUser(s.photographerId).name,punto:getPoint(s.pointId).name,unidades:saleUnits(s),medio:s.payment,moneda:s.currency,total:s.total,cotizacionARS:s.exchangeRateARS,totalARS:s.totalARS,costoARS:s.costARS??'Sin histórico',comisionARS:s.commission,estado:s.status}));
  if(type==='shifts')rows=d.shifts.map(s=>({id:s.id,fecha:s.date,fotografo:getUser(s.photographerId).name,punto:getPoint(s.pointId).name,inicio:s.start,fin:s.end,objetivo:s.target,estado:s.status}));
  if(type==='renditions')rows=d.renditions.flatMap(r=>Object.entries(r.currencies||{ARS:r.expected}).map(([currency,expected])=>({jornada:r.shiftId,moneda:currency,esperado:expected,declarado:r.declaredCurrencies?.[currency]??r.declared,diferencia:r.currencyDifferences?.[currency]??r.difference,comisionARS:r.commission,estado:r.status})));
  if(type==='stock')rows=d.stock.map(s=>({producto:getProduct(s.productId).name,punto:getPoint(s.pointId).name,disponible:s.available,vendido:s.sold,danado:s.damaged}));
  if(type==='commissions')rows=d.settlements.map(x=>({id:x.id,jornada:x.shiftId,fotografo:getUser(x.photographerId).name,comisionARS:x.commission,medio:x.method,estado:x.status}));
  if(type==='expenses')rows=d.expenses;
  if(type==='audit')rows=d.audit.map(a=>({fecha:a.datetime,usuario:getUser(a.userId).name,accion:a.action,entidad:a.entity,anterior:a.before,nuevo:a.after,motivo:a.reason}));
  if(type==='points')rows=d.points.map(p=>({punto:p.name,ciudad:p.city,estado:p.status,objetivo:p.monthlyTarget}));
  // Partners cannot receive personnel commissions or cost details in sales CSVs.
  if(currentUser().role==='partner')rows=rows.map(({comisionARS,costoARS,...safe})=>safe);
  exportCSV(`reporte_${type}.csv`,rows);
}
function renderPartnerDashboard() {
  setTitle('Mi punto comercial','Ventas del punto asociado y acuerdo comercial');
  const d=visibleData(),sales=d.sales.filter(s=>s.status==='Cobrada');
  document.getElementById('view').innerHTML=`<div class="page-header"><h2>Actividad del punto asociado</h2></div><div class="grid cols-2">${d.points.map(p=>{const own=sales.filter(s=>s.pointId===p.id);return `<section class="card"><div class="card-header"><h3>${escapeHtml(p.name)}</h3></div><div class="card-body"><p>Productos vendidos: ${sum(own,saleUnits)}</p><p>Facturación cobrada ARS: ${money(sum(own,v=>v.totalARS))}</p></div></section>`;}).join('')}</div>`;
}

function applyReadOnlyControls() {
  const module=WBA.routeModules[state.route],edit=can(module,'edit'),create=can(module,'create'),exportAllowed=can(module,'export');
  if(!create)document.querySelectorAll('#view [id^="new-"],#view #new-sale-dashboard,#view #photo-new-sale').forEach(b=>{b.disabled=true;b.title='Tu rol no permite crear registros';});
  if(!edit)document.querySelectorAll('#view [class*="edit-"],#view .start-shift,#view .close-shift,#view #config-goals').forEach(b=>{b.disabled=true;b.title='Consulta sin edición';});
  if(!exportAllowed)document.querySelectorAll('#view [id^="export-"]').forEach(b=>b.disabled=true);
  if(!['direction','admin','auditor'].includes(currentUser().role))document.querySelectorAll('.kpi-card').forEach(card=>{if(/Resultado|Rentabilidad/.test(card.querySelector('.kpi-label')?.textContent||''))card.remove();});
  if(currentUser().role==='partner')document.querySelectorAll('.kpi-card').forEach(card=>{if(/Comisión/.test(card.querySelector('.kpi-label')?.textContent||''))card.remove();});
  // The dedicated photographer screen manages its own workflow buttons.
  if(state.route==='fotografo')return;
  document.querySelectorAll('.annul-sale').forEach(b=>{
    if(!['direction','admin','manager','pointManager'].includes(currentUser().role))b.remove();
    else if(['manager','pointManager'].includes(currentUser().role))b.textContent='Solicitar ajuste';
  });
  if(state.route==='ventas'&&['direction','admin'].includes(currentUser().role))document.querySelectorAll('.sale-detail').forEach(b=>{
    const sale=visibleData().sales.find(s=>s.id===b.dataset.id);if(sale?.status!=='Pendiente de cobro')return;
    if(b.parentNode.querySelector('.confirm-collection'))return;
    const button=document.createElement('button');button.className='btn btn-secondary btn-sm confirm-collection';button.textContent='Confirmar cobro';
    button.onclick=()=>modalForm('collection-form','Confirmar cobro',noteField('Referencia del comprobante','reference','',true),f=>{if(command(WBA.collect,sale.id,f.get('reference'))){closeModal();renderRoute();}});
    b.parentNode.appendChild(button);
  });
}
function showNotifications() {
  const u=currentUser(),events=state.data.notifications.filter(n=>n.recipient===u.role||n.recipient==='manager'&&['manager','pointManager','admin','direction'].includes(u.role)).filter(n=>!n.pointId||WBA.scope(u,n.pointId));
  const incidents=visibleData().incidents;
  showModal({title:'Alertas e incidencias',subtitle:'Seguimiento de la operación compartida',body:`<div class="alert-list">${getAlerts().map(alertTemplate).join('')}</div><h4>Notificaciones</h4>${events.map(n=>`<p>${escapeHtml(n.text)} · ${formatDate(n.datetime,true)}</p>`).join('')||'<p>Sin notificaciones.</p>'}<h4>Incidencias del equipo</h4>${incidents.map(i=>`<p><strong>${escapeHtml(getPoint(i.pointId).name)} · ${escapeHtml(i.category)}</strong>: ${escapeHtml(i.detail)} ${statusBadge(i.status)} ${['direction','admin','manager','pointManager'].includes(u.role)&&i.status==='Pendiente'?`<button class="btn btn-secondary resolve-incident" data-id="${i.id}">Resolver</button>`:''}</p>`).join('')}`});
  document.querySelectorAll('.resolve-incident').forEach(b=>b.onclick=()=>modalForm('resolve-incident-form','Resolver incidencia',noteField('Resolución','reason','',true),f=>{
    if(command((d,u)=>{
      const i=d.incidents.find(x=>x.id===b.dataset.id);WBA.requirePermission(u,'Jornadas','edit',i.pointId);
      if(!['direction','admin','manager','pointManager'].includes(u.role))throw new Error('Solo supervisión resuelve incidencias.');
      i.status='Resuelta';i.resolution=f.get('reason');i.resolvedBy=u.id;i.resolvedAt=WBA.time();WBA.audit(d,u,'Resolvió incidencia',i.id,'Pendiente','Resuelta',i.resolution);
    })){closeModal();renderRoute();}
  }));
}
function showUserModal(id='') {
  if(!guard('Usuarios',id?'edit':'create'))return;
  const u=state.data.users.find(u=>u.id===id)||{name:'',email:'',role:'photographer',status:'Activo',points:[],city:'Buenos Aires',notes:''};
  const eligible=Object.entries(roles).filter(([r])=>currentUser().role==='direction'||r!=='direction');
  modalForm('user-form',id?'Editar usuario':'Nuevo usuario',field('Nombre','name',u.name,'text','required')+field('Email','email',u.email,'email','required')+field(id?'Nueva contraseña demo (vacío conserva actual)':'Contraseña demo','password','','password',id?'':'required minlength="4"')+selectField('Rol','role',eligible.map(([key,r])=>opt(key,r.label,u.role)).join(''))+selectField('Estado','status',['Activo','Inactivo','Bloqueado'].map(x=>opt(x,x,u.status)).join(''))+field('Ciudad','city',u.city||'Buenos Aires')+`<div class="full"><label>Puntos asignados</label><div class="grid cols-3">${state.data.points.map(p=>`<label class="checkbox-row"><input type="checkbox" name="points" value="${p.id}" ${u.points.includes(p.id)?'checked':''}> ${escapeHtml(p.name)}</label>`).join('')}</div></div>`+noteField('Observaciones','notes',u.notes),f=>{
    if(command((d,actor)=>{
      WBA.requirePermission(actor,'Usuarios',id?'edit':'create');const existing=d.users.find(x=>x.id===id);
      if(actor.role!=='direction'&&(f.get('role')==='direction'||existing?.role==='direction'))throw new Error('Solo Dirección administra cuentas de Dirección.');
      if(id===actor.id&&(f.get('role')!==actor.role||f.get('status')!=='Activo'))throw new Error('No podés cambiar tu propio rol ni desactivar tu acceso.');
      const email=f.get('email').trim().toLowerCase();if(d.users.some(x=>x.id!==id&&x.email.toLowerCase()===email))throw new Error('El correo ya existe.');
      const points=f.getAll('points');if(['photographer','pointManager','partner'].includes(f.get('role'))&&!points.length)throw new Error('Asigná al menos un punto para este rol.');
      const before=existing?{name:existing.name,email:existing.email,role:existing.role,status:existing.status,points:existing.points}:'-';
      const user={...existing,id:id||uid('u'),name:f.get('name').trim(),email,password:f.get('password')||existing?.password,role:f.get('role'),status:f.get('status'),points,city:f.get('city'),notes:f.get('notes')};
      if(existing)Object.assign(existing,user);else d.users.push(user);
      WBA.audit(d,actor,id?'Actualizó usuario':'Creó usuario',user.id,before,{name:user.name,email:user.email,role:user.role,status:user.status,points:user.points},'Administración de accesos');
    })){closeModal();renderUsers();}
  });
}
function showWeatherModal(shift) {
  if(!guard('Jornadas','edit',shift.pointId))return;
  modalForm('weather-form','Informar clima',selectField('Condición','weather',['Soleado','Parcialmente nublado','Nublado','Lluvia','Frío intenso','Calor intenso','Viento fuerte'].map(x=>opt(x,x,shift.weather)).join(''))+noteField('Observaciones','notes'),f=>{
    if(command((d,u)=>{const s=d.shifts.find(s=>s.id===shift.id);if(!WBA.own(u,s))throw new Error('Jornada ajena.');WBA.requirePermission(u,'Jornadas','edit',s.pointId);WBA.openPeriod(d,s.date);const old=s.weather;s.weather=f.get('weather');s.notes=f.get('notes');WBA.audit(d,u,'Actualizó clima',s.id,old,s.weather,s.notes||'Condición operativa');})){closeModal();renderRoute();}
  });
}
function showProductModal(id='') {
  if(!guard('Productos y precios',id?'edit':'create'))return;
  const p=getProduct(id),existing=state.data.products.find(p=>p.id===id);
  modalForm('product-form',id?'Editar producto':'Nuevo producto',field('Nombre','name',existing?.name||'','text','required')+selectField('Tipo','type',['Digital','Impreso','Combo','Premium','Regalo','Otro'].map(x=>opt(x,x,p.type)).join(''))+selectField('Control de stock','stock',opt('false','No',String(!!p.stock))+opt('true','Sí',String(!!p.stock)))+selectField('Estado','active',opt('true','Activo',String(p.active!==false))+opt('false','Inactivo',String(p.active!==false)))+field('Costo ARS','cost',existing?.cost||0,'number','min="0" required')+field('Precio base ARS','price',existing?.price||'','number','min="0.01" required')+`<div class="full"><h4>Material consumido por cada unidad vendida</h4><div class="form-grid cols-3">${state.data.materials.map(m=>field(m.name,`recipe-${m.id}`,p.recipe?.[m.id]||0,'number','required min="0" step="1"')).join('')}</div><p class="muted">La comisión se toma de la configuración del punto y se guarda en cada venta. Cambiar precio, costo o receta afecta únicamente ventas nuevas.</p></div>`,f=>{
    if(command((d,u)=>{
      WBA.requirePermission(u,'Productos y precios',id?'edit':'create');WBA.openPeriod(d);
      let product=d.products.find(p=>p.id===id);const before=product?WBA.clone(product):'-';
      if(!product){product={id:uid('pr'),priceHistory:[],commission:0};d.products.push(product);}
      Object.assign(product,{name:f.get('name').trim(),type:f.get('type'),stock:f.get('stock')==='true',active:f.get('active')==='true',cost:Number(f.get('cost')),price:Number(f.get('price')),recipe:Object.fromEntries(d.materials.map(m=>[m.id,Number(f.get(`recipe-${m.id}`))]).filter(([,qty])=>qty>0))});
      product.priceHistory.unshift({datetime:WBA.time(),userId:u.id,price:product.price,cost:product.cost,recipe:WBA.clone(product.recipe)});
      WBA.audit(d,u,id?'Actualizó producto':'Creó producto',product.id,before,product,'Condiciones para nuevas ventas');
    })){closeModal();renderProducts();}
  });
}
function renderAllies() {
  setTitle('Aliados y acuerdos','Acuerdos del editor avanzado vinculados al punto');
  const full=['direction','admin','partner','auditor'].includes(currentUser().role);
  document.getElementById('view').innerHTML=`<div class="page-header"><div><h2>Aliados comerciales</h2><p>Los contactos, vigencias y reglas se administran en Puntos de venta y se conservan completos.</p></div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Aliado</th><th>Puntos</th>${full?'<th>Acuerdo</th><th>Condiciones</th><th>Vigencia</th>':''}<th>Estado</th><th></th></tr></thead><tbody>${visibleData().allies.map(a=>`<tr><td>${escapeHtml(a.name)}<span class="cell-subtitle">${escapeHtml(a.contact||'')}</span></td><td>${a.pointIds.filter(id=>WBA.scope(currentUser(),id)).map(id=>escapeHtml(getPoint(id).name)).join(', ')}</td>${full?`<td>${escapeHtml(a.agreement)}</td><td>${a.percentage||0}% · Canon ${money(a.fixedFee||0)}<span class="cell-subtitle">${a.advanced?.activeAgreement==='combined'?'Reglas combinadas: revisión administrativa requerida':a.advanced?.activeAgreement==='unit'?`${escapeHtml(a.advanced.values.unitValue)} ${escapeHtml(a.advanced.values.unitCurrency)} por ${escapeHtml(a.advanced.values.unitType)}`:''}</span></td><td>${formatDate(a.validFrom)} — ${formatDate(a.validTo)}</td>`:''}<td>${statusBadge(a.status)}</td><td>${['direction','admin'].includes(currentUser().role)?`<button class="btn btn-secondary settle-ally" data-id="${a.id}">Revisar liquidación</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>${full?`<div class="card section-gap"><div class="card-header"><h3>Liquidaciones comerciales revisadas</h3></div><div class="card-body">${state.data.allySettlements.filter(l=>visibleData().allies.some(a=>a.id===l.allyId)).map(l=>`<p>${escapeHtml(state.data.allies.find(a=>a.id===l.allyId)?.name)} · ${l.month} · ${money(l.value,l.currency)} · ${statusBadge(l.status)}</p>`).join('')||'<p>Sin liquidaciones revisadas.</p>'}</div></div>`:''}`;
  document.querySelectorAll('.settle-ally').forEach(b=>b.onclick=()=>showAllySettlement(b.dataset.id));
}
function showAllySettlement(id) {
  const ally=state.data.allies.find(a=>a.id===id);if(!ally||!['direction','admin'].includes(currentUser().role))return;
  const sales=state.data.sales.filter(s=>ally.pointIds.includes(s.pointId)&&s.status==='Cobrada'&&s.datetime.startsWith(today().slice(0,7)));
  const suggestion=ally.agreement==='Porcentaje fijo'?sum(sales,s=>s.totalARS)*ally.percentage/100:ally.agreement==='Canon fijo'||ally.agreement==='Canon mensual fijo'?ally.fixedFee:'';
  modalForm('ally-settlement-form',`Revisar liquidación · ${ally.name}`,field('Período','month',today().slice(0,7),'month','required')+selectField('Moneda','currency',['ARS','USD','BRL'].map(x=>opt(x,x)).join(''))+field('Importe revisado','value',suggestion,'number','required min="0" step="0.01"')+field('Cotización ARS','rate',1,'number','required min="0.000001" step="any"')+noteField('Cálculo, unidades y referencia documental','reference','',true)+'<p class="full">El importe debe revisarse contra el acuerdo vigente. Los esquemas por ticket/pasajero, combinados, límites y prorrateos requieren un cálculo documentado; no se interpreta texto libre como una fórmula. La liquidación aprobada se incorpora a finanzas.</p>',f=>{
    if(f.get('currency')==='ARS'&&Number(f.get('rate'))!==1){toast('La cotización ARS debe ser 1','','warning');return;}
    if(command(WBA.settleAlly,{allyId:id,month:f.get('month'),value:Number(f.get('value')),currency:f.get('currency'),exchangeRateARS:Number(f.get('rate')),reference:f.get('reference')})){closeModal();renderAllies();}
  },'Aprobar importe revisado');
}
window.addEventListener('storage',event=>{
  if(event.key===STORAGE_KEY&&event.newValue){state.data=WBA.migrate(JSON.parse(event.newValue));closeModal();render();toast('Datos actualizados','Se recibieron cambios de otra pestaña.');}
});
