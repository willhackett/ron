'use strict';
if(window.RON_REGION==='au'){
 for(const p of originalSeed.positions){p.name=p.name.replace('2LR Investments Ltd','2LR Investments Pty Ltd').replace('2LR Property Ltd','2LR Property Pty Ltd').replace('UK equity','Australian equity').replace('Short-dated gilts','Australian government bonds');p.tax=p.owner==='household'?'Australian personal tax · classification to verify':'Company income / gains · 30% passive-investment assumption';if(p.id==='isa'){p.name='Superannuation fund';p.wrapper='Superannuation';p.type='Super';p.tax='Superannuation · restricted access, not investment funding'}if(p.id==='gia')p.wrapper='Personal investment account';if(p.id==='gilts')p.code='Australian government bonds · illustrative';}
 for(const c of originalSeed.companies){c.name=c.name.replace(' Ltd',' Pty Ltd');if(c.short)c.short=c.short.replace(' Ltd',' Pty Ltd');}
}
