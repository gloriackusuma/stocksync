/* Sample data. Every date is relative to today so the demo always looks current. */
(function(){
const iso=n=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const ago=h=>Date.now()-h*36e5;
const P=(name,brand,cat,outlet,qty,min,price,days,img)=>({name,brand,cat,outlet,qty,min,price,exp:iso(days),img});
const prods=[
P('Fresh milk 1L','Diamond','Dairy','Kemang',48,20,18500,1,'milk'),
P('Yogurt plain 500g','Elle & Vire','Dairy','BSD',32,15,32000,4,'yogurt'),
P('Cooking oil 2L','Bimoli','Others','Depok',61,30,36500,7,'oil'),
P('Mineral water 600ml','Aqua','Beverages','Kemang',420,150,3200,190,'box'),
P('Iced tea 350ml','Teh Pucuk','Beverages','BSD',18,60,4200,60,'box'),
P('Potato chips 68g','Chitato','Snacks','Depok',140,50,11500,45,'box'),
P('Wafer 130g','Tango','Snacks','Kemang',25,40,9800,12,'box'),
P('Instant noodles','Indomie','Others','Warung Sari Rasa',300,100,3100,120,'box'),
P('UHT chocolate milk 200ml','Ultra','Dairy','Depok',90,40,6200,6,'milk'),
P('Sliced bread','Sari Roti','Others','BSD',22,20,17000,3,'box'),
P('Cheese slices 10pc','Kraft','Dairy','Kemang',14,20,38000,9,'box'),
P('Lemon soda 390ml','Sprite','Beverages','Warung Sari Rasa',70,60,4800,85,'box'),
P('Cream biscuits 135g','Roma','Snacks','Warung Sari Rasa',12,30,8500,30,'box'),
P('Eggs 10pc','Telur Ayam','Others','Depok',10,25,27000,5,'box')
].map((p,i)=>(p.id=i+1,p.sku='SS-'+String(1000+i*7),p));
const L=(id,seller,km,name,brand,qty,regular,days,img)=>({id,seller,km,name,brand,qty,regular,price:Math.round(regular/2),exp:iso(days),img});
window.SEED={
 outlet:'all',
 settings:{plan:'Basic',alertDays:7,whatsapp:true,erp:{on:true,type:'ERP + POS',url:'https://api.example-store.co.id/v1',last:Date.now()-18*6e4}},
 outlets:['Kemang','BSD','Depok','Warung Sari Rasa'],
 products:prods,
 listings:[
  L(1,'Toko Maju Jaya, Cipete',3.2,'Fresh milk 1L','Greenfields',60,19500,3,'milk'),
  L(2,'Minimart Berkah, Bintaro',7.9,'Cooking oil 2L','Fortune',40,35000,6,'oil'),
  L(3,'Kedai Lestari, Serpong',4.1,'Yogurt drink 250ml','Cimory',80,9500,4,'yogurt'),
  L(4,'Toko Maju Jaya, Cipete',3.2,'Potato chips 68g','Lays',120,12000,10,'box'),
  L(5,'Warung Bu Tini, Pamulang',9.4,'Instant noodles','Mie Sedaap',200,3000,15,'box')],
 mine:[],
 orders:[
  {id:'SS-1038',date:iso(-3),party:'Warung Sari Rasa',type:'Sale',item:'Fresh milk 1L',qty:20,total:185000,status:'Delivered'},
  {id:'SS-1039',date:iso(-2),party:'Kedai Lestari, Serpong',type:'Sale',item:'Cheese slices 10pc',qty:6,total:114000,status:'Delivered'},
  {id:'SS-1040',date:iso(-1),party:'Minimart Berkah, Bintaro',type:'Purchase',item:'Cooking oil 2L',qty:10,total:178500,status:'In transit',
   goods:{name:'Cooking oil 2L',brand:'Fortune',cat:'Others',outlet:'Depok',price:35000,exp:iso(6),img:'oil'}}],
 activity:[
  {t:'Stock transfer completed',s:'From Depok to Kemang',at:ago(2)},
  {t:'New order received',s:'Warung Sari Rasa',at:ago(3)},
  {t:'Product matched',s:'Fresh milk 1L',at:ago(5)},
  {t:'Inventory updated',s:'12 products',at:ago(6)}]
};
})();
