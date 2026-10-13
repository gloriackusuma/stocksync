(()=>{
const KEY='stocksync.v1',$=(s,r=document)=>r.querySelector(s);
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
S=S||structuredClone(SEED);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const today=new Date();today.setHours(0,0,0,0);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rp=n=>'Rp '+Math.round(n).toLocaleString('id-ID');
const rpm=n=>n>=1e6?'Rp '+(n/1e6).toFixed(1)+'M':rp(n);
const sum=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const left=p=>Math.round((new Date(p.exp)-today)/864e5);
const isExp=p=>left(p)<=S.settings.alertDays,isLow=p=>p.qty<p.min;
const prods=()=>S.products.filter(p=>S.outlet==='all'||p.outlet===S.outlet);
const dayTxt=d=>d<0?'Expired':d===0?'Today':d===1?'1 day left':d+' days left';
const dayCls=d=>d<=3?'bad':d<=S.settings.alertDays?'warn':'mute';
const img=n=>`<img src="assets/products/${n||'box'}.svg" alt="">`;
const ago=t=>{const h=Math.round((Date.now()-t)/36e5);return h<1?'just now':h<24?h+' hours ago':Math.round(h/24)+' days ago'};
const note=(t,s)=>{S.activity.unshift({t,s,at:Date.now()});S.activity=S.activity.slice(0,12)};
const toast=m=>{const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.append(e);setTimeout(()=>e.remove(),2200)};
let tab='value',q='';

/* icons: plain 24px strokes, drawn for this project */
const IC={dashboard:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',inventory:'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',expiry:'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',marketplace:'M3 9l2-5h14l2 5M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M5 13v8h14v-8M10 21v-5h4v5',orders:'M8 3h8v4H8zM6 5H5v16h14V5h-1M9 12h6M9 16h6',outlets:'M12 21s-7-6-7-12a7 7 0 0114 0c0 6-7 12-7 12zM12 7a2.5 2.5 0 100 5 2.5 2.5 0 000-5',reports:'M4 20V11M10 20V4M16 20v-7M2 21h20',settings:'M4 7h9M17 7h3M4 17h3M11 17h9M15 4v6M9 14v6',bell:'M6 9a6 6 0 0112 0c0 6 2 7 2 8H4c0-1 2-2 2-8zM10 21h4',more:'M5 12h.01M12 12h.01M19 12h.01'};
const ic=n=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n]}"${n==='more'?' stroke-width="3"':''}/></svg>`;
const NAV=[['dashboard','Dashboard'],['inventory','Inventory'],['expiry','Expiry watch'],['marketplace','Marketplace'],['orders','Orders'],['outlets','Outlets'],['reports','Reports'],['settings','Settings']];

const tbl=(cols,rows,empty='Nothing here yet.')=>rows.length?`<table><thead><tr>${cols.map(c=>`<th class="${c.r?'r':''}">${c.h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td class="${c.r?'r':''}" data-label="${c.h}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table>`:`<p class="empty">${empty}</p>`;
const head=(t,sub,extra='')=>`<div class="head"><div><h1>${t}</h1>${sub?`<p>${sub}</p>`:''}</div><div class="row">${extra}</div></div>`;
const outSel=()=>`<select id="outlet" aria-label="Outlet"><option value="all">All outlets</option>${S.outlets.map(o=>`<option ${S.outlet===o?'selected':''}>${o}</option>`).join('')}</select>`;
const status=o=>{const P=S.products.filter(p=>p.outlet===o),l=P.filter(isLow).length,e=P.filter(isExp).length;return l>=3?['Restock','warn']:e>=2?['Check expiry','warn']:['Healthy','ok']};

function chart(v,f){const W=560,H=210,L=66,B=26,T=10,R=30,mx=(Math.max(...v)||1)*1.15,x=i=>L+i*(W-L-R)/6,y=n=>T+(H-T-B)*(1-n/mx);let g='';
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
 const M={value:['Total stock value',val,[.62,.7,.74,.79,.86,.92,1],rpm],sold:['Units sold',sold,[.5,.7,.6,.85,.75,.65,1],n=>Math.round(n)],exp:['Items near expiry',ex.length,[1.5,1.4,1.3,1.2,1.1,1.05,1],n=>Math.round(n)],low:['Low stock',lo.length,[.7,.8,.8,.9,1,1.1,1],n=>Math.round(n)]};
 const m=M[tab],ser=m[2].map(s=>tab==='value'?m[1]*s:Math.round(m[1]*s));
 const cats=Object.entries(P.reduce((a,p)=>(a[p.cat]=(a[p.cat]||0)+p.qty*p.price,a),{})).sort((a,b)=>b[1]-a[1]);
 return head(`${g}, Josephine`,ex.length?`${ex.length} products expire within ${S.settings.alertDays} days. Start with the ones marked in red.`:'Nothing is close to expiry.',outSel())+
 `<div class="panel kpis"><div><span>Total stock value</span><b>${rpm(val)}</b><small class="mute">${P.length} products</small></div>
 <div><span>Items near expiry</span><b>${ex.length}</b><small class="${ex.some(p=>left(p)<=3)?'bad':'mute'}">${ex.filter(p=>left(p)<=3).length} need action</small></div>
 <div><span>Low stock items</span><b>${lo.length}</b><small class="mute">across ${new Set(lo.map(p=>p.outlet)).size} outlets</small></div></div>
 <div class="cols"><div>
 <div class="panel"><div class="ph"><h2>Inventory overview</h2><div class="tabs">${[['value','Stock value'],['sold','Units sold'],['exp','Near expiry'],['low','Low stock']].map(([k,l])=>`<button data-tab="${k}" class="${tab===k?'on':''}">${l}</button>`).join('')}</div></div>
 <div class="ov"><div class="pb">${chart(ser,m[3])}</div><div class="pb"><h2 style="margin-bottom:14px">Categories by value</h2>${cats.map(([c,v])=>`<div class="cat"><div><span>${c}</span><span>${rpm(v)}</span></div><i><b style="width:${Math.round(v/val*100)}%"></b></i></div>`).join('')}</div></div></div>
 <div class="panel"><div class="ph"><h2>Stock by outlet</h2><a class="link" href="#outlets">View all outlets</a></div>${outletTable()}</div></div>
 <div><div class="panel"><div class="ph"><h2>Expiry watch</h2><a class="link" href="#expiry">View all</a></div>${ex.slice(0,3).map(expRow).join('')||'<p class="empty">All clear.</p>'}</div>
 <div class="panel"><div class="ph"><h2>Recent activity</h2></div>${S.activity.slice(0,5).map(a=>`<div class="li"><div class="t"><b style="font-weight:500">${esc(a.t)}</b><span>${esc(a.s)}, ${ago(a.at)}</span></div></div>`).join('')}</div>
 <div class="promo"><h2>Need stock? Check what others are selling.</h2><p>Other retailers list surplus at about half the regular price.</p><a class="btn" href="#marketplace">Go to marketplace</a></div></div></div>`};
const expRow=p=>`<div class="li">${img(p.img)}<div class="t"><b style="font-weight:500">${esc(p.name)}</b><span>${esc(p.brand)}, ${p.outlet}</span><span class="${dayCls(left(p))}">${dayTxt(left(p))}</span></div><span>${p.qty} units</span><button class="btn sm" data-list="${p.id}">Sell</button></div>`;
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

V.orders=()=>head('Orders','Sales and purchases made through the marketplace.')+`<div class="panel">${tbl([{h:'Order',f:o=>o.id},{h:'Date',f:o=>o.date},{h:'Type',f:o=>o.type},{h:'Item',f:o=>`${esc(o.item)} x ${o.qty}`},{h:'With',f:o=>esc(o.party)},{h:'Total',r:1,f:o=>rp(o.total)},{h:'Status',f:o=>o.status},{h:'',f:o=>o.status==='Delivered'?'':`<button class="btn sm" data-adv="${o.id}">Mark ${o.status==='Pending'?'in transit':'delivered'}</button>`}],S.orders)}</div>`;

V.outlets=()=>head('Outlets','Stock position per outlet.')+`<div class="panel">${outletTable()}</div>`+
 `<div class="panel">${tbl([{h:'Outlet',f:o=>o},{h:'Stock value',r:1,f:o=>rp(sum(S.products.filter(p=>p.outlet===o),p=>p.qty*p.price))},{h:'Value expiring soon',r:1,f:o=>rp(sum(S.products.filter(p=>p.outlet===o&&isExp(p)),p=>p.qty*p.price))}],S.outlets)}</div>`;

V.reports=()=>{
 const sales=S.orders.filter(o=>o.type==='Sale'),u=sum(sales,o=>o.qty),got=sum(sales,o=>o.total*.97),risk=sum(S.products.filter(isExp),p=>p.qty*p.price);
 const kg=u*.5,co2=kg*2.5;
 return head('Reports','What matching has recovered so far.')+
 `<div class="panel kpis"><div><span>Revenue recovered</span><b>${rpm(got)}</b><small class="mute">after 3% seller fee</small></div><div><span>Food saved</span><b>${kg.toFixed(0)} kg</b><small class="mute">${u} units sold before expiry</small></div><div><span>CO2e avoided</span><b>${co2.toFixed(0)} kg</b><small class="mute">estimate, see note</small></div></div>
 <div class="panel pb"><p>Stock value that expires within ${S.settings.alertDays} days: <b>${rp(risk)}</b>. Selling it at half price would recover about <b>${rp(risk*.485)}</b> after the seller fee.</p>
 <p class="mute" style="font-size:13px;margin-top:10px">Assumptions: 0.5 kg per unit and 2.5 kg CO2e per kg of food. Replace both with your own figures in js/app.js (search "kg").</p></div>`};

V.settings=()=>{const s=S.settings,T=[['Free','Rp 0','Basic dashboard, expiry alerts, up to 50 SKUs'],['Basic','Rp 200.000 per month','Live ERP/POS sync, manual matching'],['Premium','Rp 400.000 per month','Forecasting and automatic matching']];
 return head('Settings')+`<div class="panel"><div class="ph"><h2>Plan</h2></div>${T.map(t=>`<label class="li" style="cursor:pointer"><input type="radio" name="plan" value="${t[0]}" ${s.plan===t[0]?'checked':''}><div class="t"><b style="font-weight:500">${t[0]}, ${t[1]}</b><span>${t[2]}</span></div></label>`).join('')}<p class="pb mute" style="font-size:13px">Marketplace fee is 4% of a completed sale (3% seller, 1% buyer). Delivery insurance is optional at 1%.</p></div>
 <div class="panel pb" style="display:grid;gap:14px;max-width:480px"><label>Alert me this many days before expiry <input class="in" id="days" type="number" min="1" max="60" value="${s.alertDays}" style="width:90px"></label>
 <label style="display:flex;gap:8px"><input type="checkbox" id="wa" ${s.whatsapp?'checked':''}> Send alerts to WhatsApp</label>
 <div><button class="btn" id="reset">Reset sample data</button></div></div>`};

/* dialogs */
const dlg=$('#dlg');
function modal(title,body,ok,done,onIn){dlg.innerHTML=`<form><h2>${title}</h2>${body}<div class="row end"><button type="button" class="btn" data-close>Cancel</button><button class="btn pri">${ok}</button></div></form>`;const f=dlg.firstChild;f.onsubmit=e=>{e.preventDefault();done(new FormData(f));dlg.close()};if(onIn){f.oninput=()=>onIn(f);onIn(f)}dlg.showModal()}
const opts=a=>a.map(o=>`<option>${o}</option>`).join('');
const iso=d=>d.toISOString().slice(0,10);
const nextId=a=>Math.max(0,...a.map(x=>x.id))+1;

function listDlg(id){const p=S.products.find(x=>x.id==id);
 modal('Sell '+esc(p.name),`<label>Quantity (you have ${p.qty})<input class="in" name="n" type="number" min="1" max="${p.qty}" value="${p.qty}" required></label><label>Price per unit (regular ${rp(p.price)})<input class="in" name="pr" type="number" min="1" value="${Math.round(p.price/2)}" required></label><p class="mute" style="font-size:13px">Buyers will see the expiry date: ${p.exp}.</p>`,'List for sale',f=>{
  S.mine.push({id:nextId(S.mine.concat(S.listings)),pid:p.id,seller:'You',km:0,name:p.name,brand:p.brand,qty:+f.get('n'),regular:p.price,price:+f.get('pr'),exp:p.exp,img:p.img,outlet:p.outlet});
  note('Listed on marketplace',p.name);save();toast('Listed '+p.name);render()})}

function buyDlg(id){const l=S.listings.find(x=>x.id==id);
 modal('Buy '+esc(l.name),`<label>Quantity (up to ${l.qty})<input class="in" name="n" type="number" min="1" max="${l.qty}" value="1" required></label><label>Deliver to<select name="o">${opts(S.outlets)}</select></label><label class="c"><input type="checkbox" name="ins"> Add delivery insurance (1%)</label><div class="sum" id="sum"></div>`,'Place order',f=>{
  const n=+f.get('n'),sub=n*l.price,tot=Math.round(sub*(1.01+(f.get('ins')?.01:0)));
  const o={id:'SS-'+(1041+S.orders.length),date:iso(today),party:l.seller,type:'Purchase',item:l.name,qty:n,total:tot,status:'Pending',goods:{name:l.name,brand:l.brand,cat:'Others',outlet:f.get('o'),price:l.regular,exp:l.exp,img:l.img}};
  S.orders.unshift(o);l.qty-=n;if(!l.qty)S.listings=S.listings.filter(x=>x!==l);note('Order placed',l.seller);save();toast('Order '+o.id+' placed');location.hash='orders';render()},
 f=>{const n=+f.n.value||0,sub=n*l.price;$('#sum').innerHTML=`<div><span>Goods</span><span>${rp(sub)}</span></div><div><span>Buyer fee (1%)</span><span>${rp(sub*.01)}</span></div>${f.ins.checked?`<div><span>Insurance (1%)</span><span>${rp(sub*.01)}</span></div>`:''}<div><b>Total</b><b>${rp(Math.round(sub*(1.01+(f.ins.checked?.01:0))))}</b></div>`})}

function addDlg(){const d=new Date(today);d.setDate(d.getDate()+30);
 modal('Add product',`<label>Name<input class="in" name="name" required></label><label>Brand<input class="in" name="brand" required></label><div class="row"><label>Category<select name="cat">${opts(['Beverages','Dairy','Snacks','Others'])}</select></label><label>Outlet<select name="o">${opts(S.outlets)}</select></label></div><div class="row"><label>Quantity<input class="in" name="qty" type="number" min="0" value="10" required></label><label>Minimum<input class="in" name="min" type="number" min="0" value="10" required></label></div><div class="row"><label>Price (Rp)<input class="in" name="pr" type="number" min="1" required></label><label>Expiry date<input class="in" name="exp" type="date" value="${iso(d)}" required></label></div>`,'Add product',f=>{
  const id=nextId(S.products);S.products.push({id,sku:'SS-'+(1000+id*7),name:f.get('name'),brand:f.get('brand'),cat:f.get('cat'),outlet:f.get('o'),qty:+f.get('qty'),min:+f.get('min'),price:+f.get('pr'),exp:f.get('exp'),img:'box'});
  note('Product added',f.get('name'));save();render()})}

/* actions */
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if('close' in d)dlg.close();
 if('more' in d){dlg.innerHTML=`<div class="sheet"><h2 style="margin-bottom:6px">More</h2>${NAV.slice(4).map(([id,l])=>`<a href="#${id}">${ic(id)}${l}</a>`).join('')}<button class="btn" data-close style="margin-top:14px;width:100%">Close</button></div>`;dlg.showModal()}
 if(d.tab){tab=d.tab;render()}
 if(d.list)listDlg(d.list);
 if(d.buy)buyDlg(d.buy);
 if(d.qty){const[i,n]=d.qty.split(':'),p=S.products.find(x=>x.id==i);p.qty=Math.max(0,p.qty+ +n);save();render()}
 if(d.del&&confirm('Delete this product?')){S.products=S.products.filter(x=>x.id!=d.del);save();render()}
 if(d.pull){S.mine=S.mine.filter(x=>x.id!=d.pull);save();render()}
 if(d.sold){const l=S.mine.find(x=>x.id==d.sold),p=S.products.find(x=>x.id==l.pid);
  if(p)p.qty=Math.max(0,p.qty-l.qty);const tot=l.qty*l.price;
  S.orders.unshift({id:'SS-'+(1041+S.orders.length),date:iso(today),party:'Nearby buyer',type:'Sale',item:l.name,qty:l.qty,total:tot,status:'Pending'});
  S.mine=S.mine.filter(x=>x!==l);note('Sale recorded',l.name);save();toast('Sale recorded. You receive '+rp(tot*.97));render()}
 if(d.adv){const o=S.orders.find(x=>x.id===d.adv);o.status=o.status==='Pending'?'In transit':'Delivered';
  if(o.status==='Delivered'&&o.goods){const g=o.goods,m=S.products.find(p=>p.name===g.name&&p.outlet===g.outlet&&p.exp===g.exp);
   if(m)m.qty+=o.qty;else{const id=nextId(S.products);S.products.push({id,sku:'SS-'+(1000+id*7),min:10,qty:o.qty,...g})}note('Order delivered',o.item)}
  save();render()}
 if(b.id==='add')addDlg();
 if(b.id==='reset'&&confirm('Replace all data with the sample data?')){S=structuredClone(SEED);save();render()}
 if(b.id==='csv'){const r=[['SKU','Name','Brand','Outlet','Category','Qty','Min','Price','Expiry'],...prods().map(p=>[p.sku,p.name,p.brand,p.outlet,p.cat,p.qty,p.min,p.price,p.exp])];
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([r.map(x=>x.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv'}));a.download='stocksync-inventory.csv';a.click()}});
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='outlet'){S.outlet=t.value;save();render()}
 if(t.name==='plan'){S.settings.plan=t.value;save();toast('Plan set to '+t.value)}
 if(t.id==='days'){S.settings.alertDays=Math.min(60,Math.max(1,+t.value||7));save();render()}
 if(t.id==='wa'){S.settings.whatsapp=t.checked;save()}});
$('#q').addEventListener('input',e=>{q=e.target.value;if(location.hash!=='#inventory')location.hash='inventory';else render()});

function render(){
 const r=(location.hash||'#dashboard').slice(1),k=V[r]?r:'dashboard',n=S.products.filter(isExp).length;
 $('#nav').innerHTML=NAV.map(([id,l])=>`<a href="#${id}" class="${id===k?'on':''}">${ic(id)}${l}${id==='expiry'&&n?`<span class="n">${n}</span>`:''}</a>`).join('');
 $('#tabbar').innerHTML=[['dashboard','Home'],['inventory','Stock'],['expiry','Expiry'],['marketplace','Market']].map(([id,l])=>`<a class="tb ${id===k?'on':''}" href="#${id}">${ic(id)}${l}${id==='expiry'&&n?`<span class="n">${n}</span>`:''}</a>`).join('')+`<button class="tb ${['orders','outlets','reports','settings'].includes(k)?'on':''}" data-more>${ic('more')}More</button>`;
 $('#bell').innerHTML=ic('bell')+(n?`<i>${n}</i>`:'');
 $('#view').innerHTML=V[k]();document.title='StockSync, '+NAV.find(x=>x[0]===k)[1]}
window.addEventListener('hashchange',()=>{if(dlg.open)dlg.close();render()});render();
})();
