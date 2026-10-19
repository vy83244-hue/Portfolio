function toggleMenu(){const n=document.getElementById('navLinks');n.style.display=n.style.display==='flex'?'none':'flex'}
document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>{if(window.innerWidth<=850)document.getElementById('navLinks').style.display='none'}));
document.getElementById('year').textContent=new Date().getFullYear();
const params=new URLSearchParams(location.search);
if(params.get('sent')==='1'){const f=document.querySelector('.enquiry');if(f){f.insertAdjacentHTML('beforebegin','<div class="success">Thank you. Your enquiry has been received.</div>');}}
