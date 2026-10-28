(()=>{
const KEY='stocksync.v3',$=(s,r=document)=>r.querySelector(s);
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
let q='',lastK='';

/* icons: plain 24px strokes, drawn for this project */
const IC={dashboard:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',inventory:'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',expiry:'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',marketplace:'M3 9l2-5h14l2 5M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M5 13v8h14v-8M10 21v-5h4v5',orders:'M8 3h8v4H8zM6 5H5v16h14V5h-1M9 12h6M9 16h6',outlets:'M12 21s-7-6-7-12a7 7 0 0114 0c0 6-7 12-7 12zM12 7a2.5 2.5 0 100 5 2.5 2.5 0 000-5',reports:'M4 20V11M10 20V4M16 20v-7M2 21h20',settings:'M4 7h9M17 7h3M4 17h3M11 17h9M15 4v6M9 14v6',bell:'M6 9a6 6 0 0112 0c0 6 2 7 2 8H4c0-1 2-2 2-8zM10 21h4',more:'M5 12h.01M12 12h.01M19 12h.01',leaf:'M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8',coin:'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v10M9.5 9.5h4a1.8 1.8 0 010 3.6h-3a1.8 1.8 0 000 3.4h4',pinio:'M12 21s-7-6-7-12a7 7 0 0114 0c0 6-7 12-7 12z',alert:'M12 3 2 20h20zM12 10v5M12 18h.01',trash:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',cube:'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8'};
const ic=n=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n]}"${n==='more'?' stroke-width="3"':''}/></svg>`;
const NAV=[['dashboard','Dashboard'],['inventory','Inventory'],['expiry','Expiry watch'],['marketplace','Marketplace'],['orders','Orders'],['reports','Reports'],['settings','Settings']];

const NAME=Object.fromEntries(NAV);
const tbl=(cols,rows,empty='Nothing here yet.',attr=()=>'',cls='')=>rows.length?`<table class="${cls}"><thead><tr>${cols.map(c=>`<th class="${c.r?'r':''}">${c.h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr ${attr(r)}>${cols.map(c=>`<td class="${c.r?'r':''}" data-label="${c.h}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table>`:`<p class="empty">${empty}</p>`;
const head=(t,sub,extra='')=>`<div class="head"><div><h1>${t}</h1>${sub?`<p>${sub}</p>`:''}</div><div class="row">${extra}</div></div>`;
const outSel=()=>`<select id="outlet" aria-label="Outlet"><option value="all">All outlets</option>${S.outlets.map(o=>`<option ${S.outlet===o?'selected':''}>${o}</option>`).join('')}</select>`;
const status=o=>{const P=S.products.filter(p=>p.outlet===o),l=P.filter(isLow).length,e=P.filter(isExp).length;return l>=3?['Restock','warn']:e>=2?['Check expiry','warn']:['Healthy','ok']};

function chart(v,f){const m=mob(),W=m?Math.max(280,Math.min(innerWidth-62,640)):560,H=m?190:210,L=m?64:66,B=26,T=10,R=m?24:30,mx=(Math.max(...v)||1)*1.15,x=i=>L+i*(W-L-R)/6,y=n=>T+(H-T-B)*(1-n/mx);let g='';
for(let i=0;i<=3;i++){const n=mx*i/3;g+=`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(n)}" y2="${y(n)}"/><text x="${L-8}" y="${y(n)+4}" text-anchor="end">${f(n)}</text>`}
const lab=v.map((_,i)=>{if(m&&i%2)return '';const d=new Date(today);d.setDate(d.getDate()-6+i);return `<text x="${x(i)}" y="${H-6}" text-anchor="middle">${d.getDate()} ${d.toLocaleString('en',{month:'short'})}</text>`}).join('');
const pts=v.map((n,i)=>x(i)+','+y(n)).join(' ');
return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Last 7 days"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2352C8" stop-opacity=".25"/><stop offset="1" stop-color="#2352C8" stop-opacity="0"/></linearGradient></defs>${g}<polygon fill="url(#ag)" stroke="none" points="${x(0)},${y(0)} ${pts} ${x(6)},${y(0)}"/><polyline class="ln" points="${pts}"/>${v.map((n,i)=>`<rect class="pt" x="${x(i)-3.5}" y="${y(n)-3.5}" width="7" height="7" rx="3.5"><title>${f(n)}</title></rect>`).join('')}${lab}</svg>`}

/* ---------- visual helpers: product tiles, shop fronts, maps, charts ---------- */
const IMGCAT={milk:'Dairy',choco:'Dairy',yogurt:'Dairy',cheese:'Dairy',water:'Beverages',tea:'Beverages',soda:'Beverages',chips:'Snacks',wafer:'Snacks',biscuit:'Snacks'};
const TINT={Dairy:'#DCEBFF',Beverages:'#D5F1EE',Snacks:'#FFEACB',Others:'#EBE3FA'};
const thumb=(n,cls='')=>`<span class="thumb ${cls}" style="background:${TINT[IMGCAT[n]||'Others']}">${img(n)}</span>`;
const SHOPC=['#E8573D','#2352C8','#12908A','#D98A0B','#7A56C8','#C0366C'];
const hash=t=>[...String(t)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const shopColor=n=>SHOPC[hash(n)%SHOPC.length];
const shop=(name,sz=40)=>{const c=shopColor(name),k='stroke="#14233B" stroke-linejoin="round"';return `<svg class="shop" viewBox="0 0 48 48" width="${sz}" height="${sz}" aria-hidden="true"><rect x="6" y="20" width="36" height="22" rx="2" fill="#fff" ${k} stroke-width="2"/><path d="M4 20 8 8h32l4 12z" fill="${c}" ${k} stroke-width="2"/><path d="M15 8 13 20M23 8l-1 12M31 8l1 12M39 8l-2 12" stroke="#fff" stroke-width="2.4" opacity=".75"/><rect x="10" y="26" width="12" height="9" fill="#CFE0FA" ${k} stroke-width="1.6"/><rect x="28" y="26" width="9" height="16" fill="${c}" ${k} stroke-width="1.6"/></svg>`};
const fresh=p=>{const d=left(p),w=S.settings.alertDays,pct=Math.max(6,Math.min(100,Math.round(d/(w*2)*100))),c=d<=3?'var(--bad)':d<=w?'#E08A1E':'var(--ok)';return `<i class="fresh" aria-hidden="true"><b style="width:${pct}%;background:${c}"></b></i>`};
const kic=(n,c)=>`<i class="ki" style="background:${c}1F;color:${c}">${ic(n)}</i>`;
const donut=(pct,c,center,sub)=>{const R=46,C=2*Math.PI*R,d=C*Math.min(100,pct)/100;return `<svg class="donut" viewBox="0 0 120 120" role="img" aria-label="${center} ${sub}"><circle cx="60" cy="60" r="${R}" fill="none" stroke="#E0E8F3" stroke-width="14"/><circle cx="60" cy="60" r="${R}" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${d.toFixed(1)} ${(C-d).toFixed(1)}" transform="rotate(-90 60 60)"/><text x="60" y="61" text-anchor="middle" class="dn">${center}</text><text x="60" y="77" text-anchor="middle" class="ds">${sub}</text></svg>`};
const trk=st=>{const i=['Pending','In transit','Delivered'].indexOf(st);return `<span class="trk" aria-hidden="true">${[0,1,2].map(n=>`<i class="${n<=i?'on':''}"></i>`).join('')}</span>`};

/* A drawn street map (works offline, no tiles). Positions are schematic, not to scale. */
const mapSize=h=>mob()?[Math.max(290,Math.min(innerWidth-34,640)),h]:[780,400];
function mapBase(W,H){const X=f=>(f*W).toFixed(1),Y=f=>(f*H).toFixed(1);
 const R=(d,w)=>`<path d="${d}" fill="none" stroke="#B9C7DA" stroke-width="${w+2}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round"/>`;
 const minor=[[.05,.1,.4,.16],[.1,.55,.5,.5],[.45,.2,.9,.28],[.55,.62,.95,.58],[.08,.88,.6,.95],[.65,.05,.62,.35]].map(([a,b,c,d])=>`<path d="M${X(a)} ${Y(b)}L${X(c)} ${Y(d)}" stroke="#fff" stroke-width="2.5" opacity=".9"/>`).join('');
 const dl=(x,y,t)=>`<text class="dl" x="${X(x)}" y="${Y(y)}">${t}</text>`;
 return `<defs><linearGradient id="mland" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EEF3E6"/><stop offset="1" stop-color="#E2ECF6"/></linearGradient><pattern id="mgrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#CBD9EA" stroke-width=".7" opacity=".7"/></pattern></defs>
 <rect width="${W}" height="${H}" fill="url(#mland)"/><rect width="${W}" height="${H}" fill="url(#mgrid)"/>
 <ellipse cx="${X(.12)}" cy="${Y(.18)}" rx="${X(.08)}" ry="${Y(.1)}" fill="#CFE6C4"/><ellipse cx="${X(.9)}" cy="${Y(.84)}" rx="${X(.08)}" ry="${Y(.1)}" fill="#CFE6C4"/><ellipse cx="${X(.3)}" cy="${Y(.92)}" rx="${X(.06)}" ry="${Y(.06)}" fill="#CFE6C4"/><ellipse cx="${X(.8)}" cy="${Y(.14)}" rx="${X(.05)}" ry="${Y(.07)}" fill="#CFE6C4"/>
 <path d="M${X(.72)} -6C${X(.55)} ${Y(.28)} ${X(.82)} ${Y(.55)} ${X(.62)} ${H+6}" fill="none" stroke="#B5D5F3" stroke-width="18" stroke-linecap="round"/><path d="M${X(.72)} -6C${X(.55)} ${Y(.28)} ${X(.82)} ${Y(.55)} ${X(.62)} ${H+6}" fill="none" stroke="#CFE5F9" stroke-width="9" stroke-linecap="round"/>
 ${minor}${R(`M-6 ${Y(.4)}C${X(.3)} ${Y(.26)} ${X(.6)} ${Y(.56)} ${W+6} ${Y(.42)}`,9)}${R(`M${X(.24)} -6C${X(.32)} ${Y(.4)} ${X(.2)} ${Y(.7)} ${X(.36)} ${H+6}`,6)}${R(`M-6 ${Y(.8)}C${X(.3)} ${Y(.7)} ${X(.7)} ${Y(.94)} ${W+6} ${Y(.74)}`,6)}${R(`M${X(.92)} -6L${X(.78)} ${H+6}`,5)}
 ${dl(.03,.07,'SOUTH JAKARTA')}${dl(.03,.97,'SOUTH TANGERANG')}${dl(.74,.97,'DEPOK')}
 <g transform="translate(${W-28} 28)"><circle r="15" fill="#fff" stroke="#C3D0E2"/><path d="M0-10 4 3 0 0-4 3z" fill="#C0362C"/><text y="12" text-anchor="middle" style="font-size:9px;font-weight:700;fill:#14233B">N</text></g>`}
const pin=(x,y,c,att='')=>`<g class="pin" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" ${att}><ellipse cy="2" rx="9" ry="3" fill="#14233B" stroke="none" opacity=".2"/><path d="M0 0C-10-11-15-17-15-24a15 15 0 1 1 30 0c0 7-5 13-15 24z" fill="${c}" stroke="#fff" stroke-width="2.5"/><circle cy="-24" r="9.5" fill="#fff" stroke="none"/><path d="M-5-29h10l1.5 5h-13zM-4.5-24v7h9v-7" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/></g>`;
const lbl=(x,y,W,t1,t2,c='var(--mute)')=>{const right=x>=W/2,e=right?x>W*.72:x>=W*.28,ax=e?x-20:x+20;return `<text class="lbl" x="${ax.toFixed(1)}" y="${(y-27).toFixed(1)}" text-anchor="${e?'end':'start'}">${esc(t1)}</text><text class="lbl2" x="${ax.toFixed(1)}" y="${(y-14).toFixed(1)}" text-anchor="${e?'end':'start'}" style="fill:${c}">${esc(t2)}</text>`};

const ANG={'Toko Maju Jaya, Cipete':200,'Minimart Berkah, Bintaro':250,'Kedai Lestari, Serpong':322,'Warung Bu Tini, Pamulang':42};
const sellersOf=()=>{const m=new Map();S.listings.forEach(l=>{const e=m.get(l.seller)||{name:l.seller,km:l.km,n:0};e.n++;m.set(l.seller,e)});return[...m.values()]};
function sellerMap(){const[W,H]=mapSize(mob()?360:400),cx=W/2,cy=H/2+6,sc=Math.min(W/2-28,H/2-34)/10,SL=sellersOf();
 const rings=[2.5,5,10].map(k=>`<circle cx="${cx}" cy="${cy}" r="${k*sc}" fill="${k===10?'#2352C8':'none'}" fill-opacity=".04" stroke="#5B7DB8" stroke-width="1.2" stroke-dasharray="4 5" opacity=".7"/><text class="rk" x="${cx}" y="${cy-k*sc-3}" text-anchor="middle">${k} km</text>`).join('');
 const pts=SL.map(e=>{const a=(ANG[e.name]??hash(e.name)%360)*Math.PI/180;return{...e,x:cx+Math.cos(a)*e.km*sc,y:cy+Math.sin(a)*e.km*sc}});
 const body=pts.map(p=>`<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#E08A1E" stroke-width="1.6" stroke-dasharray="3 4" opacity=".75"/>`).join('')+
  pts.map(p=>pin(p.x,p.y,'#E8731F',`data-pin="${esc(p.name)}" tabindex="0" role="button" aria-label="${esc(p.name)}, ${p.km} km"`)+lbl(p.x,p.y,W,p.name.split(',')[0],`${p.km} km, ${p.n} item${p.n>1?'s':''}`)).join('');
 const me=`<circle class="pulse" cx="${cx}" cy="${cy}" r="10" fill="#2352C8" stroke="none"/><circle cx="${cx}" cy="${cy}" r="9" fill="#2352C8" stroke="#fff" stroke-width="3.5"/><text class="lbl" x="${cx}" y="${cy+26}" text-anchor="middle">You</text>`;
 return `<div class="panel mapp"><div class="ph"><h2>Sellers near you</h2><span class="mute small">${pts.length} sellers within ${Math.max(0,...pts.map(p=>p.km))} km. Tap a pin.</span></div><svg class="mp" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of nearby sellers">${mapBase(W,H)}${rings}${body}${me}</svg><p class="cap">Schematic map, not to scale.</p></div>`}

const OPOSM={Kemang:[.46,.3],BSD:[.2,.6],Depok:[.44,.84],'Warung Sari Rasa':[.82,.5]};
const OPOS={Kemang:[.5,.36],BSD:[.17,.64],Depok:[.58,.82],'Warung Sari Rasa':[.84,.54]};
function outletMap(){const[W,H]=mapSize(mob()?340:360);
 const P=o=>{const[a,b]=(mob()?OPOSM:OPOS)[o]||[.5,.5];return[a*W,b*H]};
 const[x1,y1]=P('Depok'),[x2,y2]=P('Kemang'),route=`M${x1.toFixed(1)} ${(y1-10).toFixed(1)}C${(x1+60).toFixed(1)} ${(y1-80).toFixed(1)} ${(x2-40).toFixed(1)} ${(y2+70).toFixed(1)} ${x2.toFixed(1)} ${(y2-10).toFixed(1)}`;
 const body=S.outlets.map(o=>{const[x,y]=P(o),st=status(o),ok=st[1]==='ok',c=ok?'#1E7A4A':'#E08A1E',n=S.products.filter(p=>p.outlet===o).length,e=S.products.filter(p=>p.outlet===o&&isExp(p)).length;
  return `${ok?'':`<circle class="pulse" cx="${x.toFixed(1)}" cy="${(y-24).toFixed(1)}" r="14" fill="${c}" stroke="none"/>`}${pin(x,y,c,`data-opin="${esc(o)}" tabindex="0" role="button" aria-label="${esc(o)}, ${st[0]}"`)}${lbl(x,y,W,o,mob()?`${e} expiring`:`${n} products, ${e} expiring`,c)}`}).join('');
 return `<div class="panel mapp"><div class="ph"><h2>Your outlets</h2><span class="mute small">Tap a pin to see its expiring stock.</span></div><svg class="mp" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of your outlets">${mapBase(W,H)}<path class="route" d="${route}" fill="none" stroke="#2352C8" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round"/><circle r="5" fill="#2352C8" stroke="#fff" stroke-width="2"><animateMotion dur="5s" repeatCount="indefinite" path="${route}"/></circle>${body}</svg><div class="legend"><span><i style="background:#1E7A4A"></i>Healthy</span><span><i style="background:#E08A1E"></i>Needs attention</span><span><i class="dash"></i>Stock transfer on the way</span></div></div>`}
const skyline=`<svg class="sky" viewBox="0 0 420 150" preserveAspectRatio="xMaxYMax slice" aria-hidden="true"><circle cx="330" cy="46" r="26" fill="#fff" fill-opacity=".14"/><g fill="#fff" fill-opacity=".13" stroke="none"><rect x="20" y="70" width="46" height="80"/><rect x="74" y="44" width="38" height="106"/><rect x="120" y="86" width="52" height="64"/><rect x="180" y="58" width="34" height="92"/><rect x="224" y="96" width="60" height="54"/><rect x="292" y="74" width="40" height="76"/><rect x="340" y="100" width="64" height="50"/></g><g fill="#fff" fill-opacity=".22" stroke="none"><path d="M118 100h58l-6-14h-46z"/><path d="M222 108h64l-7-14h-50z"/><path d="M338 112h68l-7-14h-54z"/></g><g fill="#fff" fill-opacity=".3" stroke="none"><rect x="82" y="56" width="6" height="6"/><rect x="94" y="56" width="6" height="6"/><rect x="82" y="72" width="6" height="6"/><rect x="188" y="70" width="6" height="6"/><rect x="200" y="70" width="6" height="6"/><rect x="300" y="86" width="6" height="6"/><rect x="28" y="84" width="6" height="6"/><rect x="42" y="84" width="6" height="6"/></g></svg>`;

/* views */
const V={};
V.dashboard=()=>{
 const P=prods(),val=sum(P,p=>p.qty*p.price),ex=P.filter(isExp).sort((a,b)=>left(a)-left(b)),lo=P.filter(isLow);
 const h=new Date().getHours(),g=h<11?'Good morning':h<17?'Good afternoon':'Good evening';
 const day=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
 const trend=[.62,.7,.74,.79,.86,.92,1].map(k=>val*k),urgent=ex.filter(p=>left(p)<=3).length,lowO=new Set(lo.map(p=>p.outlet)).size;
 return `<section class="hero"><div class="hero-t"><p class="eyebrow">${day}</p><h1>${g}, Josephine</h1><p>${ex.length?`${ex.length} products expire within ${S.settings.alertDays} days.`:'Nothing is close to expiry.'}</p><div class="row">${outSel()}</div></div>${skyline}</section>
 <div class="panel kpis"><div>${kic('cube','#2352C8')}<span>Total stock value</span><b>${rpm(val)}</b><small class="mute">${P.length} products</small></div>
 <div>${kic('alert','#E08A1E')}<span>Items near expiry</span><b>${ex.length}</b><small class="${urgent?'bad':'mute'}">${urgent} need action</small></div>
 <div>${kic('inventory','#C0366C')}<span>Low stock items</span><b>${lo.length}</b><small class="mute">across ${lowO} outlet${lowO===1?'':'s'}</small></div></div>
 <div class="cols"><div>${outletMap()}<div class="panel pv-chart"><div class="ph"><h2>Stock value, last 7 days</h2></div><div class="pb">${chart(trend,rpm)}</div></div></div>
 <div><div class="panel pv-exp"><div class="ph"><h2>Expiry watch</h2><a class="link" href="#expiry">View all</a></div>${ex.slice(0,3).map(expRow).join('')||'<p class="empty">All clear.</p>'}</div>
 <div class="panel pv-act"><div class="ph"><h2>Recent activity</h2></div>${S.activity.slice(0,4).map(a=>`<div class="li"><div class="t"><b style="font-weight:500">${esc(a.t)}</b><span>${esc(a.s)}, ${ago(a.at)}</span></div></div>`).join('')}</div></div></div>`};
const expRow=p=>`<div class="li">${thumb(p.img)}<div class="t"><b style="font-weight:500">${esc(p.name)}</b><span>${esc(p.brand)}, ${p.outlet}</span><span class="${dayCls(left(p))}">${dayTxt(left(p))}</span>${fresh(p)}</div><div class="rt"><span>${p.qty} units</span><button class="btn sm" data-list="${p.id}">Sell</button></div></div>`;

V.inventory=()=>{
 const t=q.toLowerCase(),P=prods().filter(p=>!t||[p.name,p.brand,p.sku,p.outlet].join(' ').toLowerCase().includes(t));
 return head('Inventory',`${P.length} products${t?` matching "${esc(q)}"`:''}`,outSel()+'<button class="btn" id="csv">Download CSV</button><button class="btn pri" id="add">Add product</button>')+
 `<div class="panel">${tbl([{h:'Product',f:p=>`<span class="pc">${thumb(p.img,'sm')}<span><b style="font-weight:500">${esc(p.name)}</b><span class="mute sub">${esc(p.brand)}, ${p.outlet}</span></span></span>`},{h:'Price',r:1,f:p=>rp(p.price)},{h:'Quantity',r:1,f:p=>`<span class="qs"><button class="qb" data-qty="${p.id}:-1" aria-label="Remove one">&minus;</button><b class="${isLow(p)?'bad':''}">${p.qty}</b><button class="qb" data-qty="${p.id}:1" aria-label="Add one">+</button></span><span class="mute qmin">min ${p.min}</span>`},{h:'Expiry',f:p=>`<span class="${dayCls(left(p))}">${dayTxt(left(p))}</span>`},{h:'',f:p=>`<button class="btn sm ic" data-del="${p.id}" aria-label="Delete ${esc(p.name)}" title="Delete">${ic('trash')}</button>`}],P,'No product matches that search.',()=>'','t-inv')}</div>`};

V.expiry=()=>{const P=prods().filter(isExp).sort((a,b)=>left(a)-left(b));
 return head('Expiry watch',`Products expiring within ${S.settings.alertDays} days. Change this in Settings.`,outSel())+`<div class="panel">${P.map(expRow).join('')||'<p class="empty">Nothing is close to expiry.</p>'}</div>`};

V.marketplace=()=>{
 const card=(l,mine)=>{const d=left(l),off=Math.round((1-l.price/l.regular)*100),c=IMGCAT[l.img]||'Others';
  return `<div class="panel mc" ${mine?'':`data-seller="${esc(l.seller)}"`}><div class="mc-h" style="background:linear-gradient(145deg,${TINT[c]},#fff 90%)"><span class="off">-${off}%</span><span class="dleft ${dayCls(d)}">${dayTxt(d)}</span>${img(l.img)}</div>
  <div class="pb"><h3>${esc(l.name)}</h3><p class="mute small">${esc(l.brand)}, ${l.qty} units</p><p class="price"><b>${rp(l.price)}</b> <s class="mute">${rp(l.regular)}</s></p>
  <div class="seller">${mine?shop(l.outlet,30)+`<span>Your listing, ${esc(l.outlet)}</span>`:shop(l.seller,30)+`<span>${esc(l.seller)}</span><em class="km">${l.km} km</em>`}</div>
  ${mine?`<div class="row"><button class="btn pri" data-sold="${l.id}">Record sale</button><button class="btn" data-pull="${l.id}">Withdraw</button></div>`:`<button class="btn pri" data-buy="${l.id}">Buy</button>`}</div></div>`};
 return head('Marketplace','Surplus stock from nearby retailers, sold at about half the regular price. Listed expiry dates are always shown.')+sellerMap()+
 `<h2 style="margin:6px 0 10px">Available near you</h2><div class="grid" style="margin-bottom:28px">${S.listings.map(l=>card(l)).join('')||'<p class="empty">No listings right now.</p>'}</div>
 <h2 style="margin-bottom:10px">Your listings</h2><div class="grid">${S.mine.map(l=>card(l,1)).join('')||'<p class="mute">Nothing listed. Use Sell on the Expiry watch page.</p>'}</div>`};

V.orders=()=>head('Orders','Sales and purchases made through the marketplace.')+`<div class="panel">${tbl([{h:'Order',f:o=>o.id},{h:'Date',f:o=>o.date},{h:'Type',f:o=>o.type},{h:'Item',f:o=>`${esc(o.item)} x ${o.qty}`},{h:'With',f:o=>esc(o.party)},{h:'Total',r:1,f:o=>rp(o.total)},{h:'Status',f:o=>`<span class="${o.status==='Delivered'?'ok':o.status==='Pending'?'mute':'warn'}">${o.status}</span>${trk(o.status)}`},{h:'',f:o=>o.status==='Delivered'?'':`<button class="btn sm" data-adv="${o.id}">Mark ${o.status==='Pending'?'in transit':'delivered'}</button>`}],S.orders,'No orders yet.',()=>'','t-ord')}</div>`;

V.reports=()=>{
 const sales=S.orders.filter(o=>o.type==='Sale'&&o.status==='Delivered'),u=sum(sales,o=>o.qty),got=sum(sales,o=>o.total*.97),risk=sum(S.products.filter(isExp),p=>p.qty*p.price);
 const kg=u*.5,co2=kg*2.5,tot=sum(S.products,p=>p.qty*p.price),mxv=Math.max(0,...S.outlets.map(o=>sum(S.products.filter(p=>p.outlet===o),p=>p.qty*p.price)));
 return head('Reports','What matching has recovered so far. Counts delivered sales only.')+
 `<div class="panel kpis"><div>${kic('coin','#1E7A4A')}<span>Revenue recovered</span><b>${rpm(got)}</b><small class="mute">after 3% seller fee</small></div><div>${kic('leaf','#12908A')}<span>Food saved</span><b>${kg.toFixed(0)} kg</b><small class="mute">${u} units delivered before expiry</small></div><div>${kic('leaf','#2352C8')}<span>CO2e avoided</span><b>${co2.toFixed(0)} kg</b><small class="mute">estimate, see note</small></div></div>
 <div class="grid2"><div class="panel"><div class="ph"><h2>Stock at risk</h2></div><div class="pb dn-row">${donut(tot?Math.round(risk/tot*100):0,'#E08A1E',(tot?Math.round(risk/tot*100):0)+'%','at risk')}<div class="dn-l"><p><i style="background:#E08A1E"></i>Expires within ${S.settings.alertDays} days<b>${rp(risk)}</b></p><p><i style="background:#1E7A4A"></i>Recoverable at half price<b>${rp(risk*.485)}</b></p></div></div></div>
 <div class="panel"><div class="ph"><h2>Value by outlet</h2></div><div class="pb">${S.outlets.map(o=>{const v=sum(S.products.filter(p=>p.outlet===o),p=>p.qty*p.price);return `<div class="ob">${shop(o,28)}<div><div class="ob-t"><span>${esc(o)}</span><b>${rpm(v)}</b></div><i class="vbar"><i style="width:${mxv?Math.round(v/mxv*100):0}%"></i></i></div></div>`}).join('')}</div></div></div>
 <p class="mute small cap">Assumptions: 0.5 kg per unit and 2.5 kg CO2e per kg of food. Replace both with your own figures in js/app.js (search "kg").</p>`};

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
const pinGo=e=>{const g=e.target.closest('[data-pin],[data-opin]');if(!g)return false;
 if(g.dataset.opin){S.outlet=g.dataset.opin;save();go('expiry');return true}
 const els=[...document.querySelectorAll('[data-seller]')].filter(x=>x.dataset.seller===g.dataset.pin);
 els.forEach(x=>{x.classList.remove('flash');void x.offsetWidth;x.classList.add('flash')});if(els[0])els[0].scrollIntoView({block:'center',behavior:'smooth'});return true};
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest&&e.target.closest('[data-pin],[data-opin]')){e.preventDefault();pinGo(e)}});
document.addEventListener('click',e=>{
 if(pinGo(e))return;
 const a=e.target.closest('a');if(a&&dlg.open&&a.closest('.sheet'))dlg.close();
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if('close' in d)dlg.close();
 if('more' in d){dlg.innerHTML=`<div class="sheet"><h2 style="margin-bottom:6px">More</h2>${NAV.slice(4).map(([id,l])=>`<a href="#${id}">${ic(id)}<span class="lb">${l}</span></a>`).join('')}<button class="btn" data-close style="margin-top:14px;width:100%">Close</button></div>`;dlg.showModal()}
 if(d.list)listDlg(d.list);
 if(d.buy)buyDlg(d.buy);
 if(d.qty){const[i,n]=d.qty.split(':'),p=S.products.find(x=>x.id==i);if(p){p.qty=Math.max(0,p.qty+ +n);save();render()}}
 if(d.del){const id=+d.del,pr=S.products.find(x=>x.id===id);if(pr)modal('Delete product',`<p>Delete <b>${esc(pr.name)}</b> from ${esc(pr.outlet)}? This cannot be undone.</p>`,'Delete',()=>{S.products=S.products.filter(x=>x.id!==id);S.mine=S.mine.filter(x=>x.pid!==id);save();render();toast('Product deleted')});dlg.querySelector('form .pri')?.classList.add('danger')}
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
 const r=(location.hash||'#dashboard').slice(1),k=V[r]?r:'dashboard';if(r!==k)history.replaceState(null,'','#'+k);document.body.dataset.page=k;const n=S.products.filter(isExp).length;
 $('#nav').innerHTML=NAV.map(([id,l])=>`<a href="#${id}" class="${id===k?'on':''}" ${id===k?'aria-current="page"':''}>${ic(id)}<span class="lb">${l}</span>${id==='expiry'&&n?`<span class="n">${n}</span>`:''}</a>`).join('');
 $('#tabbar').innerHTML=[['dashboard','Home'],['inventory','Stock'],['expiry','Expiry'],['marketplace','Market']].map(([id,l])=>`<a class="tb ${id===k?'on':''}" href="#${id}">${ic(id)}${l}${id==='expiry'&&n?`<span class="n">${n}</span>`:''}</a>`).join('')+`<button class="tb ${['orders','reports','settings'].includes(k)?'on':''}" data-more>${ic('more')}More</button>`;
 $('#view').innerHTML=V[k]();document.title='StockSync, '+NAME[k];
 if(k!==lastK){lastK=k;scrollTo(0,0)}
}
window.addEventListener('hashchange',()=>{if(dlg.open)dlg.close();render()});
matchMedia('(max-width:900px)').addEventListener('change',render);
let rw=innerWidth,rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(mob()&&Math.abs(innerWidth-rw)>20){rw=innerWidth;render()}},150)});
render();
})();
