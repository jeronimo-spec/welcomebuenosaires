'use strict';

const STORAGE_KEY = 'welcomeBA.app.v1';
const SESSION_KEY = 'welcomeBA.session.v1';

const icons = {
  dashboard: '<path d="M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  sale: '<path d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M7 9H6v1M17 15h1v-1"/>',
  box: '<path d="m21 8-9 5-9-5 9-5 9 5Z"/><path d="m3 8 9 5 9-5M3 8v8l9 5 9-5V8M12 13v8"/>',
  device: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M10 18h4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  building: '<path d="M3 21h18M5 21V5l7-3 7 3v16M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"/>',
  tag: '<path d="M20 13 13 20a2 2 0 0 1-3 0l-7-7V3h10l7 7a2 2 0 0 1 0 3Z"/><circle cx="8" cy="8" r="1"/>',
  handshake: '<path d="m11 17 2 2a2 2 0 0 0 3-3l-3-3M14 14l1 1a2 2 0 0 0 3-3l-4-4a4 4 0 0 0-5 0L4 13"/><path d="m2 11 6 6M16 5l6 6"/>',
  finance: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  report: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  warning: '<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3M15 3h5v18h-5"/>',
  camera: '<path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3Z"/><circle cx="12" cy="13" r="4"/>',
  refresh: '<path d="M20 11a8 8 0 1 0 1 5M20 4v7h-7"/>',
  archive: '<path d="M3 6h18M5 6v14h14V6M8 10h8M4 3h16v3H4z"/>',
  audit: '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>',
  trend: '<path d="m3 17 6-6 4 4 8-9M15 6h6v6"/>'
};

function icon(name, size = 20) {
  return `<span class="icon" style="width:${size}px;height:${size}px"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.dashboard}</svg></span>`;
}

const roles = {
  direction: { label: 'Dirección / Super Admin', groups: ['general','operacion','gestion','administracion','configuracion'] },
  admin: { label: 'Administración', groups: ['general','operacion','gestion','administracion'] },
  manager: { label: 'Encargado General', groups: ['general','operacion','gestion'] },
  pointManager: { label: 'Encargado de Punto', groups: ['general','operacion','gestion'] },
  photographer: { label: 'Fotógrafo', groups: ['fotografo'] },
  partner: { label: 'Aliado Comercial', groups: ['general','configuracion'] },
  auditor: { label: 'Auditor / Consulta', groups: ['general','administracion'] }
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', group: 'general' },
  { id: 'jornadas', label: 'Jornadas', icon: 'calendar', group: 'operacion' },
  { id: 'ventas', label: 'Ventas', icon: 'sale', group: 'operacion' },
  { id: 'rendiciones', label: 'Rendiciones', icon: 'cash', group: 'operacion', badge: () => state.data.renditions.filter(r => ['Pendiente','Con diferencia','Presentada'].includes(r.status)).length },
  { id: 'stock', label: 'Stock', icon: 'box', group: 'operacion' },
  { id: 'dispositivos', label: 'Dispositivos', icon: 'device', group: 'operacion' },
  { id: 'objetivos', label: 'Objetivos y ranking', icon: 'target', group: 'gestion' },
  { id: 'comisiones', label: 'Comisiones', icon: 'trophy', group: 'gestion' },
  { id: 'finanzas', label: 'Finanzas y cierres', icon: 'finance', group: 'administracion' },
  { id: 'reportes', label: 'Reportes', icon: 'report', group: 'administracion' },
  { id: 'puntos', label: 'Puntos de venta', icon: 'building', group: 'configuracion' },
  { id: 'productos', label: 'Productos', icon: 'tag', group: 'configuracion' },
  { id: 'aliados', label: 'Aliados y acuerdos', icon: 'handshake', group: 'configuracion' },
  { id: 'usuarios', label: 'Usuarios y roles', icon: 'users', group: 'configuracion' },
  { id: 'auditoria', label: 'Auditoría', icon: 'shield', group: 'configuracion' },
  { id: 'ajustes', label: 'Solicitudes de ajuste', icon: 'audit', group: 'administracion' },
  { id: 'fotografo', label: 'Mi jornada', icon: 'camera', group: 'fotografo' }
];

const navGroups = {
  general: 'Resumen', operacion: 'Operación', gestion: 'Gestión comercial', administracion: 'Administración', configuracion: 'Configuración', fotografo: 'Operación móvil'
};

function seedData() {
  const today = isoDate(new Date());
  const yesterday = isoDate(new Date(Date.now() - 86400000));
  return {
    company: { name: 'Welcome Buenos Aires', baseCurrency: 'ARS', currentMonth: today.slice(0,7), monthlyStatus: 'Abierto' },
    points: [
      { id: 'p1', name: 'Mirador Obelisco', city: 'Buenos Aires', address: 'Av. Corrientes 1386', status: 'Activo', manager: 'Jonatan', dailyTarget: 50, monthlyTarget: 1200, commission: 15, minStock: 80, ally: 'Mirador Obelisco', schedule: '09:00 - 20:00' },
      { id: 'p2', name: 'City Bus', city: 'Buenos Aires', address: 'Circuito turístico', status: 'Activo', manager: 'Jonatan', dailyTarget: 35, monthlyTarget: 820, commission: 22, minStock: 60, ally: 'Buenos Aires Bus', schedule: '09:00 - 19:00' },
      { id: 'p3', name: 'Sturla - Tigre', city: 'Tigre', address: 'Estación Fluvial', status: 'Activo', manager: 'Jonatan', dailyTarget: 15, monthlyTarget: 360, commission: 20, minStock: 35, ally: 'Sturla Viajes', schedule: '09:00 - 17:30' },
      { id: 'p4', name: 'Escalinata', city: 'Buenos Aires', address: 'Obelisco', status: 'Activo', manager: 'Jonatan', dailyTarget: 25, monthlyTarget: 620, commission: 20, minStock: 45, ally: 'Welcome BA', schedule: '10:00 - 19:00' },
      { id: 'p5', name: 'Caminito / Esquina', city: 'Buenos Aires', address: 'La Boca', status: 'Pausado', manager: 'Jonatan', dailyTarget: 20, monthlyTarget: 500, commission: 20, minStock: 40, ally: 'Esquina Caminito', schedule: '10:00 - 18:00' }
    ],
    products: [
      { id: 'pr1', name: 'Foto digital', type: 'Digital', stock: false, cost: 0, price: 15000, active: true, commission: 20 },
      { id: 'pr2', name: 'Foto impresa 15x20', type: 'Impreso', stock: true, cost: 1800, price: 18000, active: true, commission: 20 },
      { id: 'pr3', name: 'Combo digital + impresa', type: 'Combo', stock: true, cost: 1800, price: 25000, active: true, commission: 20 },
      { id: 'pr4', name: 'Pack 3 impresas', type: 'Premium', stock: true, cost: 5400, price: 42000, active: true, commission: 18 },
      { id: 'pr5', name: 'Postal turística', type: 'Impreso', stock: true, cost: 900, price: 9000, active: true, commission: 25 }
    ],
    users: [
      { id: 'u1', name: 'Jerónimo Dramisino', email: 'admin@welcome.com', password: 'welcome2026', role: 'direction', status: 'Activo', points: [] },
      { id: 'u2', name: 'Jonatan', email: 'jonatan@welcome.com', password: 'welcome2026', role: 'manager', status: 'Activo', points: ['p1','p2','p3','p4','p5'] },
      { id: 'u3', name: 'Valentín', email: 'fotografo@welcome.com', password: 'welcome2026', role: 'photographer', status: 'Activo', points: ['p1'] },
      { id: 'u4', name: 'Fabricio', email: 'fabri@welcome.com', password: 'welcome2026', role: 'photographer', status: 'Activo', points: ['p2'] },
      { id: 'u5', name: 'Rocío', email: 'rocio@welcome.com', password: 'welcome2026', role: 'photographer', status: 'Activo', points: ['p1'] },
      { id: 'u6', name: 'Martín', email: 'martin@welcome.com', password: 'welcome2026', role: 'photographer', status: 'Activo', points: ['p4'] },
      { id: 'u7', name: 'Jime', email: 'jime@welcome.com', password: 'welcome2026', role: 'photographer', status: 'Activo', points: ['p1'] },
      { id: 'u8', name: 'Zoe', email: 'zoe@welcome.com', password: 'welcome2026', role: 'photographer', status: 'Activo', points: ['p2'] },
      { id: 'u9', name: 'Cande', email: 'cande@welcome.com', password: 'welcome2026', role: 'photographer', status: 'Activo', points: ['p2'] },
      { id: 'u10', name: 'Juan', email: 'juan@welcome.com', password: 'welcome2026', role: 'photographer', status: 'Activo', points: ['p3'] },
      { id: 'u11', name: 'Auditor', email: 'auditor@welcome.com', password: 'welcome2026', role: 'auditor', status: 'Activo', points: [] }
    ],
    shifts: [
      { id: 'j1', date: today, photographerId: 'u3', pointId: 'p1', start: '09:00', end: '18:00', managerId: 'u2', target: 50, stockAssigned: 60, weather: 'Soleado', status: 'En curso', notes: '' },
      { id: 'j2', date: today, photographerId: 'u4', pointId: 'p2', start: '09:15', end: '18:00', managerId: 'u2', target: 35, stockAssigned: 45, weather: 'Soleado', status: 'En curso', notes: '' },
      { id: 'j3', date: today, photographerId: 'u6', pointId: 'p4', start: '11:00', end: '19:00', managerId: 'u2', target: 25, stockAssigned: 35, weather: 'Parcialmente nublado', status: 'Iniciada', notes: '' },
      { id: 'j4', date: today, photographerId: 'u10', pointId: 'p3', start: '09:15', end: '17:30', managerId: 'u2', target: 15, stockAssigned: 25, weather: 'Soleado', status: 'Programada', notes: '' },
      { id: 'j5', date: yesterday, photographerId: 'u5', pointId: 'p1', start: '09:00', end: '18:00', managerId: 'u2', target: 50, stockAssigned: 60, weather: 'Nublado', status: 'Validada por encargado', notes: '' }
    ],
    sales: [
      { id: 'v1001', datetime: `${today}T10:12:00`, shiftId: 'j1', photographerId: 'u3', pointId: 'p1', items: [{productId:'pr3', qty:1, price:25000}], currency:'ARS', payment:'Efectivo', discount:0, surcharge:0, total:25000, status:'Cobrada', commission:5000, notes:'' },
      { id: 'v1002', datetime: `${today}T10:34:00`, shiftId: 'j1', photographerId: 'u3', pointId: 'p1', items: [{productId:'pr2', qty:2, price:18000}], currency:'ARS', payment:'Mercado Pago', discount:0, surcharge:0, total:36000, status:'Cobrada', commission:7200, notes:'' },
      { id: 'v1003', datetime: `${today}T11:02:00`, shiftId: 'j2', photographerId: 'u4', pointId: 'p2', items: [{productId:'pr1', qty:1, price:15000}], currency:'ARS', payment:'Tarjeta de crédito', discount:0, surcharge:1500, total:16500, status:'Cobrada', commission:3300, notes:'' },
      { id: 'v1004', datetime: `${today}T11:28:00`, shiftId: 'j2', photographerId: 'u4', pointId: 'p2', items: [{productId:'pr5', qty:3, price:9000}], currency:'ARS', payment:'Efectivo', discount:1500, surcharge:0, total:25500, status:'Cobrada', commission:6375, notes:'' },
      { id: 'v1005', datetime: `${today}T12:15:00`, shiftId: 'j3', photographerId: 'u6', pointId: 'p4', items: [{productId:'pr3', qty:1, price:25000}], currency:'ARS', payment:'Transferencia', discount:0, surcharge:0, total:25000, status:'Pendiente de cobro', commission:5000, notes:'Pendiente comprobante' },
      { id: 'v1006', datetime: `${today}T12:40:00`, shiftId: 'j1', photographerId: 'u3', pointId: 'p1', items: [{productId:'pr4', qty:1, price:42000}], currency:'ARS', payment:'Tarjeta de débito', discount:0, surcharge:0, total:42000, status:'Cobrada', commission:7560, notes:'' },
      { id: 'v1007', datetime: `${today}T13:10:00`, shiftId: 'j2', photographerId: 'u4', pointId: 'p2', items: [{productId:'pr2', qty:1, price:18000}], currency:'ARS', payment:'QR', discount:0, surcharge:0, total:18000, status:'Cobrada', commission:3960, notes:'' },
      { id: 'v0999', datetime: `${yesterday}T16:45:00`, shiftId: 'j5', photographerId: 'u5', pointId: 'p1', items: [{productId:'pr3', qty:2, price:25000}], currency:'ARS', payment:'Efectivo', discount:0, surcharge:0, total:50000, status:'Cobrada', commission:10000, notes:'' }
    ],
    stock: [
      { productId:'pr2', pointId:'p1', available:112, assigned:60, sold:18, damaged:1 },
      { productId:'pr3', pointId:'p1', available:95, assigned:45, sold:14, damaged:0 },
      { productId:'pr5', pointId:'p2', available:38, assigned:30, sold:22, damaged:2 },
      { productId:'pr2', pointId:'p2', available:76, assigned:45, sold:13, damaged:0 },
      { productId:'pr3', pointId:'p3', available:28, assigned:25, sold:7, damaged:0 },
      { productId:'pr2', pointId:'p4', available:31, assigned:35, sold:10, damaged:1 }
    ],
    stockMovements: [
      { id:'m1', datetime:`${today}T08:35:00`, productId:'pr2', qty:60, type:'Asignación a jornada', origin:'Depósito central', destination:'Mirador Obelisco / Valentín', userId:'u2', status:'Confirmado', reason:'Inicio de jornada j1' },
      { id:'m2', datetime:`${today}T08:45:00`, productId:'pr5', qty:30, type:'Asignación a punto', origin:'Depósito central', destination:'City Bus', userId:'u2', status:'Confirmado', reason:'Reposición diaria' },
      { id:'m3', datetime:`${yesterday}T18:20:00`, productId:'pr2', qty:1, type:'Daño', origin:'Mirador Obelisco', destination:'Baja', userId:'u5', status:'Pendiente validación', reason:'Impresión defectuosa' }
    ],
    devices: [
      { id:'d1', code:'CAM-001', type:'Cámara', model:'Canon EOS R10', status:'En uso', responsibleId:'u3', pointId:'p1', notes:'' },
      { id:'d2', code:'TAB-002', type:'Tablet', model:'Samsung Tab A8', status:'Asignado', responsibleId:'u4', pointId:'p2', notes:'' },
      { id:'d3', code:'IMP-003', type:'Impresora', model:'DNP DS-RX1HS', status:'En uso', responsibleId:'u2', pointId:'p1', notes:'Mantenimiento preventivo pendiente' },
      { id:'d4', code:'CAM-004', type:'Cámara', model:'Sony A6400', status:'En reparación', responsibleId:null, pointId:null, notes:'Revisión de obturador' },
      { id:'d5', code:'BAT-011', type:'Batería externa', model:'Anker 20K', status:'Disponible', responsibleId:null, pointId:null, notes:'' }
    ],
    renditions: [
      { id:'r1', shiftId:'j5', expected:50000, declared:50000, difference:0, cash:50000, cards:0, transfers:0, stockReturned:42, stockMissing:0, equipmentReturned:true, status:'Validada por encargado', photographerNotes:'', managerNotes:'Sin diferencias' },
      { id:'r2', shiftId:'j1', expected:103000, declared:0, difference:-103000, cash:0, cards:0, transfers:0, stockReturned:0, stockMissing:0, equipmentReturned:false, status:'Pendiente', photographerNotes:'', managerNotes:'' },
      { id:'r3', shiftId:'j2', expected:60000, declared:0, difference:-60000, cash:0, cards:0, transfers:0, stockReturned:0, stockMissing:0, equipmentReturned:false, status:'Pendiente', photographerNotes:'', managerNotes:'' }
    ],
    expenses: [
      { id:'g1', date:today, category:'Insumos', description:'Papel fotográfico', pointId:'p1', amount:185000, currency:'ARS', status:'Pagado' },
      { id:'g2', date:today, category:'Transporte', description:'Traslado de equipos', pointId:'p2', amount:28000, currency:'ARS', status:'Pendiente' },
      { id:'g3', date:yesterday, category:'Reparaciones', description:'Service impresora', pointId:'p1', amount:65000, currency:'ARS', status:'Pagado' }
    ],
    allies: [
      { id:'a1', name:'Mirador Obelisco', legalName:'Mirador BA S.A.', contact:'operaciones@mirador.com', pointIds:['p1'], agreement:'Porcentaje fijo', percentage:15, fixedFee:0, frequency:'Mensual', validFrom:'2026-01-01', status:'Activo' },
      { id:'a2', name:'Buenos Aires Bus', legalName:'BA Bus S.R.L.', contact:'administracion@babus.com', pointIds:['p2'], agreement:'Esquema mixto', percentage:20, fixedFee:250000, frequency:'Mensual', validFrom:'2026-03-01', status:'Activo' },
      { id:'a3', name:'Sturla Viajes', legalName:'Sturla S.A.', contact:'comercial@sturla.com', pointIds:['p3'], agreement:'Porcentaje fijo', percentage:18, fixedFee:0, frequency:'Quincenal', validFrom:'2026-02-01', status:'Activo' }
    ],
    audit: [
      { id:'au1', datetime:`${today}T13:10:12`, userId:'u4', action:'Registró venta', entity:'Venta v1007', before:'-', after:'ARS 18.000 / QR', reason:'Operación normal' },
      { id:'au2', datetime:`${today}T12:15:22`, userId:'u6', action:'Registró venta pendiente', entity:'Venta v1005', before:'-', after:'ARS 25.000 / Transferencia', reason:'Pendiente comprobante' },
      { id:'au3', datetime:`${today}T09:15:03`, userId:'u4', action:'Inició jornada', entity:'Jornada j2', before:'Programada', after:'En curso', reason:'Inicio operativo' },
      { id:'au4', datetime:`${today}T08:35:40`, userId:'u2', action:'Asignó stock', entity:'Movimiento m1', before:'Depósito', after:'Jornada j1', reason:'Inicio de jornada' }
    ]
  };
}

const state = {
  data: loadData(),
  session: loadSession(),
  route: 'dashboard',
  sidebarOpen: false,
  filters: {}
};

function loadData() {
  try { return WBA.migrate(JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedData()); }
  catch { return WBA.migrate(seedData()); }
}
function saveData() { const previous=state.data.revision||0;state.data.revision=previous+1;try{localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));}catch(e){state.data.revision=previous;throw e;} }
function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
function saveSession() { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session)); }
function clearSession() { sessionStorage.removeItem(SESSION_KEY); state.session = null; }

function isoDate(date = new Date()) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0,10);
}
function today() { return isoDate(new Date()); }
function formatDate(value, withTime = false) {
  if (!value) return '—';
  const date = value.includes('T') ? new Date(value) : new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('es-AR', withTime ? { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' } : { day:'2-digit', month:'2-digit', year:'numeric' }).format(date);
}
function money(value, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style:'currency', currency, maximumFractionDigits: currency === 'ARS' ? 0 : 2 }).format(Number(value || 0));
}
function number(value) { return new Intl.NumberFormat('es-AR').format(Number(value || 0)); }
function percent(value) { return `${Math.round(Number(value || 0))}%`; }
function uid(prefix) { return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`; }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function getUser(id) { return state.data.users.find(x => x.id === id) || { name:'Sin asignar', role:'auditor' }; }
function getPoint(id) { return state.data.points.find(x => x.id === id) || { name:'Sin punto', dailyTarget:0, minStock:0 }; }
function getProduct(id) { return state.data.products.find(x => x.id === id) || { name:'Producto', price:0, cost:0 }; }
function getShift(id) { return state.data.shifts.find(x => x.id === id); }
function currentUser() { return state.session ? state.data.users.find(x=>x.id===state.session.userId && x.status==='Activo') || null : null; }
function initials(name = '') { return name.split(/\s+/).map(x => x[0]).join('').slice(0,2).toUpperCase(); }
function sum(list, selector) { return list.reduce((acc, item) => acc + Number(selector(item) || 0), 0); }
function salesForDate(date = today()) { return visibleData().sales.filter(s => s.datetime.slice(0,10) === date && s.status !== 'Anulada'); }
function saleUnits(sale) { return sum(sale.items, item => item.qty); }
function shiftSales(shiftId) { return visibleData().sales.filter(s => s.shiftId === shiftId && s.status !== 'Anulada'); }
function roleLabel(role) { return roles[role]?.label || role; }
function statusBadge(status) {
  const s = String(status || '').toLowerCase();
  let type = 'neutral';
  if (/(activo|cobrada|cerrada|validada|aprobada|confirmado|disponible|corregido)/.test(s)) type = 'success';
  else if (/(pendiente|programada|iniciada|en curso|revisión|asignado|presentada)/.test(s)) type = 'warning';
  else if (/(diferencia|anulada|crítico|reparación|faltante|observada|bloqueado)/.test(s)) type = 'danger';
  else if (/(pausado|bonificada|devuelto)/.test(s)) type = 'info';
  return `<span class="badge ${type}"><span class="badge-dot"></span>${escapeHtml(status || 'Sin estado')}</span>`;
}
function roleBadge(role) { return `<span class="badge violet">${escapeHtml(roleLabel(role))}</span>`; }

function toast(title, message = '', type = '') {
  const root = document.getElementById('toast-root');
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.innerHTML = `<div>${icon(type === 'danger' ? 'warning' : 'check', 22)}</div><div><strong>${escapeHtml(title)}</strong>${message ? `<span>${escapeHtml(message)}</span>` : ''}</div>`;
  root.appendChild(node);
  setTimeout(() => node.remove(), 3600);
}

function addAudit(action, entity, before, after, reason) {
  state.data.audit.unshift({ id:uid('au'), datetime:new Date().toISOString().slice(0,19), userId:currentUser()?.id || 'u1', action, entity, before, after, reason });
  saveData();
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

function render() {
  const app = document.getElementById('app');
  if (!state.session || !currentUser()) {
    app.innerHTML = loginTemplate();
    bindLogin();
    return;
  }
  const user = currentUser();
  if (user.role === 'photographer' && state.route === 'dashboard') state.route = 'fotografo';
  app.innerHTML = shellTemplate(user);
  bindShell();
  renderRoute();
}


function loginTemplate() {
  return `<main class="login-page">
    <section class="login-visual">
      <div class="login-brand"><div class="brand-mark">W</div><div>WELCOME BUENOS AIRES</div></div>
      <div class="login-copy">
        <h1>La operación completa, en tiempo real.</h1>
        <p>Ventas, jornadas, stock, objetivos, rendiciones, comisiones y resultados en una única plataforma diseñada para escalar.</p>
      </div>
      <div class="login-points">
        <div class="login-point"><strong>Operación móvil</strong><span>Registro de ventas y cierre de jornada desde el celular.</span></div>
        <div class="login-point"><strong>Control total</strong><span>Trazabilidad de stock, cobros, rendiciones y equipamiento.</span></div>
        <div class="login-point"><strong>Decisiones con datos</strong><span>Dashboards comerciales y financieros en tiempo real.</span></div>
      </div>
    </section>
    <section class="login-panel">
      <div class="login-card">
        <div class="login-brand" style="color:#0f172a;margin-bottom:28px"><div class="brand-mark">W</div><div>WELCOME BA <span style="display:block;color:#64748b;font-size:11px;margin-top:2px">PLATAFORMA DE GESTIÓN</span></div></div>
        <h2>Ingresar al sistema</h2>
        <p>Accedé con tu usuario para visualizar los módulos habilitados según tu rol.</p>
        <form id="login-form">
          <div class="form-field"><label>Correo electrónico</label><input class="input" name="email" type="email" value="admin@welcome.com" autocomplete="username" required /></div>
          <div class="form-field" style="margin-top:14px"><label>Contraseña</label><input class="input" name="password" type="password" value="welcome2026" autocomplete="current-password" required /></div>
          <button class="btn btn-primary btn-lg btn-block" style="margin-top:20px" type="submit">${icon('shield')} Ingresar</button>
        </form>
        <div class="demo-accounts">
          <strong>Accesos de demostración</strong>
          <p><b>Dirección:</b> admin@welcome.com</p>
          <p><b>Encargado:</b> jonatan@welcome.com</p>
          <p><b>Fotógrafo:</b> fotografo@welcome.com</p>
          <p><b>Auditor:</b> auditor@welcome.com</p>
          <p>Contraseña para todos: <b>welcome2026</b></p>
        </div>
      </div>
    </section>
  </main>`;
}

function bindLogin() {
  document.getElementById('login-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim().toLowerCase();
    const password = String(form.get('password') || '');
    const user = state.data.users.find(u => u.email.toLowerCase() === email && u.password === password && u.status === 'Activo');
    if (!user) return toast('No se pudo ingresar', 'Revisá el correo, contraseña o estado del usuario.', 'danger');
    state.session = { userId:user.id, loginAt:new Date().toISOString() };
    state.route = user.role === 'photographer' ? 'fotografo' : 'dashboard';
    saveSession();
    addAudit('Inicio de sesión', `Usuario ${user.name}`, '-', 'Sesión iniciada', 'Acceso correcto');
    render();
  });
}

function allowedNav(user) {
  return navItems.filter(item=>{
    if(user.role==='photographer')return item.id==='fotografo';
    if(item.id==='fotografo')return false;
    if(user.role==='partner'&&!['dashboard','aliados','reportes'].includes(item.id))return false;
    return can(WBA.routeModules[item.id]||'Reportes');
  });
}

function shellTemplate(user) {
  const items = allowedNav(user);
  const grouped = Object.entries(navGroups).map(([group,label]) => {
    const groupItems = items.filter(i => i.group === group);
    if (!groupItems.length) return '';
    return `<div class="nav-group"><div class="nav-label">${label}</div><div class="nav-list">${groupItems.map(navItemTemplate).join('')}</div></div>`;
  }).join('');
  return `<div class="app-shell">
    ${state.sidebarOpen ? '<div class="sidebar-overlay" id="sidebar-overlay"></div>' : ''}
    <aside class="sidebar ${state.sidebarOpen ? 'open' : ''}" id="sidebar">
      <div class="sidebar-brand"><div class="brand-mark">W</div><div class="brand-copy"><strong>Welcome Buenos Aires</strong><span>Gestión integral</span></div></div>
      <nav>${grouped}</nav>
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-card-top"><div class="avatar">${initials(user.name)}</div><div><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(roleLabel(user.role))}</span></div></div>
          <div class="user-actions">${user.role==='direction'?'<button id="switch-role">Cambiar vista</button>':''}<button id="logout-btn">Salir</button></div>
        </div>
      </div>
    </aside>
    <section class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="btn btn-secondary btn-icon mobile-menu" id="mobile-menu">${icon('menu')}</button>
          <div class="breadcrumb"><h1 id="route-title">Dashboard</h1><p id="route-subtitle">Información actualizada de la operación</p></div>
        </div>
        <div class="topbar-actions">
          <div class="period-chip">${icon('calendar',16)} ${new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(new Date())}</div>
          <button class="btn btn-secondary btn-icon notification-btn" id="notifications-btn" title="Alertas">${icon('bell')}<span class="notification-dot"></span></button>
        </div>
      </header>
      <main class="content" id="view"></main>
    </section>
  </div>`;
}

function navItemTemplate(item) {
  const badge = typeof item.badge === 'function' ? item.badge() : null;
  return `<button class="nav-item ${state.route === item.id ? 'active' : ''}" data-route="${item.id}">${icon(item.icon)}<span>${item.label}</span>${badge ? `<span class="nav-badge">${badge}</span>` : ''}</button>`;
}

function bindShell() {
  document.querySelectorAll('[data-route]').forEach(btn => btn.addEventListener('click', () => {
    state.route = btn.dataset.route;
    state.sidebarOpen = false;
    render();
  }));
  document.getElementById('logout-btn').addEventListener('click', () => {
    addAudit('Cierre de sesión', `Usuario ${currentUser().name}`, 'Sesión activa', 'Sesión cerrada', 'Salida manual');
    clearSession();
    render();
  });
  document.getElementById('switch-role')?.addEventListener('click', showRoleSwitcher);
  document.getElementById('mobile-menu')?.addEventListener('click', () => { state.sidebarOpen = !state.sidebarOpen; render(); });
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => { state.sidebarOpen = false; render(); });
  document.getElementById('notifications-btn')?.addEventListener('click', showNotifications);
}

function setTitle(title, subtitle) {
  document.getElementById('route-title').textContent = title;
  document.getElementById('route-subtitle').textContent = subtitle;
}

function renderRoute() {
  const allowed=allowedNav(currentUser());
  if(!allowed.some(x=>x.id===state.route))state.route=allowed[0]?.id||'dashboard';
  const routes = {
    ajustes: renderAdjustments,
    dashboard: currentUser().role==='partner'?renderPartnerDashboard:renderDashboard,
    jornadas: renderShifts,
    ventas: renderSales,
    rendiciones: renderRenditions,
    stock: renderStock,
    dispositivos: renderDevices,
    objetivos: renderGoals,
    comisiones: renderCommissions,
    finanzas: renderFinance,
    reportes: renderReports,
    puntos: renderPoints,
    productos: renderProducts,
    aliados: renderAllies,
    usuarios: renderUsers,
    auditoria: renderAudit,
    fotografo: renderPhotographer
  };
  (routes[state.route] || renderDashboard)();
  applyReadOnlyControls();
}

function showModal({ title, subtitle = '', body, footer = '', size = '' }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop" id="modal-backdrop"><section class="modal ${size}"><header class="modal-header"><div><h3>${escapeHtml(title)}</h3>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div><button class="close-btn" id="modal-close">${icon('close')}</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-footer">${footer}</footer>` : ''}</section></div>`;
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', event => { if (event.target.id === 'modal-backdrop') closeModal(); });
}
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

function showRoleSwitcher() {
  if(currentUser()?.role!=='direction')return;
  const users = state.data.users.filter(u => u.status === 'Activo');
  showModal({ title:'Cambiar vista de demostración', subtitle:'Permite probar los permisos y pantallas de cada rol.', size:'modal-sm', body:`<div class="grid">${users.map(u => `<button class="btn btn-secondary btn-lg w-100 demo-user" data-user="${u.id}" style="justify-content:flex-start"><div class="avatar">${initials(u.name)}</div><div style="text-align:left"><strong style="display:block">${escapeHtml(u.name)}</strong><span class="muted" style="font-size:11px">${escapeHtml(roleLabel(u.role))}</span></div></button>`).join('')}</div>` });
  document.querySelectorAll('.demo-user').forEach(btn => btn.addEventListener('click', () => {
    state.session = { userId:btn.dataset.user, loginAt:new Date().toISOString() };
    state.route = getUser(btn.dataset.user).role === 'photographer' ? 'fotografo' : 'dashboard';
    saveSession(); closeModal(); render();
  }));
}

function getAlerts() {
  const alerts = [];
  const currentSales = salesForDate();
  visibleData().shifts.filter(s => s.date === today()).forEach(s => {
    const sales = shiftSales(s.id);
    if (s.status === 'Programada' && s.start < new Date().toTimeString().slice(0,5)) alerts.push({ type:'danger', title:`${getUser(s.photographerId).name} no inició jornada`, detail:`${getPoint(s.pointId).name} · horario ${s.start}`, time:'Hoy' });
    if (['Iniciada','En curso'].includes(s.status) && sales.length === 0) alerts.push({ type:'warning', title:'Jornada abierta sin ventas', detail:`${getUser(s.photographerId).name} · ${getPoint(s.pointId).name}`, time:'Hoy' });
  });
  visibleData().stock.forEach(item => {
    const point = getPoint(item.pointId);
    if (item.available < point.minStock) alerts.push({ type:'danger', title:'Stock crítico', detail:`${getProduct(item.productId).name} en ${point.name}: ${item.available} disponibles`, time:'Ahora' });
  });
  visibleData().renditions.filter(r => ['Con diferencia','Pendiente'].includes(r.status)).forEach(r => {
    const shift = getShift(r.shiftId);
    if (r.status === 'Con diferencia') alerts.push({ type:'danger', title:'Rendición con diferencia', detail:`${getUser(shift.photographerId).name} · ${money(Math.abs(r.difference))}`, time:'Pendiente' });
  });
  if (currentSales.some(s => s.status === 'Pendiente de cobro')) alerts.push({ type:'warning', title:'Venta pendiente de cobro', detail:'Hay ventas del día que todavía no fueron confirmadas.', time:'Hoy' });
  return alerts.slice(0,8);
}

function alertTemplate(a) {
  return `<div class="alert-item ${a.type}"><div class="alert-icon">${icon(a.type === 'danger' ? 'warning' : a.type === 'info' ? 'bell' : 'clock')}</div><div class="alert-copy"><strong>${escapeHtml(a.title)}</strong><span>${escapeHtml(a.detail)}</span></div><div class="alert-time">${escapeHtml(a.time)}</div></div>`;
}

function renderDashboard() {
  setTitle('Dashboard de dirección', 'Vista consolidada de la operación comercial y financiera');
  const view = document.getElementById('view');
  const daySales = salesForDate();
  const activeShifts = visibleData().shifts.filter(s => s.date === today() && ['Iniciada','En curso'].includes(s.status));
  const dayRevenue = sum(daySales, s=>s.totalARS);
  const dayUnits = sum(daySales, saleUnits);
  const dayTarget = sum(visibleData().shifts.filter(s => s.date === today()), s => s.target);
  const compliance = dayTarget ? (dayUnits / dayTarget) * 100 : 0;
  const pendingRenditions = visibleData().renditions.filter(r => ['Pendiente','Presentada','Con diferencia'].includes(r.status)).length;
  const alerts = getAlerts();
  const expensesToday = sum(visibleData().expenses.filter(e => e.date === today()), e => e.amount);
  const collected=daySales.filter(s=>s.status==='Cobrada');
  const resultToday = sum(collected,s=>s.totalARS) - expensesToday - sum(collected,s=>s.commission) - sum(collected,s=>s.costARS);
  const pointRows = visibleData().points.filter(p => p.status !== 'Cerrado').map(point => {
    const ps = daySales.filter(s => s.pointId === point.id);
    const units = sum(ps, saleUnits);
    const pct = point.dailyTarget ? Math.min(100, (units / point.dailyTarget) * 100) : 0;
    return `<div class="point-card card">
      <div class="point-head"><div class="point-name"><span class="point-dot" style="background:${point.status === 'Activo' ? '#16a34a' : '#d97706'}"></span><div><h4>${escapeHtml(point.name)}</h4><small>${escapeHtml(point.city)} · ${escapeHtml(point.schedule)}</small></div></div>${statusBadge(point.status)}</div>
      <div class="point-metrics"><div class="point-metric"><span>Ventas</span><strong>${units}</strong></div><div class="point-metric"><span>Facturación</span><strong>${money(sum(ps,s=>s.totalARS))}</strong></div><div class="point-metric"><span>Objetivo</span><strong>${Math.round(pct)}%</strong></div></div>
      <div class="progress ${pct >= 100 ? 'success' : pct < 50 ? 'danger' : 'warning'}" style="margin-top:14px"><span style="width:${pct}%"></span></div>
    </div>`;
  }).join('');
  const ranking = photographerRanking(daySales);
  const dailySeries = last7DaysSeries();
  view.innerHTML = `
    <div class="page-header"><div><h2>Resumen ejecutivo</h2><p>Indicadores del ${formatDate(today())}. Los datos se actualizan con cada operación registrada.</p></div><div class="action-row"><button class="btn btn-secondary" id="refresh-dashboard">${icon('refresh')} Actualizar</button><button class="btn btn-primary" id="new-sale-dashboard">${icon('plus')} Registrar venta</button></div></div>
    <section class="grid cols-5">
      ${kpiCard('Facturación del día', money(dayRevenue), 'sale', '+12,4% vs. promedio', 'up')}
      ${kpiCard('Productos vendidos', number(dayUnits), 'camera', `${number(dayTarget - dayUnits > 0 ? dayTarget - dayUnits : 0)} faltantes para la meta`, compliance >= 100 ? 'up' : '')}
      ${kpiCard('Cumplimiento diario', percent(compliance), 'target', `${number(dayTarget)} productos objetivo`, compliance >= 100 ? 'up' : compliance < 50 ? 'down' : '')}
      ${kpiCard('Jornadas activas', number(activeShifts.length), 'calendar', `${visibleData().shifts.filter(s => s.date === today()).length} programadas hoy`, '')}
      ${kpiCard('Resultado parcial', money(resultToday), 'finance', 'Costos históricos disponibles; antes de aliados', resultToday >= 0 ? 'up' : 'down')}
    </section>
    <section class="grid cols-3" style="margin-top:18px">
      <div class="card" style="grid-column:span 2"><div class="card-header"><div><h3>Facturación últimos 7 días</h3><p>Evolución diaria de ventas cobradas y pendientes</p></div><span class="badge info">ARS</span></div><div class="card-body">${lineChart(dailySeries)}</div></div>
      <div class="card"><div class="card-header"><div><h3>Ranking del día</h3><p>Productos vendidos por fotógrafo</p></div><button class="btn btn-ghost btn-sm" data-route="objetivos">Ver todo</button></div><div class="card-body">${rankingTemplate(ranking.slice(0,5))}</div></div>
    </section>
    <section style="margin-top:18px"><div class="page-header" style="margin-bottom:12px"><div><h2 style="font-size:18px">Puntos de venta</h2><p>Avance contra el objetivo diario por ubicación.</p></div></div><div class="grid cols-3">${pointRows}</div></section>
    <section class="grid cols-2" style="margin-top:18px">
      <div class="card"><div class="card-header"><div><h3>Alertas operativas</h3><p>Situaciones que requieren seguimiento</p></div><span class="badge ${alerts.length ? 'danger' : 'success'}">${alerts.length}</span></div><div class="card-body">${alerts.length ? `<div class="alert-list">${alerts.slice(0,5).map(alertTemplate).join('')}</div>` : '<div class="empty-state"><div class="icon-box">'+icon('check',30)+'</div><h3>Operación sin alertas</h3><p>No hay situaciones críticas registradas.</p></div>'}</div></div>
      <div class="card"><div class="card-header"><div><h3>Control administrativo</h3><p>Pendientes de validación y cierre</p></div></div><div class="card-body"><div class="stat-list">
        ${statProgress('Rendiciones pendientes', pendingRenditions, 10, pendingRenditions > 4 ? 'danger' : 'warning')}
        ${statProgress('Ventas pendientes de cobro', daySales.filter(s=>s.status==='Pendiente de cobro').length, Math.max(daySales.length,1), 'warning')}
        ${statProgress('Stock crítico', visibleData().stock.filter(s=>s.available < getPoint(s.pointId).minStock).length, visibleData().stock.length, 'danger')}
        ${statProgress('Dispositivos en reparación', visibleData().devices.filter(d=>d.status==='En reparación').length, visibleData().devices.length, 'warning')}
      </div></div></div>
    </section>`;
  document.getElementById('refresh-dashboard').addEventListener('click', () => { renderDashboard(); toast('Dashboard actualizado', 'Los indicadores fueron recalculados.', 'success'); });
  document.getElementById('new-sale-dashboard').addEventListener('click', showSaleModal);
  view.querySelectorAll('[data-route]').forEach(btn => btn.addEventListener('click', () => { state.route = btn.dataset.route; render(); }));
}

function kpiCard(label, value, iconName, foot, trend = '') {
  return `<article class="card kpi-card"><div class="kpi-top"><span class="kpi-label">${escapeHtml(label)}</span><div class="kpi-icon">${icon(iconName)}</div></div><div class="kpi-value">${value}</div><div class="kpi-foot">${trend ? `<span class="trend ${trend}">${trend === 'up' ? '↗' : '↘'}</span>` : ''}<span>${escapeHtml(foot)}</span></div></article>`;
}
function statProgress(label, value, max, type='') {
  const pct = max ? Math.min(100, value / max * 100) : 0;
  return `<div class="stat-row"><div class="stat-row-label"><strong>${escapeHtml(label)}</strong><span>${number(value)} registros</span></div><div class="progress ${type}"><span style="width:${pct}%"></span></div><div class="stat-row-value">${number(value)}</div></div>`;
}
function photographerRanking(sales = visibleData().sales) {
  return visibleData().users.filter(u => u.role === 'photographer').map(user => {
    const us = sales.filter(s => s.photographerId === user.id && s.status !== 'Anulada');
    return { user, units:sum(us,saleUnits), revenue:sum(us,s=>s.totalARS), commission:sum(us,s=>s.commission) };
  }).sort((a,b) => b.units - a.units || b.revenue - a.revenue);
}
function rankingTemplate(rows) {
  if (!rows.length) return '<div class="empty-state"><p>No hay ventas para calcular el ranking.</p></div>';
  return `<div class="ranking">${rows.map((r,i)=>`<div class="rank-row"><div class="rank-number">${i+1}</div><div class="avatar">${initials(r.user.name)}</div><div class="rank-copy"><strong>${escapeHtml(r.user.name)}</strong><span>${money(r.revenue)} facturados</span></div><div class="rank-value"><strong>${r.units}</strong><span>ventas</span></div></div>`).join('')}</div>`;
}
function last7DaysSeries() {
  const rows = [];
  for (let i=6;i>=0;i--) {
    const d = new Date(Date.now() - i*86400000);
    const date = isoDate(d);
    rows.push({ label:new Intl.DateTimeFormat('es-AR',{weekday:'short'}).format(d), value:sum(salesForDate(date),s=>s.totalARS) });
  }
  return rows;
}
function lineChart(series) {
  const width = 800, height = 220, padX = 46, padY = 28;
  const max = Math.max(...series.map(x=>x.value),1);
  const points = series.map((item,i)=>({ x:padX + i*((width-padX*2)/(series.length-1 || 1)), y:height-padY - item.value/max*(height-padY*2), ...item }));
  const line = points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${points[points.length-1].x} ${height-padY} L ${points[0].x} ${height-padY} Z`;
  const grid = [0,.25,.5,.75,1].map(v => { const y=height-padY-v*(height-padY*2); return `<line class="chart-grid-line" x1="${padX}" y1="${y}" x2="${width-padX}" y2="${y}"/><text class="chart-label" x="0" y="${y+3}">${number(max*v)}</text>`; }).join('');
  return `<div class="chart-wrap"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/></linearGradient></defs>${grid}<path class="chart-area" d="${area}"/><path class="chart-line" d="${line}"/>${points.map(p=>`<circle class="chart-point" cx="${p.x}" cy="${p.y}" r="4"/><text class="chart-label" x="${p.x}" y="${height-5}" text-anchor="middle">${escapeHtml(p.label)}</text>`).join('')}</svg></div>`;
}

function renderShifts() {
  setTitle('Jornadas', 'Programación, inicio, seguimiento y cierre operativo');
  const view = document.getElementById('view');
  const filterDate = state.filters.shiftDate || today();
  const filterStatus = state.filters.shiftStatus || '';
  const rows = visibleData().shifts.filter(s => (!filterDate || s.date === filterDate) && (!filterStatus || s.status === filterStatus));
  view.innerHTML = `<div class="page-header"><div><h2>Gestión de jornadas</h2><p>Cada venta debe quedar asociada a una jornada activa, un fotógrafo y un punto de venta.</p></div><div class="action-row"><button class="btn btn-secondary" id="export-shifts">${icon('download')} Exportar</button><button class="btn btn-primary" id="new-shift">${icon('plus')} Nueva jornada</button></div></div>
    <div class="card"><div class="card-body"><div class="toolbar"><div class="filter-row"><input class="input" id="shift-date" type="date" value="${filterDate}"><select class="select" id="shift-status"><option value="">Todos los estados</option>${['Programada','Iniciada','En curso','Cerrada por fotógrafo','Observada','Validada por encargado','Aprobada por administración'].map(s=>`<option ${filterStatus===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="muted" style="font-size:11px">${rows.length} jornadas encontradas</div></div></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Fotógrafo</th><th>Punto</th><th>Horario</th><th>Objetivo</th><th>Ventas</th><th>Facturación</th><th>Estado</th><th></th></tr></thead><tbody>${rows.length ? rows.map(s=>{
      const sales=shiftSales(s.id), units=sum(sales,saleUnits), revenue=sum(sales,x=>x.totalARS);
      return `<tr><td><span class="cell-title">${formatDate(s.date)}</span><span class="cell-subtitle">${escapeHtml(s.weather || 'Sin clima')}</span></td><td><span class="cell-title">${escapeHtml(getUser(s.photographerId).name)}</span></td><td><span class="cell-title">${escapeHtml(getPoint(s.pointId).name)}</span></td><td>${escapeHtml(s.start)} – ${escapeHtml(s.end)}</td><td><span class="cell-title">${units} / ${s.target}</span><div class="progress ${units>=s.target?'success':'warning'}" style="margin-top:6px;width:110px"><span style="width:${Math.min(100,units/s.target*100)}%"></span></div></td><td>${units}</td><td>${money(revenue)}</td><td>${statusBadge(s.status)}</td><td><div class="table-actions">${can('Stock','create')&&!Object.keys(s.materialAssignment).length?`<button class="btn btn-secondary btn-sm assign-material" data-id="${s.id}">Asignar material</button>`:''}${can('Jornadas','edit')&&['Iniciada','En curso'].includes(s.status)&&!s.toolsConfirmed?`<button class="btn btn-secondary btn-sm prepare-material" data-id="${s.id}">Preparar caja</button>`:''}<button class="btn btn-secondary btn-sm view-shift" data-id="${s.id}">${icon('eye',15)}</button>${s.status==='Programada'?`<button class="btn btn-primary btn-sm start-shift" data-id="${s.id}">${icon('play',15)} Iniciar</button>`:''}${['Iniciada','En curso'].includes(s.status)?`<button class="btn btn-warning btn-sm close-shift" data-id="${s.id}">${icon('check',15)} Cerrar</button>`:''}</div></td></tr>`;
    }).join('') : '<tr><td colspan="9" class="table-empty">No hay jornadas para los filtros seleccionados.</td></tr>'}</tbody></table></div></div>`;
  document.querySelectorAll('.assign-material').forEach(b=>b.onclick=()=>showMaterialAssignment(b.dataset.id));
  document.querySelectorAll('.prepare-material').forEach(b=>b.onclick=()=>prepareShift(b.dataset.id));
  document.getElementById('shift-date').addEventListener('change', e => { state.filters.shiftDate=e.target.value; renderShifts(); });
  document.getElementById('shift-status').addEventListener('change', e => { state.filters.shiftStatus=e.target.value; renderShifts(); });
  document.getElementById('new-shift').addEventListener('click', showShiftModal);
  document.getElementById('export-shifts').addEventListener('click',()=>exportReport('shifts'));
  document.querySelectorAll('.start-shift').forEach(btn=>btn.addEventListener('click',()=>startShift(btn.dataset.id)));
  document.querySelectorAll('.close-shift').forEach(btn=>btn.addEventListener('click',()=>closeShift(btn.dataset.id)));
  document.querySelectorAll('.view-shift').forEach(btn=>btn.addEventListener('click',()=>showShiftDetail(btn.dataset.id)));
}

function showShiftDetail(id) { const s=getShift(id), sales=shiftSales(id), units=sum(sales,saleUnits); showModal({title:`Jornada ${id}`,subtitle:`${getUser(s.photographerId).name} · ${getPoint(s.pointId).name}`,body:`<div class="grid cols-3"><div class="point-metric"><span>Fecha</span><strong>${formatDate(s.date)}</strong></div><div class="point-metric"><span>Horario</span><strong>${s.start} – ${s.end}</strong></div><div class="point-metric"><span>Estado</span><strong>${s.status}</strong></div><div class="point-metric"><span>Ventas</span><strong>${units}</strong></div><div class="point-metric"><span>Facturación</span><strong>${money(sum(sales,x=>x.total))}</strong></div><div class="point-metric"><span>Comisión estimada</span><strong>${money(sum(sales,x=>x.commission))}</strong></div></div><div style="margin-top:18px"><h4>Ventas asociadas</h4>${sales.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Hora</th><th>Productos</th><th>Medio</th><th>Total</th><th>Estado</th></tr></thead><tbody>${sales.map(v=>`<tr><td>${v.datetime.slice(11,16)}</td><td>${saleUnits(v)}</td><td>${v.payment}</td><td>${money(v.total)}</td><td>${statusBadge(v.status)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Todavía no tiene ventas.</p>'}</div>`}); }

function renderSales() {
  setTitle('Ventas', 'Registro, seguimiento y auditoría de operaciones');
  const view=document.getElementById('view');
  const query=(state.filters.salesQuery||'').toLowerCase();
  const status=state.filters.salesStatus||'';
  const date=state.filters.salesDate||today();
  const rows=visibleData().sales.filter(s=>(!date||s.datetime.slice(0,10)===date)&&(!status||s.status===status)&&(!query||[s.id,getUser(s.photographerId).name,getPoint(s.pointId).name,s.payment].join(' ').toLowerCase().includes(query))).sort((a,b)=>b.datetime.localeCompare(a.datetime));
  const revenue=sum(rows.filter(s=>s.status!=='Anulada'),s=>s.totalARS), units=sum(rows.filter(s=>s.status!=='Anulada'),saleUnits);
  view.innerHTML=`<div class="page-header"><div><h2>Registro de ventas</h2><p>Consulta operaciones por fecha, fotógrafo, punto, medio de pago y estado.</p></div><div class="action-row"><button class="btn btn-secondary" id="export-sales">${icon('download')} Exportar</button><button class="btn btn-primary" id="new-sale">${icon('plus')} Nueva venta</button></div></div>
  <section class="grid cols-4" style="margin-bottom:18px">${kpiCard('Facturación filtrada',money(revenue),'sale',`${rows.length} operaciones`)}${kpiCard('Productos vendidos',number(units),'camera','Cantidad total')}${kpiCard('Ticket promedio',money(rows.length?revenue/rows.length:0),'cash','Por operación')}${kpiCard('Comisión estimada',money(sum(rows.filter(s=>s.status==='Cobrada'),s=>s.commission)),'trophy','Según condiciones históricas')}</section>
  <div class="card"><div class="card-body"><div class="toolbar"><div class="filter-row"><div class="search-box">${icon('search',16)}<input class="input" id="sales-query" placeholder="Buscar venta, fotógrafo o punto" value="${escapeHtml(state.filters.salesQuery||'')}"></div><input class="input" id="sales-date" type="date" value="${date}"><select class="select" id="sales-status"><option value="">Todos los estados</option>${['Registrada','Cobrada','Pendiente de cobro','Bonificada','Anulada','Observada'].map(s=>`<option ${status===s?'selected':''}>${s}</option>`).join('')}</select></div><span class="muted" style="font-size:11px">${rows.length} operaciones</span></div></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Venta</th><th>Fotógrafo</th><th>Punto</th><th>Productos</th><th>Medio de pago</th><th>Total</th><th>Comisión</th><th>Estado</th><th></th></tr></thead><tbody>${rows.length?rows.map(s=>`<tr><td><span class="cell-title">${s.id}</span><span class="cell-subtitle">${formatDate(s.datetime,true)}</span></td><td>${escapeHtml(getUser(s.photographerId).name)}</td><td>${escapeHtml(getPoint(s.pointId).name)}</td><td><span class="cell-title">${saleUnits(s)} unidades</span><span class="cell-subtitle">${s.items.map(i=>`${i.qty}× ${escapeHtml(i.name||getProduct(i.productId).name)}`).join(', ')}</span></td><td>${escapeHtml(s.payment)}</td><td><span class="cell-title">${money(s.total,s.currency)}</span>${s.discount?`<span class="cell-subtitle text-success">Desc. ${money(s.discount,s.currency)}</span>`:''}${s.surcharge?`<span class="cell-subtitle text-warning">Rec. ${money(s.surcharge,s.currency)}</span>`:''}</td><td>${money(s.commission)}</td><td>${statusBadge(s.status)}</td><td><div class="table-actions"><button class="btn btn-secondary btn-sm sale-detail" data-id="${s.id}">${icon('eye',15)}</button>${s.status!=='Anulada'&&currentUser().role!=='auditor'?`<button class="btn btn-danger btn-sm annul-sale" data-id="${s.id}">${icon('trash',15)}</button>`:''}</div></td></tr>`).join(''):'<tr><td colspan="9" class="table-empty">No se encontraron ventas.</td></tr>'}</tbody></table></div></div>`;
  document.getElementById('new-sale').addEventListener('click',showSaleModal);
  document.getElementById('export-sales').addEventListener('click',()=>exportReport('sales'));
  document.getElementById('sales-query').addEventListener('input',e=>{state.filters.salesQuery=e.target.value;renderSales();applyReadOnlyControls();});
  document.getElementById('sales-date').addEventListener('change',e=>{state.filters.salesDate=e.target.value;renderSales();applyReadOnlyControls();});
  document.getElementById('sales-status').addEventListener('change',e=>{state.filters.salesStatus=e.target.value;renderSales();applyReadOnlyControls();});
  document.querySelectorAll('.sale-detail').forEach(b=>b.addEventListener('click',()=>showSaleDetail(b.dataset.id)));
  document.querySelectorAll('.annul-sale').forEach(b=>b.addEventListener('click',()=>showAnnulSale(b.dataset.id)));
}

function activeShiftOptions(user=currentUser()) {
  let shifts=visibleData().shifts.filter(s=>s.date===today()&&['Iniciada','En curso'].includes(s.status));
  if(user.role==='photographer') shifts=shifts.filter(s=>s.photographerId===user.id);
  return shifts;
}
function showSaleDetail(id){const s=state.data.sales.find(x=>x.id===id);if(!s)return;showModal({title:`Venta ${s.id}`,subtitle:`${formatDate(s.datetime,true)} · ${getPoint(s.pointId).name}`,body:`<div class="grid cols-3"><div class="point-metric"><span>Fotógrafo</span><strong>${escapeHtml(getUser(s.photographerId).name)}</strong></div><div class="point-metric"><span>Medio de pago</span><strong>${escapeHtml(s.payment)}</strong></div><div class="point-metric"><span>Estado</span><strong>${escapeHtml(s.status)}</strong></div></div><div style="margin-top:18px"><h4>Detalle de productos</h4><div class="table-wrap"><table class="table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio histórico</th><th>Subtotal</th></tr></thead><tbody>${s.items.map(i=>`<tr><td>${escapeHtml(i.name||getProduct(i.productId).name)}</td><td>${i.qty}</td><td>${money(i.price,s.currency)}</td><td>${money(i.qty*i.price,s.currency)}</td></tr>`).join('')}</tbody></table></div></div><div class="grid cols-3" style="margin-top:18px"><div class="point-metric"><span>Descuento</span><strong>${money(s.discount,s.currency)}</strong></div><div class="point-metric"><span>Recargo</span><strong>${money(s.surcharge,s.currency)}</strong></div><div class="point-metric"><span>Total</span><strong>${money(s.total,s.currency)}</strong></div></div>${s.notes?`<div style="margin-top:18px"><h4>Observaciones</h4><p class="muted">${escapeHtml(s.notes)}</p></div>`:''}`});}
function renderDevices(){setTitle('Dispositivos y equipamiento','Asignaciones, estados, historial y mantenimiento');const view=document.getElementById('view');const rows=visibleData().devices;view.innerHTML=`<div class="page-header"><div><h2>Equipamiento operativo</h2><p>Controlá cámaras, tablets, impresoras, baterías y otros elementos asignados.</p></div><div class="action-row"><button class="btn btn-primary" id="new-device">${icon('plus')} Nuevo dispositivo</button></div></div><section class="grid cols-4" style="margin-bottom:18px">${kpiCard('Total equipos',rows.length,'device','Inventario registrado')}${kpiCard('En uso',rows.filter(d=>d.status==='En uso').length,'play','Asignados a la operación')}${kpiCard('Disponibles',rows.filter(d=>d.status==='Disponible').length,'check','Listos para asignar')}${kpiCard('En reparación',rows.filter(d=>d.status==='En reparación').length,'warning','Requieren seguimiento',rows.some(d=>d.status==='En reparación')?'down':'up')}</section><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Código</th><th>Tipo / Modelo</th><th>Responsable</th><th>Punto</th><th>Estado</th><th>Observaciones</th><th></th></tr></thead><tbody>${rows.map(d=>`<tr><td><span class="cell-title">${escapeHtml(d.code)}</span></td><td><span class="cell-title">${escapeHtml(d.type)}</span><span class="cell-subtitle">${escapeHtml(d.model)}</span></td><td>${escapeHtml(getUser(d.responsibleId).name)}</td><td>${escapeHtml(getPoint(d.pointId).name)}</td><td>${statusBadge(d.status)}</td><td>${escapeHtml(d.notes||'—')}</td><td><div class="table-actions"><button class="btn btn-secondary btn-sm edit-device" data-id="${d.id}">${icon('edit',15)} Gestionar</button></div></td></tr>`).join('')}</tbody></table></div></div>`;document.getElementById('new-device').addEventListener('click',()=>showDeviceModal());document.querySelectorAll('.edit-device').forEach(b=>b.addEventListener('click',()=>showDeviceModal(b.dataset.id)));}
function showDeviceModal(id=''){if(!guard('Dispositivos',typeof id==='undefined'||!id?'create':'edit'))return;const d=state.data.devices.find(x=>x.id===id)||{code:'',type:'Cámara',model:'',status:'Disponible',responsibleId:'',pointId:'',notes:''};showModal({title:id?'Gestionar dispositivo':'Nuevo dispositivo',subtitle:'Asignación y estado actual del equipamiento.',body:`<form id="device-form"><div class="form-grid cols-3"><div class="form-field"><label>Código</label><input class="input" name="code" value="${escapeHtml(d.code)}" required></div><div class="form-field"><label>Tipo</label><select class="select" name="type">${['Cámara','Tablet','Celular','Impresora','Batería externa','Memoria','Uniforme','Credencial','Otro'].map(x=>`<option ${d.type===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="form-field"><label>Marca / modelo</label><input class="input" name="model" value="${escapeHtml(d.model)}" required></div><div class="form-field"><label>Estado</label><select class="select" name="status">${['Disponible','Asignado','En uso','Devuelto','En reparación','Dado de baja'].map(x=>`<option ${d.status===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="form-field"><label>Responsable</label><select class="select" name="responsibleId"><option value="">Sin asignar</option>${state.data.users.filter(u=>u.status==='Activo').map(u=>`<option value="${u.id}" ${d.responsibleId===u.id?'selected':''}>${escapeHtml(u.name)}</option>`).join('')}</select></div><div class="form-field"><label>Punto</label><select class="select" name="pointId"><option value="">Sin asignar</option>${state.data.points.map(p=>`<option value="${p.id}" ${d.pointId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></div><div class="form-field full"><label>Observaciones</label><textarea class="textarea" name="notes">${escapeHtml(d.notes)}</textarea></div></div></form>`,footer:`<button class="btn btn-secondary" id="cancel-modal">Cancelar</button><button class="btn btn-primary" id="save-device">${icon('check')} Guardar</button>`});document.getElementById('cancel-modal').addEventListener('click',closeModal);document.getElementById('save-device').addEventListener('click',()=>{const form=document.getElementById('device-form');if(!form.reportValidity())return;const f=new FormData(form),before=id?JSON.stringify(d):'-';if(state.data.devices.some(x=>x.id!==id&&x.code===f.get('code')))return toast('Código duplicado','','warning');if(id&&state.data.shifts.some(x=>['Programada','En curso','Iniciada'].includes(x.status)&&x.deviceIds.includes(id)))return toast('Equipo reservado','Gestioná el equipo desde la jornada.','warning');Object.assign(d,{id:id||uid('d'),code:f.get('code'),type:f.get('type'),model:f.get('model'),status:f.get('status'),responsibleId:f.get('responsibleId')||null,pointId:f.get('pointId')||null,notes:f.get('notes')});if(!id)state.data.devices.unshift(d);state.data.deviceHistory.unshift({id:uid('dh'),datetime:WBA.time(),deviceId:d.id,action:id?'Actualización':'Alta',before,status:d.status,userId:currentUser().id});saveData();addAudit(id?'Actualizó dispositivo':'Creó dispositivo',`Dispositivo ${d.code}`,before,`${d.status} / ${getUser(d.responsibleId).name}`,'Gestión de equipamiento');closeModal();renderDevices();toast('Dispositivo guardado','La información quedó actualizada.','success');});}

function renderGoals(){setTitle('Objetivos y ranking','Seguimiento individual, por punto y por equipo');const view=document.getElementById('view'),month=today().slice(0,7),monthSales=visibleData().sales.filter(s=>s.datetime.startsWith(month)&&s.status!=='Anulada'),daySales=salesForDate(),ranking=photographerRanking(monthSales);const teamTarget=sum(visibleData().points,p=>p.monthlyTarget),teamUnits=sum(monthSales,saleUnits),teamPct=teamTarget?teamUnits/teamTarget*100:0;view.innerHTML=`<div class="page-header"><div><h2>Objetivos comerciales</h2><p>Niveles de desempeño: mínimo, bueno, excelente y oro.</p></div><div class="action-row"><button class="btn btn-primary" id="configure-goal">${icon('settings')} Configurar objetivos</button></div></div><div class="photographer-hero"><div class="photographer-hero-top"><div><h2>Objetivo mensual del equipo</h2><p>${number(teamUnits)} de ${number(teamTarget)} productos vendidos</p></div><span class="badge info">${percent(teamPct)}</span></div><div class="hero-stat"><div class="hero-stat-label"><span>Progreso acumulado</span><strong>${number(Math.max(0,teamTarget-teamUnits))} restantes</strong></div><div class="hero-progress"><span style="width:${Math.min(100,teamPct)}%"></span></div></div></div><section class="grid cols-2" style="margin-top:18px"><div class="card"><div class="card-header"><div><h3>Ranking mensual</h3><p>Ordenado por unidades vendidas</p></div></div><div class="card-body">${rankingTemplate(ranking)}</div></div><div class="card"><div class="card-header"><div><h3>Avance por punto</h3><p>Cumplimiento del objetivo mensual</p></div></div><div class="card-body"><div class="stat-list">${visibleData().points.map(p=>{const units=sum(monthSales.filter(s=>s.pointId===p.id),saleUnits),pct=p.monthlyTarget?units/p.monthlyTarget*100:0;return `<div class="stat-row"><div class="stat-row-label"><strong>${escapeHtml(p.name)}</strong><span>${units} / ${p.monthlyTarget} unidades</span></div><div class="progress ${pct>=100?'success':pct<45?'danger':'warning'}"><span style="width:${Math.min(100,pct)}%"></span></div><div class="stat-row-value">${percent(pct)}</div></div>`}).join('')}</div></div></div></section><section class="grid cols-4" style="margin-top:18px">${['Mínimo','Bueno','Excelente','Oro'].map((level,i)=>{const thresholds=[60,80,100,120],count=ranking.filter(r=>{const point=getPoint(r.user.points[0]),target=point.monthlyTarget/Math.max(1,visibleData().users.filter(u=>u.role==='photographer'&&u.points.includes(point.id)).length),pct=target?r.units/target*100:0;return pct>=thresholds[i]}).length;return kpiCard(level,count,'trophy',`Fotógrafos con ≥ ${thresholds[i]}%`)}).join('')}</section>`;document.getElementById('configure-goal').addEventListener('click',showGoalConfig);}
function showGoalConfig(){if(!guard('Objetivos',typeof id==='undefined'||!id?'create':'edit'))return;showModal({title:'Configurar objetivos por punto',subtitle:'Los cambios afectan los cálculos futuros, no los históricos.',size:'modal-lg',body:`<form id="goal-form"><div class="table-wrap"><table class="table"><thead><tr><th>Punto</th><th>Objetivo diario</th><th>Objetivo mensual</th><th>Stock mínimo</th></tr></thead><tbody>${state.data.points.map(p=>`<tr><td><span class="cell-title">${escapeHtml(p.name)}</span></td><td><input class="input" type="number" name="daily_${p.id}" value="${p.dailyTarget}" min="0"></td><td><input class="input" type="number" name="monthly_${p.id}" value="${p.monthlyTarget}" min="0"></td><td><input class="input" type="number" name="stock_${p.id}" value="${p.minStock}" min="0"></td></tr>`).join('')}</tbody></table></div></form>`,footer:`<button class="btn btn-secondary" id="cancel-modal">Cancelar</button><button class="btn btn-primary" id="save-goals">${icon('check')} Guardar objetivos</button>`});document.getElementById('cancel-modal').addEventListener('click',closeModal);document.getElementById('save-goals').addEventListener('click',()=>{const f=new FormData(document.getElementById('goal-form'));state.data.points.forEach(p=>{p.dailyTarget=Number(f.get(`daily_${p.id}`));p.monthlyTarget=Number(f.get(`monthly_${p.id}`));p.minStock=Number(f.get(`stock_${p.id}`));});saveData();addAudit('Actualizó objetivos','Configuración de puntos','Valores anteriores','Nuevos objetivos guardados','Planificación comercial');closeModal();renderGoals();toast('Objetivos actualizados','Los tableros fueron recalculados.','success');});}

function showExpenseModal(){if(!guard('Gastos',typeof id==='undefined'||!id?'create':'edit'))return;showModal({title:'Registrar gasto',subtitle:'Clasificá el egreso para incorporarlo al resultado por punto.',body:`<form id="expense-form"><div class="form-grid cols-3"><div class="form-field"><label>Fecha</label><input class="input" type="date" name="date" value="${today()}" required></div><div class="form-field"><label>Categoría</label><select class="select" name="category"><option>Insumos</option><option>Transporte</option><option>Reparaciones</option><option>Equipamiento</option><option>Canon de punto</option><option>Gasto administrativo</option><option>Otro</option></select></div><div class="form-field"><label>Punto</label><select class="select" name="pointId">${state.data.points.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></div><div class="form-field full"><label>Descripción</label><input class="input" name="description" required></div><div class="form-field"><label>Importe</label><input class="input" type="number" name="amount" min="0" required></div><div class="form-field"><label>Moneda</label><select class="select" name="currency"><option>ARS</option><option>USD</option><option>BRL</option></select></div><div class="form-field"><label>Estado</label><select class="select" name="status"><option>Pagado</option><option>Pendiente</option></select></div></div></form>`,footer:`<button class="btn btn-secondary" id="cancel-modal">Cancelar</button><button class="btn btn-primary" id="save-expense">${icon('check')} Guardar gasto</button>`});document.getElementById('cancel-modal').addEventListener('click',closeModal);document.getElementById('save-expense').addEventListener('click',()=>{const form=document.getElementById('expense-form');if(!form.reportValidity())return;const f=new FormData(form),e={id:uid('g'),date:f.get('date'),category:f.get('category'),description:f.get('description'),pointId:f.get('pointId'),amount:Number(f.get('amount')),currency:f.get('currency'),status:f.get('status')};state.data.expenses.unshift(e);saveData();addAudit('Registró gasto',`Gasto ${e.id}`,'-',`${e.description} / ${money(e.amount,e.currency)}`,'Gestión financiera');closeModal();renderFinance();toast('Gasto registrado','El resultado mensual fue recalculado.','success');});}
function renderReports(){setTitle('Reportes','Exportaciones operativas, comerciales y financieras');const view=document.getElementById('view');const reports=[
  {id:'sales',name:'Ventas',description:'Detalle por fecha, fotógrafo, punto, producto, medio y estado.',icon:'sale'},
  {id:'shifts',name:'Jornadas',description:'Programación, horarios, objetivos, ventas y estados.',icon:'calendar'},
  {id:'renditions',name:'Rendiciones',description:'Esperado, declarado, diferencias, stock y validación.',icon:'cash'},
  {id:'stock',name:'Stock',description:'Disponibilidad, asignaciones, ventas, daños y mínimos.',icon:'box'},
  {id:'commissions',name:'Comisiones',description:'Ventas, facturación y comisión estimada por fotógrafo.',icon:'trophy'},
  {id:'expenses',name:'Gastos',description:'Egresos por categoría, punto, moneda y estado.',icon:'finance'},
  {id:'audit',name:'Auditoría',description:'Usuario, acción, entidad, cambios, fecha y motivo.',icon:'shield'},
  {id:'points',name:'Resultados por punto',description:'Ventas, unidades, objetivos y rentabilidad estimada.',icon:'building'}
];view.innerHTML=`<div class="page-header"><div><h2>Centro de reportes</h2><p>Generá archivos CSV compatibles con Excel para análisis y control.</p></div></div><div class="grid cols-3">${reports.map(r=>`<div class="card"><div class="card-body"><div class="kpi-icon">${icon(r.icon)}</div><h3 style="margin:16px 0 7px">${escapeHtml(r.name)}</h3><p class="muted" style="font-size:12px;line-height:1.5;min-height:54px">${escapeHtml(r.description)}</p><button class="btn btn-secondary btn-block export-report" data-report="${r.id}">${icon('download')} Exportar CSV</button></div></div>`).join('')}</div><div class="card" style="margin-top:18px"><div class="card-header"><div><h3>Resumen para dirección</h3><p>Indicadores listos para presentación mensual</p></div></div><div class="card-body"><div class="grid cols-4">${kpiCard('Ventas del mes',money(sum(visibleData().sales.filter(s=>s.datetime.startsWith(today().slice(0,7))&&s.status!=='Anulada'),s=>s.total)),'sale','Facturación consolidada')}${kpiCard('Productos',number(sum(visibleData().sales.filter(s=>s.datetime.startsWith(today().slice(0,7))&&s.status!=='Anulada'),saleUnits)),'camera','Unidades vendidas')}${kpiCard('Gastos',money(sum(visibleData().expenses.filter(e=>e.date.startsWith(today().slice(0,7))),e=>e.amount)),'cash','Egresos registrados')}${kpiCard('Alertas',getAlerts().length,'warning','Situaciones actuales')}</div></div></div>`;document.querySelectorAll('.export-report').forEach(b=>b.addEventListener('click',()=>exportReport(b.dataset.report)));}
function renderProducts(){setTitle('Productos y precios','Catálogo, costos, comisiones e históricos');const view=document.getElementById('view');view.innerHTML=`<div class="page-header"><div><h2>Catálogo de productos</h2><p>Los cambios futuros no modifican las condiciones históricas de las ventas registradas.</p></div><div class="action-row"><button class="btn btn-primary" id="new-product">${icon('plus')} Nuevo producto</button></div></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Producto</th><th>Tipo</th><th>Control stock</th><th>Costo</th><th>Precio base</th><th>Margen</th><th>Comisión</th><th>Estado</th><th></th></tr></thead><tbody>${visibleData().products.map(p=>`<tr><td><span class="cell-title">${escapeHtml(p.name)}</span></td><td>${escapeHtml(p.type)}</td><td>${p.stock?statusBadge('Sí'):statusBadge('No')}</td><td>${money(p.cost)}</td><td><strong>${money(p.price)}</strong></td><td>${p.price?Math.round((p.price-p.cost)/p.price*100):0}%</td><td>${p.commission}%</td><td>${statusBadge(p.active?'Activo':'Inactivo')}</td><td><button class="btn btn-secondary btn-sm edit-product" data-id="${p.id}">${icon('edit',14)} Editar</button></td></tr>`).join('')}</tbody></table></div></div>`;document.getElementById('new-product').addEventListener('click',()=>showProductModal());document.querySelectorAll('.edit-product').forEach(b=>b.addEventListener('click',()=>showProductModal(b.dataset.id)));}
function showAllyModal(id=''){if(!guard('Aliados',typeof id==='undefined'||!id?'create':'edit'))return;const a=state.data.allies.find(x=>x.id===id)||{name:'',legalName:'',contact:'',pointIds:[],agreement:'Porcentaje fijo',percentage:0,fixedFee:0,frequency:'Mensual',validFrom:today(),status:'Activo'};showModal({title:id?'Editar aliado comercial':'Nuevo aliado comercial',subtitle:'Modelos porcentuales, fijos, escalonados o mixtos.',size:'modal-lg',body:`<form id="ally-form"><div class="form-grid cols-3"><div class="form-field"><label>Nombre comercial</label><input class="input" name="name" value="${escapeHtml(a.name)}" required></div><div class="form-field"><label>Razón social</label><input class="input" name="legalName" value="${escapeHtml(a.legalName)}"></div><div class="form-field"><label>Contacto</label><input class="input" name="contact" value="${escapeHtml(a.contact)}"></div><div class="form-field full"><label>Puntos asociados</label><div class="grid cols-3">${state.data.points.map(p=>`<label class="checkbox-row"><input type="checkbox" name="pointIds" value="${p.id}" ${a.pointIds.includes(p.id)?'checked':''}> ${escapeHtml(p.name)}</label>`).join('')}</div></div><div class="form-field"><label>Tipo de acuerdo</label><select class="select" name="agreement">${['Porcentaje fijo','Canon mensual fijo','Escala por ventas','Costo por capacidad máxima','Esquema mixto','Acuerdo especial'].map(x=>`<option ${a.agreement===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="form-field"><label>Participación (%)</label><input class="input" type="number" name="percentage" value="${a.percentage}" min="0" max="100"></div><div class="form-field"><label>Canon fijo</label><input class="input" type="number" name="fixedFee" value="${a.fixedFee}" min="0"></div><div class="form-field"><label>Periodicidad</label><select class="select" name="frequency">${['Semanal','Quincenal','Mensual','Trimestral'].map(x=>`<option ${a.frequency===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="form-field"><label>Inicio de vigencia</label><input class="input" type="date" name="validFrom" value="${a.validFrom}"></div><div class="form-field"><label>Estado</label><select class="select" name="status"><option ${a.status==='Activo'?'selected':''}>Activo</option><option ${a.status==='Pausado'?'selected':''}>Pausado</option><option ${a.status==='Finalizado'?'selected':''}>Finalizado</option></select></div></div></form>`,footer:`<button class="btn btn-secondary" id="cancel-modal">Cancelar</button><button class="btn btn-primary" id="save-ally">${icon('check')} Guardar aliado</button>`});document.getElementById('cancel-modal').addEventListener('click',closeModal);document.getElementById('save-ally').addEventListener('click',()=>{const form=document.getElementById('ally-form');if(!form.reportValidity())return;const f=new FormData(form),before=id?JSON.stringify(a):'-';Object.assign(a,{id:id||uid('a'),name:f.get('name'),legalName:f.get('legalName'),contact:f.get('contact'),pointIds:f.getAll('pointIds'),agreement:f.get('agreement'),percentage:Number(f.get('percentage')),fixedFee:Number(f.get('fixedFee')),frequency:f.get('frequency'),validFrom:f.get('validFrom'),status:f.get('status')});if(!id)state.data.allies.unshift(a);saveData();addAudit(id?'Actualizó aliado':'Creó aliado',`Aliado ${a.name}`,before,`${a.agreement} / ${a.percentage}%`,'Configuración comercial');closeModal();renderAllies();toast('Aliado guardado','El acuerdo quedó configurado.','success');});}

function renderAudit(){setTitle('Trazabilidad y auditoría','Historial de acciones, cambios y motivos');const view=document.getElementById('view'),query=(state.filters.auditQuery||'').toLowerCase(),rows=visibleData().audit.filter(a=>!query||[a.action,a.entity,getUser(a.userId).name,a.reason].join(' ').toLowerCase().includes(query));view.innerHTML=`<div class="page-header"><div><h2>Registro de auditoría</h2><p>Ventas, anulaciones, precios, stock, rendiciones, cierres, liquidaciones y permisos.</p></div><div class="action-row"><button class="btn btn-secondary" id="export-audit">${icon('download')} Exportar</button></div></div><div class="card"><div class="card-body"><div class="toolbar"><div class="search-box">${icon('search',16)}<input class="input" id="audit-query" placeholder="Buscar usuario, acción o entidad" value="${escapeHtml(state.filters.auditQuery||'')}"></div><span class="muted" style="font-size:11px">${rows.length} eventos</span></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Valor anterior</th><th>Valor nuevo</th><th>Motivo</th></tr></thead><tbody>${rows.map(a=>`<tr><td class="nowrap">${formatDate(a.datetime,true)}</td><td>${escapeHtml(getUser(a.userId).name)}</td><td><span class="cell-title">${escapeHtml(a.action)}</span></td><td>${escapeHtml(a.entity)}</td><td>${escapeHtml(a.before)}</td><td>${escapeHtml(a.after)}</td><td>${escapeHtml(a.reason)}</td></tr>`).join('')}</tbody></table></div></div>`;document.getElementById('audit-query').addEventListener('input',e=>{state.filters.auditQuery=e.target.value;renderAudit();});document.getElementById('export-audit').addEventListener('click',()=>exportReport('audit'));}

function exportCSV(filename, rows){if(!rows||!rows.length){toast('Sin datos para exportar','No hay registros en el conjunto seleccionado.','warning');return;}const headers=[...new Set(rows.flatMap(r=>Object.keys(r)))];const escape=v=>`"${String(v??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')}"`;const csv='\ufeff'+[headers.map(escape).join(';'),...rows.map(r=>headers.map(h=>escape(r[h])).join(';'))].join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);toast('Archivo generado',filename,'success');}

function resetDemoData(){if(currentUser()?.role!=='direction')return;if(!confirm('¿Restaurar demostración? Se borrarán los datos locales de esta aplicación.'))return;localStorage.removeItem(STORAGE_KEY);state.data=WBA.migrate(seedData());saveData();render();toast('Datos restaurados','La demostración volvió a su estado inicial.','success');}

window.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal();});
window.addEventListener('DOMContentLoaded',()=>{registerServiceWorker();render();});
