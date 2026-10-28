(()=>{
const KEY='stocksync.v2',$=(s,r=document)=>r.querySelector(s);
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||!Array.isArray(S.products))S=structuredClone(SEED);
S.settings=Object.assign({},SEED.settings,S.settings);S.settings.erp=Object.assign({},SEED.settings.erp,S.settings.erp);
S.mine=S.mine||[];S.listings=S.listings||[];S.orders=S.orders||[];S.activity=S.activity||[];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
/* dates: always local time (toISOString is UTC and shifted every date by one day in Indonesia) */
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const midnight=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
let today=midnight();
const mob=()=>matchMedia('(max-width:900px)').matches;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rp=n=>'Rp '+Math.round(n).toLocaleString('id-ID');
const rpm=n=>n>=1e6?'Rp '+(n/1e6).toFixed(1)+'M':rp(n);
const sum=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const left=p=>Math.round((parse(p.exp)-today)/864e5);
const isExp=p=>left(p)<=S.settings.alertDays,isLow=p=>p.qty<p.min;
const prods=()=>S.products.filter(p=>S.outlet==='all'||p.outlet===S.outlet);
const dayTxt=d=>d<0?'Expired':d===0?'Today':d===1?'1 day left':d+' days left';
const dayCls=d=>d<=3?'bad':d<=S.settings.alertDays?'warn':'mute';
const img=n=>`<img src="assets/products/${n||'box'}.svg" alt="">`;
const ago=t=>{const m=Math.round((Date.now()-t)/6e4);if(m<1)return'just now';if(m<60)return m+' min ago';const h=Math.round(m/60);if(h<24)return h+(h===1?' hour ago':' hours ago');const d=Math.round(h/24);return d+(d===1?' day ago':' days ago')};
const note=(t,s)=>{S.activity.unshift({t,s,at:Date.now()});S.activity=S.activity.slice(0,12)};
const toast=m=>{const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.append(e);setTimeout(()=>e.remove(),2200)};
let tab='value',q='',lastK='';

/* icons: plain 24px strokes, drawn for this project */
const IC={dashboard:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',inventory:'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',expiry:'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',marketplace:'M3 9l2-5h14l2 5M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M5 13v8h14v-8M10 21v-5h4v5',orders:'M8 3h8v4H8zM6 5H5v16h14V5h-1M9 12h6M9 16h6',outlets:'M12 21s-7-6-7-12a7 7 0 0114 0c0 6-7 12-7 12zM12 7a2.5 2.5 0 100 5 2.5 2.5 0 000-5',reports:'M4 20V11M10 20V4M16 20v-7M2 21h20',settings:'M4 7h9M17 7h3M4 17h3M11 17h9M15 4v6M9 14v6',bell:'M6 9a6 6 0 0112 0c0 6 2 7 2 8H4c0-1 2-2 2-8zM10 21h4',more:'M5 12h.01M12 12h.01M19 12h.01'};
const ic=n=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n]}"${n==='more'?' stroke-width="3"':''}/></svg>`;
const NAV=[['dashboard','Dashboard'],['inventory','Inventory'],['expiry','Expiry watch'],['marketplace','Marketplace'],['orders','Orders'],['outlets','Outlets'],['reports','Reports'],['settings','Settings']];

const NAME=Object.fromEntries(NAV);
const tbl=(cols,rows,empty='Nothing here yet.',attr=()=>'')=>rows.length?`<table><thead><tr>${cols.map(c=>`<th class="${c.r?'r':''}">${c.h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr ${attr(r)}>${cols.map(c=>`<td class="${c.r?'r':''}" data-label="${c.h}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table>`:`<p class="empty">${empty}</p>`;
const head=(t,sub,extra='')=>`<div class="head"><div><h1>${t}</h1>${sub?`<p>${sub}</p>`:''}</div><div class="row">${extra}</div></div>`;
const outSel=()=>`<select id="outlet" aria-label="Outlet"><option value="all">All outlets</option>${S.outlets.map(o=>`<option ${S.outlet===o?'selected':''}>${o}</option>`).join('')}</select>`;
const status=o=>{const P=S.products.filter(p=>p.outlet===o),l=P.filter(isLow).length,e=P.filter(isExp).length;return l>=3?['Restock','warn']:e>=2?['Check expiry','warn']:['Healthy','ok']};

function chart(v,f){const m=mob(),W=m?340:560,H=m?190:210,L=m?56:66,B=26,T=10,R=m?14:30,mx=(Math.max(...v)||1)*1.15,x=i=>L+i*(W-L-R)/6,y=n=>T+(H-T-B)*(1-n/mx);let g='';
for(let i=0;i<=3;i++){const n=mx*i/3;g+=`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(n)}" y2="${y(n)}"/><text x="${L-8}" y="${y(n)+4}" text-anchor="end">${f(n)}</text>`}
const lab=v.map((_,i)=>{const d=new Date(today);d.setDate(d.getDate()-6+i);return `<text x="${x(i)}" y="${H-6}" text-anchor="middle">${d.getDate()} ${d.toLocaleString('en',{month:'short'})}</text>`}).join('');
const pts=v.map((n,i)=>x(i)+','+y(n)).join(' ');
return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Last 7 days"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2352C8" stop-opacity=".25"/><stop offset="1" stop-color="#2352C8" stop-opacity="0"/></linearGradient></defs>${g}<polygon fill="url(#ag)" stroke="none" points="${x(0)},${y(0)} ${pts} ${x(6)},${y(0)}"/><polyline class="ln" points="${pts}"/>${v.map((n,i)=>`<rect class="pt" x="${x(i)-3.5}" y="${y(n)-3.5}" width="7" height="7" rx="3.5"><title>${f(n)}</title></rect>`).join('')}${lab}</svg>`}

/* views */
const V={};
V.dashboard=()=>{
 const P=prods(),val=sum(P,p=>p.qty*p.price),ex=P.filter(isExp).sort((a,b)=>left(a)-left(b)),lo=P.filter(isLow);
 const h=new Date().getHours(),g=h<11?'Good morning':h<17?'Good afternoon':'Good evening';
 const sold=sum(S.orders.filter(o=>o.type==='Sale'),o=>o.qty);
 const MM={value:['Total stock value',val,[.62,.7,.74,.79,.86,.92,1],rpm],sold:['Units sold',sold,[.5,.7,.6,.85,.75,.65,1],n=>Math.round(n)],exp:['Items near expiry',ex.length,[1.5,1.4,1.3,1.2,1.1,1.05,1],n=>Math.round(n)],low:['Low stock',lo.length,[.7,.8,.8,.9,1,1.1,1],n=>Math.round(n)]};
 const m=MM[tab],ser=m[2].map(s=>tab==='value'?m[1]*s:Math.round(m[1]*s));
 const cats=Object.entries(P.reduce((a,p)=>(a[p.cat]=(a[p.cat]||0)+p.qty*p.price,a),{})).sort((a,b)=>b[1]-a[1]);
 return head(`${g}, Josephine`,ex.length?`${ex.length} products expire within ${S.settings.alertDays} days. Start with the ones marked in red.`:'Nothing is close to expiry.',outSel())+
 `<div class="panel kpis"><div><span>Total stock value</span><b>${rpm(val)}</b><small class="mute">${P.length} products</small></div>
 <div><span>Items near expiry</span><b>${ex.length}</b><small class="${ex.some(p=>left(p)<=3)?'bad':'mute'}">${ex.filter(p=>left(p)<=3).length} need action</small></div>
 <div><span>Low stock items</span><b>${lo.length}</b><small class="mute">across ${new Set(lo.map(p=>p.outlet)).size} outlet${new Set(lo.map(p=>p.outlet)).size===1?'':'s'}</small></div></div>
 <div class="cols"><div>
 <div class="panel"><div class="ph"><h2>Inventory overview</h2><div class="tabs">${[['value','Stock value'],['sold','Units sold'],['exp','Near expiry'],['low','Low stock']].map(([k,l])=>`<button data-tab="${k}" class="${tab===k?'on':''}">${l}</button>`).join('')}</div></div>
 <div class="ov"><div class="pb">${chart(ser,m[3])}</div><div class="pb"><h2 style="margin-bottom:14px">Categories by value</h2>${cats.map(([c,v])=>`<div class="cat"><div><span>${c}</span><span>${rpm(v)}</span></div><i><b style="width:${val?Math.round(v/val*100):0}%"></b></i></div>`).join('')}</div></div></div>
 <div class="panel"><div class="ph"><h2>Stock by outlet</h2><a class="link" href="#outlets">View all outlets</a></div>${outletTable()}</div></div>
 <div><div class="panel"><div class="ph"><h2>Expiry watch</h2><a class="link" href="#expiry">View all</a></div>${ex.slice(0,3).map(expRow).join('')||'<p class="empty">All clear.</p>'}</div>
 <div class="panel"><div class="ph"><h2>Recent activity</h2></div>${S.activity.slice(0,5).map(a=>`<div class="li"><div class="t"><b style="font-weight:500">${esc(a.t)}</b><span>${esc(a.s)}, ${ago(a.at)}</span></div></div>`).join('')}</div>
 <div class="promo"><h2>Need stock? Check what others are selling.</h2><p>Other retailers list surplus at about half the regular price.</p><a class="btn" href="#marketplace">Go to marketplace</a></div></div></div>`};
const expRow=p=>`<div class="li">${img(p.img)}<div class="t"><b style="font-weight:500">${esc(p.name)}</b><span>${esc(p.brand)}, ${p.outlet}</span><span class="${dayCls(left(p))}">${dayTxt(left(p))}</span></div><div class="rt"><span>${p.qty} units</span><button class="btn sm" data-list="${p.id}">Sell</button></div></div>`;
const outletTable=()=>tbl([{h:'Outlet',f:o=>o},{h:'Products',r:1,f:o=>S.products.filter(p=>p.outlet===o).length},{h:'In stock',r:1,f:o=>S.products.filter(p=>p.outlet===o&&p.qty>0).length},{h:'Low stock',r:1,f:o=>S.products.filter(p=>p.outlet===o&&isLow(p)).length},{h:'Expiring soon',r:1,f:o=>S.products.filter(p=>p.outlet===o&&isExp(p)).length},{h:'Status',f:o=>{const s=status(o);return `<span class="${s[1]}">${s[0]}</span>`}}],S.outlets);

V.inventory=()=>{
 const t=q.toLowerCase(),P=prods().filter(p=>!t||[p.name,p.brand,p.sku,p.outlet].join(' ').toLowerCase().includes(t));
 return head('Inventory',`${P.length} products${t?` matching "${esc(q)}"`:''}`,outSel()+'<button class="btn" id="csv">Download CSV</button><button class="btn pri" id="add">Add product</button>')+
 `<div class="panel">${tbl([{h:'Product',f:p=>`<b style="font-weight:500">${esc(p.name)}</b><br><span class="mute">${esc(p.brand)}, ${p.sku}</span>`},{h:'Outlet',f:p=>p.outlet},{h:'Category',f:p=>p.cat},{h:'Price',r:1,f:p=>rp(p.price)},{h:'Quantity',r:1,f:p=>`<span class="${isLow(p)?'bad':''}">${p.qty}</span> <span class="mute">/ min ${p.min}</span>`},{h:'Expiry',f:p=>`<span class="${dayCls(left(p))}">${dayTxt(left(p))}</span>`},{h:'',f:p=>`<div class="act"><button class="btn sm" data-qty="${p.id}:-1" aria-label="Remove one">-</button><button class="btn sm" data-qty="${p.id}:1" aria-label="Add one">+</button><button class="btn sm" data-del="${p.id}">Delete</button></div>`}],P,'No product matches that search.')}</div>`};

V.expiry=()=>{const P=prods().filter(isExp).sort((a,b)=>left(a)-left(b));
 return head('Expiry watch',`Products expiring within ${S.settings.alertDays} days. Change this in Settings.`,outSel())+`<div class="panel">${P.map(expRow).join('')||'<p class="empty">Nothing is close to expiry.</p>'}</div>`};

V.marketplace=()=>{
 const card=(l,mine)=>`<div class="panel"><div class="li">${img(l.img)}<div class="t"><b style="font-weight:500">${esc(l.name)}</b><span>${esc(l.brand)}, ${l.qty} units</span><span class="${dayCls(left(l))}">${dayTxt(left(l))}</span></div></div>
 <div class="pb" style="border-top:1px solid #E1E3DC"><p><b>${rp(l.price)}</b> <s class="mute">${rp(l.regular)}</s></p><p class="mute" style="font-size:13px;margin:2px 0 10px">${mine?'Your listing, Outlet '+l.outlet:esc(l.seller)+', '+l.km+' km away'}</p>
 ${mine?`<div class="row"><button class="btn" data-sold="${l.id}">Record sale</button><button class="btn" data-pull="${l.id}">Withdraw</button></div>`:`<button class="btn pri" data-buy="${l.id}">Buy</button>`}</div></div>`;
 return head('Marketplace','Surplus stock from nearby retailers, sold at about half the regular price. Listed expiry dates are always shown.')+
 `<h2 style="margin-bottom:10px">Available near you</h2><div class="grid" style="margin-bottom:28px">${S.listings.map(l=>card(l)).join('')||'<p class="empty">No listings right now.</p>'}</div>
 <h2 style="margin-bottom:10px">Your listings</h2><div class="grid">${S.mine.map(l=>card(l,1)).join('')||'<p class="mute">Nothing listed. Use Sell on the Expiry watch page.</p>'}</div>`};

V.orders=()=>head('Orders','Sales and purchases made through the marketplace.')+`<div class="panel">${tbl([{h:'Order',f:o=>o.id},{h:'Date',f:o=>o.date},{h:'Type',f:o=>o.type},{h:'Item',f:o=>`${esc(o.item)} x ${o.qty}`},{h:'With',f:o=>esc(o.party)},{h:'Total',r:1,f:o=>rp(o.total)},{h:'Status',f:o=>o.status},{h:'',f:o=>o.status==='Delivered'?'':`<button class="btn sm" data-adv="${o.id}">Mark ${o.status==='Pending'?'in transit':'delivered'}</button>`}],S.orders,'No orders yet.')}</div>`;

V.outlets=()=>head('Outlets','Stock position per outlet.')+`<div class="panel">${outletTable()}</div>`+
 `<div class="panel">${tbl([{h:'Outlet',f:o=>o},{h:'Stock value',r:1,f:o=>rp(sum(S.products.filter(p=>p.outlet===o),p=>p.qty*p.price))},{h:'Value expiring soon',r:1,f:o=>rp(sum(S.products.filter(p=>p.outlet===o&&isExp(p)),p=>p.qty*p.price))}],S.outlets)}</div>`;

V.reports=()=>{
 const sales=S.orders.filter(o=>o.type==='Sale'&&o.status==='Delivered'),u=sum(sales,o=>o.qty),got=sum(sales,o=>o.total*.97),risk=sum(S.products.filter(isExp),p=>p.qty*p.price);
 const kg=u*.5,co2=kg*2.5;
 return head('Reports','What matching has recovered so far. Counts delivered sales only.')+
 `<div class="panel kpis"><div><span>Revenue recovered</span><b>${rpm(got)}</b><small class="mute">after 3% seller fee</small></div><div><span>Food saved</span><b>${kg.toFixed(0)} kg</b><small class="mute">${u} units delivered before expiry</small></div><div><span>CO2e avoided</span><b>${co2.toFixed(0)} kg</b><small class="mute">estimate, see note</small></div></div>
 <div class="panel pb"><p>Stock value that expires within ${S.settings.alertDays} days: <b>${rp(risk)}</b>. Selling it at half price would recover about <b>${rp(risk*.485)}</b> after the seller fee.</p>
 <p class="mute" style="font-size:13px;margin-top:10px">Assumptions: 0.5 kg per unit and 2.5 kg CO2e per kg of food. Replace both with your own figures in js/app.js (search "kg").</p></div>`};

V.settings=()=>{const s=S.settings,T=[['Free','Rp 0','Basic dashboard, expiry alerts, up to 50 SKUs'],['Basic','Rp 200.000 per month','Live ERP/POS sync, manual matching'],['Premium','Rp 400.000 per month','Forecasting and automatic matching']];
 const e=s.erp;
 return head('Settings')+`<div class="panel"><div class="ph"><h2>ERP / POS connection</h2><span class="${e.on?'ok':'mute'}">${e.on?'Connected':'Not connected'}</span></div><div class="pb conn"><p class="mute small">Link your existing system through the API. Nothing is replaced. ${e.on?'Last sync '+ago(e.last)+'.':'Stock and expiry dates will not update until you connect.'}</p>
 <label>System<select id="erpType">${['ERP','POS','ERP + POS'].map(t=>`<option ${e.type===t?'selected':''}>${t}</option>`).join('')}</select></label>
 <label>API endpoint<input class="in" id="erpUrl" type="url" inputmode="url" placeholder="https://..." value="${esc(e.url||'')}"></label>
 <div class="row"><button class="btn pri" id="erpToggle">${e.on?'Disconnect':'Connect'}</button><button class="btn" id="erpSync" ${e.on?'':'disabled'}>Sync now</button></div>
 <p class="mute small">Prototype: the connection is simulated and nothing is sent anywhere.</p></div></div>
 <div class="panel"><div class="ph"><h2>Plan</h2></div>${T.map(t=>`<label class="li" style="cursor:pointer"><input type="radio" name="plan" value="${t[0]}" ${s.plan===t[0]?'checked':''}><div class="t"><b style="font-weight:500">${t[0]}, ${t[1]}</b><span>${t[2]}</span></div></label>`).join('')}<p class="pb mute" style="font-size:13px">Marketplace fee is 4% of a completed sale (3% seller, 1% buyer). Delivery insurance is optional at 1%.</p></div>
 <div class="panel pb" style="display:grid;gap:14px;max-width:480px"><label>Alert me this many days before expiry <input class="in" id="days" type="number" min="1" max="60" value="${s.alertDays}" style="width:90px"></label>
 <label style="display:flex;gap:8px"><input type="checkbox" id="wa" ${s.whatsapp?'checked':''}> Send alerts to WhatsApp</label>
 <div><button class="btn" id="reset">Reset sample data</button></div></div>`};

/* dialogs */
const dlg=$('#dlg');
function modal(title,body,ok,done,onIn){dlg.innerHTML=`<form><h2>${title}</h2>${body}<div class="row end"><button type="button" class="btn" data-close>Cancel</button><button class="btn pri">${ok}</button></div></form>`;const f=dlg.firstChild;f.onsubmit=e=>{e.preventDefault();done(new FormData(f));dlg.close()};if(onIn){f.oninput=()=>onIn(f);onIn(f)}dlg.showModal()}
const opts=a=>a.map(o=>`<option>${o}</option>`).join('');
const nextId=a=>Math.max(0,...a.map(x=>x.id))+1;
const orderId=()=>'SS-'+(Math.max(1040,...S.orders.map(o=>parseInt(String(o.id).slice(3))||0))+1);
const listed=pid=>sum(S.mine.filter(x=>x.pid===pid),x=>x.qty);
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,Math.round(+n)||lo));
function go(page){if((location.hash||'#dashboard')==='#'+page)render();else location.hash=page}

function listDlg(id){const p=S.products.find(x=>x.id==id);if(!p)return;
 if(left(p)<0)return toast('Expired stock cannot be listed');
 const av=p.qty-listed(p.id);if(av<1)return toast('All units are already listed');
 modal('Sell '+esc(p.name),`<label>Quantity (${av} available${av<p.qty?', rest already listed':''})<input class="in" name="n" type="number" min="1" max="${av}" value="${av}" inputmode="numeric" required></label><label>Price per unit (regular ${rp(p.price)})<input class="in" name="pr" type="number" min="1" value="${Math.round(p.price/2)}" inputmode="numeric" required></label><p class="mute small">Buyers will see the expiry date: ${p.exp}.</p>`,'List for sale',f=>{
  S.mine.push({id:nextId(S.mine.concat(S.listings)),pid:p.id,seller:'You',km:0,name:p.name,brand:p.brand,qty:clamp(f.get('n'),1,av),regular:p.price,price:Math.max(1,Math.round(+f.get('pr'))),exp:p.exp,img:p.img,outlet:p.outlet});
  note('Listed on marketplace',p.name);save();toast('Listed '+p.name);go('marketplace')})}

function buyDlg(id){const l=S.listings.find(x=>x.id==id);if(!l)return;
 const calc=(n,ins)=>{const sub=n*l.price,fee=sub*.01,iv=ins?sub*.01:0;return{sub,fee,iv,tot:Math.round(sub+fee+iv)}};
 modal('Buy '+esc(l.name),`<label>Quantity (up to ${l.qty})<input class="in" name="n" type="number" min="1" max="${l.qty}" value="1" inputmode="numeric" required></label><label>Deliver to<select name="o">${opts(S.outlets)}</select></label><label class="c"><input type="checkbox" name="ins"> Add delivery insurance (1%)</label><div class="sum" id="sum"></div>`,'Place order',f=>{
  const n=clamp(f.get('n'),1,l.qty),c=calc(n,f.get('ins'));
  const o={id:orderId(),date:iso(today),party:l.seller,type:'Purchase',item:l.name,qty:n,total:c.tot,status:'Pending',goods:{name:l.name,brand:l.brand,cat:'Others',outlet:f.get('o'),price:l.regular,exp:l.exp,img:l.img}};
  S.orders.unshift(o);l.qty-=n;if(!l.qty)S.listings=S.listings.filter(x=>x!==l);note('Order placed',l.seller);save();toast('Order '+o.id+' placed');go('orders')},
 f=>{const c=calc(+f.n.value||0,f.ins.checked);$('#sum').innerHTML=`<div><span>Goods</span><span>${rp(c.sub)}</span></div><div><span>Buyer fee (1%)</span><span>${rp(c.fee)}</span></div>${f.ins.checked?`<div><span>Insurance (1%)</span><span>${rp(c.iv)}</span></div>`:''}<div><b>Total</b><b>${rp(c.tot)}</b></div>`})}

function saleDlg(id){const l=S.mine.find(x=>x.id==id);if(!l)return;
 const calc=n=>{const t=n*l.price;return{t,fee:t*.03,net:t*.97}};
 modal('Record sale: '+esc(l.name),`<label>Units sold (${l.qty} listed)<input class="in" name="n" type="number" min="1" max="${l.qty}" value="${l.qty}" inputmode="numeric" required></label><label>Buyer<input class="in" name="b" value="Nearby buyer" required></label><div class="sum" id="sum"></div>`,'Record sale',f=>{
  const n=clamp(f.get('n'),1,l.qty),c=calc(n),p=S.products.find(x=>x.id===l.pid);
  if(p)p.qty=Math.max(0,p.qty-n);
  S.orders.unshift({id:orderId(),date:iso(today),party:(f.get('b')||'').trim()||'Nearby buyer',type:'Sale',item:l.name,qty:n,total:c.t,status:'Pending'});
  l.qty-=n;if(!l.qty)S.mine=S.mine.filter(x=>x!==l);
  note('Sale recorded',l.name);save();toast('Sale recorded. You receive '+rp(c.net));go('orders')},
 f=>{const c=calc(clamp(f.n.value,0,l.qty));$('#sum').innerHTML=`<div><span>Sale</span><span>${rp(c.t)}</span></div><div><span>Seller fee (3%)</span><span>${rp(c.fee)}</span></div><div><b>You receive</b><b>${rp(c.net)}</b></div>`})}

function addDlg(){const d=new Date(today);d.setDate(d.getDate()+30);
 modal('Add product',`<label>Name<input class="in" name="name" required></label><label>Brand<input class="in" name="brand" required></label><div class="row"><label>Category<select name="cat">${opts(['Beverages','Dairy','Snacks','Others'])}</select></label><label>Outlet<select name="o">${opts(S.outlets)}</select></label></div><div class="row"><label>Quantity<input class="in" name="qty" type="number" min="0" value="10" inputmode="numeric" required></label><label>Minimum<input class="in" name="min" type="number" min="0" value="10" inputmode="numeric" required></label></div><div class="row"><label>Price (Rp)<input class="in" name="pr" type="number" min="1" inputmode="numeric" required></label><label>Expiry date<input class="in" name="exp" type="date" value="${iso(d)}" required></label></div>`,'Add product',f=>{
  const id=nextId(S.products),name=f.get('name').trim(),brand=f.get('brand').trim();if(!name||!brand)return toast('Name and brand are required');
  S.products.push({id,sku:'SS-'+(1000+id*7),name,brand,cat:f.get('cat'),outlet:f.get('o'),qty:Math.max(0,Math.round(+f.get('qty'))),min:Math.max(0,Math.round(+f.get('min'))),price:Math.max(1,Math.round(+f.get('pr'))),exp:f.get('exp'),img:'box'});
  note('Product added',name);save();render()})}

/* actions */
document.addEventListener('click',e=>{
 const a=e.target.closest('a');if(a&&dlg.open&&a.closest('.sheet'))dlg.close();
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if('close' in d)dlg.close();
 if('more' in d){dlg.innerHTML=`<div class="sheet"><h2 style="margin-bottom:6px">More</h2>${NAV.slice(4).map(([id,l])=>`<a href="#${id}">${ic(id)}<span class="lb">${l}</span></a>`).join('')}<button class="btn" data-close style="margin-top:14px;width:100%">Close</button></div>`;dlg.showModal()}
 if(d.tab){tab=d.tab;render()}
 if(d.list)listDlg(d.list);
 if(d.buy)buyDlg(d.buy);
 if(d.qty){const[i,n]=d.qty.split(':'),p=S.products.find(x=>x.id==i);if(p){p.qty=Math.max(0,p.qty+ +n);save();render()}}
 if(d.del&&confirm('Delete this product?')){const id=+d.del;S.products=S.products.filter(x=>x.id!==id);S.mine=S.mine.filter(x=>x.pid!==id);save();render()}
 if(d.pull){S.mine=S.mine.filter(x=>x.id!=d.pull);save();render()}
 if(d.sold)saleDlg(d.sold);
 if(d.adv){const o=S.orders.find(x=>x.id===d.adv);if(o){o.status=o.status==='Pending'?'In transit':'Delivered';
  if(o.status==='Delivered'&&o.goods){const g=o.goods,m=S.products.find(p=>p.name===g.name&&p.outlet===g.outlet&&p.exp===g.exp);
   if(m)m.qty+=o.qty;else{const id=nextId(S.products);S.products.push({id,sku:'SS-'+(1000+id*7),min:10,qty:o.qty,...g})}note('Order delivered',o.item)}
  save();render()}}
 if(b.id==='add')addDlg();
 if(b.id==='erpToggle'){const e=S.settings.erp;if(!e.on){if(!/^https?:\/\/\S+/.test((e.url||'').trim()))return toast('Add the API endpoint first');e.on=true;e.last=Date.now();note('ERP/POS connected',e.type)}else{e.on=false;note('ERP/POS disconnected',e.type)}save();render()}
 if(b.id==='erpSync'){S.settings.erp.last=Date.now();note('ERP/POS synced',S.settings.erp.type);save();toast('Stock and expiry data synced');render()}
 if(b.id==='reset'&&confirm('Replace all data with the sample data?')){S=structuredClone(SEED);save();render()}
 if(b.id==='csv'){const r=[['SKU','Name','Brand','Outlet','Category','Qty','Min','Price','Expiry'],...prods().map(p=>[p.sku,p.name,p.brand,p.outlet,p.cat,p.qty,p.min,p.price,p.exp])];
  const u=URL.createObjectURL(new Blob(['\ufeff'+r.map(x=>x.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='stocksync-inventory.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}});
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='outlet'){S.outlet=t.value;save();render()}
 if(t.name==='plan'){S.settings.plan=t.value;save();toast('Plan set to '+t.value)}
 if(t.id==='days'){S.settings.alertDays=Math.min(60,Math.max(1,Math.round(+t.value)||7));save();render()}
 if(t.id==='wa'){S.settings.whatsapp=t.checked;save()}
 if(t.id==='erpType'){S.settings.erp.type=t.value;save()}
 if(t.id==='erpUrl'){const v=t.value.trim();if(v&&!/^https?:\/\/\S+/.test(v)){toast('Enter a full URL starting with https://');t.value=S.settings.erp.url||''}else{S.settings.erp.url=v;save()}}});
$('#q').addEventListener('input',e=>{q=e.target.value;if(location.hash!=='#inventory')location.hash='inventory';else render()});
/* tap outside a dialog (on the dimmed backdrop) to close it */
dlg.addEventListener('click',e=>{if(e.target!==dlg)return;const r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dlg.close()});

function render(){
 today=midnight();
 const r=(location.hash||'#dashboard').slice(1),k=V[r]?r:'dashboard',n=S.products.filter(isExp).length;
 $('#nav').innerHTML=NAV.map(([id,l])=>`<a href="#${id}" class="${id===k?'on':''}" ${id===k?'aria-current="page"':''}>${ic(id)}<span class="lb">${l}</span>${id==='expiry'&&n?`<span class="n">${n}</span>`:''}</a>`).join('');
 $('#tabbar').innerHTML=[['dashboard','Home'],['inventory','Stock'],['expiry','Expiry'],['marketplace','Market']].map(([id,l])=>`<a class="tb ${id===k?'on':''}" href="#${id}">${ic(id)}${l}${id==='expiry'&&n?`<span class="n">${n}</span>`:''}</a>`).join('')+`<button class="tb ${['orders','outlets','reports','settings'].includes(k)?'on':''}" data-more>${ic('more')}More</button>`;
 $('#bell').innerHTML=ic('bell')+(n?`<i>${n}</i>`:'');
 $('#view').innerHTML=V[k]();document.title='StockSync, '+NAME[k];
 if(k!==lastK){lastK=k;scrollTo(0,0)}
}
window.addEventListener('hashchange',()=>{if(dlg.open)dlg.close();render()});
matchMedia('(max-width:900px)').addEventListener('change',render);
render();
})();
