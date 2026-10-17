'use strict';
// Deterministic scenario model. All balances, prices and rates are illustrative.
function taxYear(date,region='uk'){const y=Number(date.slice(0,4));return date.slice(5)>=(region==='au'?'07-01':'04-06')?y:y-1}
function investmentRoutes(p,c){
 const sameYear=taxYear(p.date||'2026-10-17',c.region)===2026,isaRoom=sameYear&&c.region!=='au'?Math.max(0,20000-c.usedISA):0,eisRoom=sameYear&&c.region!=='au'?Math.max(0,1000000-c.usedEIS):0;
 const fund=['fund','help'].includes(p.type),eis=p.type==='startup'&&p.eis==='yes';
 const splitPersonal=c.region==='au'?p.amount/2:Math.min(p.amount,eis?(p.amount>eisRoom?eisRoom:p.amount/2):fund?isaRoom:p.amount/2);
 const definitions=[{route:'personal',title:'All personally',legs:[{owner:'personal',amount:p.amount}]},{route:'split',title:'Personal + company',legs:[{owner:'personal',amount:splitPersonal},{owner:'company',amount:p.amount-splitPersonal}]},{route:'company',title:'All in the company',legs:[{owner:'company',amount:p.amount}]}];
 return definitions.filter(d=>d.route!=='split'||d.legs.every(l=>l.amount>0)).map(d=>{
  const pools=c.sources.map(s=>({...s,balance:Math.min(s.balance,p.sourceCaps?.[s.id]??s.balance),used:0}));let loanLeft=c.loanPrincipal,parts=[],shortfall=0,now=0,isaLeft=isaRoom,eisLeft=eisRoom;
  const tax=(s,gross)=>s.kind==='cash'?0:s.owner==='company'?gross*s.gainRatio*(c.companyRate??.25):Math.max(0,gross*s.gainRatio-(sameYear&&c.region!=='au'?Math.max(0,3000-c.usedCGT):0))*(c.personalSaleRate??.24);
  const legs=d.legs.filter(l=>l.amount>0).map((l,index)=>{
   let remaining=l.amount;
   // Use each source only once across both subscriptions; cash before sales.
   const sources=[...pools].sort((a,b)=>(a.kind==='sale'?2:0)+(a.owner!==l.owner?1:0)-((b.kind==='sale'?2:0)+(b.owner!==l.owner?1:0)));
   for(const s of sources){if(remaining<.005)break;if(s.kind==='sale'&&!p.sales)continue;if(s.owner!==l.owner&&!p.cross)continue;
    const limit=s.balance-s.used;if(limit<=0)continue;let desired=remaining;if(s.owner==='company'&&l.owner==='personal')desired=Math.min(desired,loanLeft);if(desired<=0)continue;
    const initialTax=tax(s,s.used),netAt=g=>g-(tax(s,s.used+g)-initialTax);let lo=0,hi=limit;
    if(netAt(limit)>desired)for(let k=0;k<60;k++){const mid=(lo+hi)/2;if(netAt(mid)<desired)lo=mid;else hi=mid}
    const gross=Math.min(limit,hi),charge=tax(s,s.used+gross)-initialTax,net=gross-charge;if(net<=0)continue;
    const transfer=s.owner===l.owner?null:s.owner==='company'?'repayment':'advance';
    parts.push({source:s.id,label:s.name,from:s.owner,to:l.owner,leg:index,gross,net,tax:charge,units:s.kind==='sale'?gross/s.price:0,kind:s.kind,transfer,before:s.balance});
    s.used+=gross;now+=charge;remaining-=net;if(transfer==='repayment')loanLeft-=net;
   }
   shortfall+=Math.max(0,remaining);const isa=l.owner==='personal'&&fund?Math.min(isaLeft,l.amount):0;isaLeft-=isa;
   const eisAmount=l.owner==='personal'&&eis?Math.min(eisLeft,l.amount):0;eisLeft-=eisAmount;
   return {...l,isa,eisAmount,eisRelief:eisAmount*.30,future:l.owner==='company'?l.amount*.2*.25:(l.amount-isa)*.2*.24};
  });
  return {...d,legs,parts,shortfall,now,future:legs.reduce((a,l)=>a+l.future,0),isa:legs.reduce((a,l)=>a+l.isa,0),eis:legs.reduce((a,l)=>a+l.eisRelief,0),sameYear,wealthCost:now};
 });
}
function preferredRoute(routes,p){const valid=routes.filter(r=>r.shortfall<.01);if(p.route&&p.route!=='auto')return routes.find(r=>r.route===p.route)||routes[0];if(p.type==='startup'&&p.eis==='yes'){const max=Math.max(0,...valid.map(r=>r.eis));const withRelief=valid.filter(r=>r.eis===max);return withRelief.sort((a,b)=>a.now-b.now||a.future-b.future)[0]||routes[0]}return valid.sort((a,b)=>a.now+a.future-b.now-b.future)[0]||[...routes].sort((a,b)=>a.shortfall-b.shortfall)[0]}
function executionSteps(s,p){const steps=[];const sales=new Map(),transfers=new Map();for(const part of s.parts){if(part.kind==='sale'){const k=part.source,v=sales.get(k)||{...part,gross:0,tax:0,units:0};v.gross+=part.gross;v.tax+=part.tax;v.units+=part.units;sales.set(k,v)}if(part.transfer){const k=part.transfer,v=transfers.get(k)||{...part,net:0};v.net+=part.net;transfers.set(k,v)}}
 for(const v of sales.values())steps.push({label:'Sell '+v.label,amount:v.gross,detail:v.units.toLocaleString('en-GB',{maximumFractionDigits:3})+' units · wait for confirmed fill and settled cash',kind:'sale'});
 const reserve=s.now;if(reserve)steps.push({label:'Keep the sale tax aside',amount:reserve,detail:'Reserve only. Tax is paid separately on its confirmed due date.',kind:'reserve'});
 for(const v of transfers.values())steps.push({label:v.transfer==='repayment'?'Repay shareholder loan to you':'Record and transfer your new shareholder loan',amount:v.net,detail:'Verify recipient, loan agreement and principal before transfer.',kind:'transfer'});
 for(const l of s.legs)steps.push({label:'Invest '+(l.owner==='personal'?'personally':'through your company'),amount:l.amount,detail:(l.isa?money(l.isa)+' via ISA. ':'')+(l.eisAmount?money(l.eisAmount)+' potential EIS subscription. ':'')+'Only after earlier funding steps confirm.',kind:'buy'});
 return steps.map((s,i)=>({...s,id:i,status:'Waiting'}));
}
function canExecutePlan(r){return r.stage==='Ready to execute'&&r.scenario?.shortfall<.01&&r.steps.length>0&&r.partnerVersion===r.version&&r.signedVersion===r.version&&!r.steps.some(s=>s.status==='Failed')}
function advancePlanStep(r,fail=false){if(r.stage!=='In progress'||r.partnerVersion!==r.version||r.signedVersion!==r.version)return false;const i=r.steps.findIndex(s=>s.status==='Running');if(i<0)return false;if(fail){r.steps[i].status='Failed';r.stage='Needs attention';return true}r.steps[i].status='Confirmed';const next=r.steps.find(s=>s.status==='Waiting');if(next)next.status='Running';else r.stage='Executed';return true}
function forecastRoute(s,p,c){
 const au=c.region==='au',years=p.disposal?Math.max(.05,(new Date(p.disposal)-new Date(p.date||'2026-10-17'))/31557600000):Number(p.years||5),growth=Number(p.annualGrowth??(p.type==='startup'?10:5))/100,yieldRate=Number(p.incomeYield??(p.type==='startup'?0:2.5))/100,companyRate=c.companyRate??.25,personalIncome=Number(p.incomeRate??(au?47:35.75))/100;
 const anniversary=new Date((p.date||'2026-10-17')+'T12:00:00Z');anniversary.setUTCFullYear(anniversary.getUTCFullYear()+1);const auDiscount=p.disposal?new Date(p.disposal+'T12:00:00Z')>anniversary:years>1;
 let loan=Math.max(0,Number(p.loanAtExit??c.loanPrincipal)+s.parts.reduce((a,x)=>a+(x.transfer==='advance'?x.net:x.transfer==='repayment'?-x.net:0),0)),incomeTax=0,disposalTax=0,extractionTax=0,netIncome=0,netExit=0,totalFutureValue=0,totalCostBasis=0,frankingPool=0;
 const extract=cash=>{const principal=Math.min(loan,cash);loan-=principal;const dividend=cash-principal;if(!dividend)return cash;if(au){const credit=Math.min(frankingPool,dividend*companyRate/(1-companyRate));frankingPool-=credit;const additional=Math.max(0,(dividend+credit)*personalIncome-credit);extractionTax+=additional;return cash-additional}const additional=dividend*personalIncome;extractionTax+=additional;return cash-additional};
 function chunk(amount,owner,isa,eis){let val=amount,basis=amount,paid=0,incTax=0,remaining=years;while(remaining>.000001){const fraction=Math.min(1,remaining),gross=val*yieldRate*fraction;let charge=0,credit=0;if(!isa){if(au&&p.receipt==='franked'){credit=gross*companyRate/(1-companyRate);charge=Math.max(0,(gross+credit)*(owner==='company'?companyRate:personalIncome)-credit);if(owner==='company')frankingPool+=credit}else charge=gross*(owner==='company'?(p.receipt==='exempt'&&!au?0:companyRate):personalIncome)}incomeTax+=charge;incTax+=charge;if(owner==='company')frankingPool+=charge;const net=gross-charge;val*=Math.pow(1+growth,fraction);if(p.policy==='income'){const cash=owner==='company'?extract(net):net;paid+=cash;netIncome+=cash}else{val+=net;basis+=net}remaining-=fraction}
 const gain=Math.max(0,val-basis),rate=owner==='company'?companyRate:isa?0:(!au&&eis&&p.assumeEIS&&years>=3?0:au?(auDiscount?.5:1)*personalIncome:.24),exitTax=gain*rate;disposalTax+=exitTax;if(owner==='company')frankingPool+=exitTax;const afterTax=val-exitTax;netExit+=owner==='company'&&p.exitTarget!=='company'?extract(afterTax):afterTax;totalFutureValue+=val;totalCostBasis+=basis;return{amount,owner,isa,eis,value:val,basis,gain,disposalTax:exitTax,paidIncome:paid}}
 const chunks=[];for(const l of s.legs){if(l.isa)chunks.push(chunk(l.isa,l.owner,true,false));const eisAmount=l.eisAmount||0;if(eisAmount)chunks.push(chunk(eisAmount,l.owner,false,true));const rest=l.amount-l.isa-eisAmount;if(rest>.001)chunks.push(chunk(rest,l.owner,false,false))}
 const price=Number(p.offerPrice)||0;return{years,growth: growth*100,yield:yieldRate*100,incomeTax,disposalTax,extractionTax,netIncome,netExit,totalFutureValue,totalCostBasis,totalTax:s.now+incomeTax+disposalTax+extractionTax,netValue:netExit+netIncome,chunks,loanRemaining:loan,initialShares:price?p.amount/price:null,futurePrice:price?price*Math.pow(1+growth,years):null,auDiscount,includesRelief:!!p.assumeEIS&&!au&&years>=3};
}
