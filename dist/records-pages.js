'use strict';
// Retained advanced records use the same page navigation as the main app.
const recordPages=new Map();let recordPageId=0;const renderRecordList=render;
modal=function(html){const route='detail/'+(++recordPageId),node=document.createElement('div');document.querySelector('#modalbody')?.removeAttribute('id');node.id='modalbody';node.className='record-detail-page';node.innerHTML='<button class="textbutton" data-close>← Back to records</button>'+html;recordPages.set(route,node);history.pushState(null,'','#'+route);render();window.scrollTo(0,0)};
closeModal=function(){history.replaceState(null,'','#'+view);render();window.scrollTo(0,0)};
render=function(){const node=recordPages.get(location.hash.slice(1));if(node){$('.pagebar').hidden=true;$('#content').replaceChildren(node);bindModal()}else{$('.pagebar').hidden=false;renderRecordList()}};
window.addEventListener('hashchange',()=>{const hash=location.hash.slice(1);if(views.some(x=>x[0]===hash))view=hash;render()});
