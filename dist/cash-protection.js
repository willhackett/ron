'use strict';
function depositCoverage(accounts,limit){
 const groups=new Map();
 for(const a of accounts){if(!Number.isFinite(a.balance)||a.balance<0)throw new Error('Balance must be a positive number');const key=JSON.stringify([a.holder,a.licence]);const g=groups.get(key)||{holder:a.holder,licence:a.licence,total:0};g.total+=a.balance;groups.set(key,g)}
 return [...groups.values()].map(g=>({...g,within:Math.min(limit,g.total),outside:Math.max(0,g.total-limit),headroom:Math.max(0,limit-g.total)}));
}
if(typeof module!=='undefined')module.exports={depositCoverage};
