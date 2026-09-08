// Shared, optional enhancements. Reading and contacting Jack work without JavaScript.
(() => {
 const header=document.querySelector('.site-header');
 const toggle=header?.querySelector('.nav-toggle');
 const nav=header?.querySelector('nav');
 if (toggle && nav) {
  toggle.hidden=false;
  document.body.classList.add('nav-ready');
  const close=()=>{header.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false');toggle.innerHTML='Menu <span aria-hidden="true">＋</span>';};
  toggle.addEventListener('click',()=>{const open=header.classList.toggle('nav-open');toggle.setAttribute('aria-expanded',String(open));toggle.innerHTML=open?'Close <span aria-hidden="true">−</span>':'Menu <span aria-hidden="true">＋</span>';});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.classList.contains('nav-open')){close();toggle.focus();}});
  document.addEventListener('click',e=>{if(!header.contains(e.target))close();});
  header.addEventListener('focusout',()=>{requestAnimationFrame(()=>{if(!header.contains(document.activeElement))close();});});
  const desktop=matchMedia('(min-width:1101px)');desktop.addEventListener('change',close);
 }
 document.querySelectorAll('.area-select').forEach(button=>{
  button.setAttribute('aria-pressed',String(button.parentElement.classList.contains('on')));
  button.addEventListener('click',()=>{button.closest('.area-list').querySelectorAll('.area-select').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
 });
 document.querySelectorAll('.hero-media video').forEach(video=>{
  const button=document.createElement('button');button.type='button';button.className='motion-toggle';
  const sync=()=>{button.textContent=video.paused?'Play background':'Pause background';button.setAttribute('aria-label',button.textContent+' video');};
  video.addEventListener('play',sync);video.addEventListener('pause',sync);
  button.addEventListener('click',()=>{if(video.paused)video.play().catch(sync);else video.pause();});
  video.closest('.hero').append(button);sync();
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const respectMotion=()=>{if(reduce.matches)video.pause();};reduce.addEventListener('change',respectMotion);respectMotion();
 });
 document.querySelectorAll('.tours-all').forEach(section=>{
  const grid=section.querySelector('.tour-grid');if(!grid)return;
  const cards=[...grid.querySelectorAll('.tour')];if(cards.length<13)return;
  const control=document.createElement('div');control.className='tour-search';
  const label=document.createElement('label');label.textContent='Find a tour by street or community';
  const input=document.createElement('input');input.type='search';input.placeholder='Search the tour archive';label.append(input);
  const status=document.createElement('p');status.className='tour-count';status.setAttribute('role','status');
  control.append(label,status);grid.before(control);
  const more=document.createElement('button');more.className='btn ghost tour-more';more.type='button';more.textContent='Show more tours';grid.after(more);
  let limit=12;
  const render=()=>{const term=input.value.trim().toLocaleLowerCase();const matched=cards.filter(c=>c.querySelector('.tour-copy').textContent.toLocaleLowerCase().includes(term));const shown=new Set(matched.slice(0,limit));cards.forEach(c=>{if(!shown.has(c))c.dispatchEvent(new Event('tour-reset'));c.hidden=!shown.has(c);});status.textContent=matched.length?`Showing ${shown.size} of ${matched.length} tours`:'No matching tours. Try another street or community.';more.hidden=matched.length<=limit;};
  input.addEventListener('input',()=>{limit=12;render();});
  more.addEventListener('click',()=>{const visible=cards.filter(c=>!c.hidden).length;limit+=12;render();const next=cards.filter(c=>!c.hidden)[visible];next?.querySelector('.tour-frame')?.focus();});
  render();
 });
 const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('form.contact-form[action^="https://formspree.io/"]').forEach(form=>{
  const button=form.querySelector('button[type=submit]');if(!button)return;
  const swap=document.createElement('div');swap.className='form-swap';
  form.before(swap);swap.append(form);
  const done=document.createElement('div');done.className='form-done';done.tabIndex=-1;done.setAttribute('role','status');done.hidden=true;
  done.innerHTML='<p>'+(form.dataset.done||'Got it. Jack will call you back himself, usually the same day.')+'</p><p class="form-done-alt">In a hurry? <a href="tel:+12093211094">209.321.1094</a>.</p>';
  swap.append(done);
  const reveal=()=>{
   if(reduceMotion.matches){form.hidden=true;done.hidden=false;done.classList.add('is-in');done.focus({preventScroll:true});return;}
   const start=swap.offsetHeight;
   swap.style.height=start+'px';swap.classList.add('is-swapping');
   form.classList.add('is-leaving');
   done.hidden=false;
   const end=done.offsetHeight;
   requestAnimationFrame(()=>{swap.style.height=end+'px';done.classList.add('is-in');});
   const settle=()=>{swap.removeEventListener('transitionend',onEnd);swap.classList.remove('is-swapping');swap.style.height='';form.hidden=true;form.classList.remove('is-leaving');
    const box=done.getBoundingClientRect();
    if(box.top<0||box.bottom>innerHeight)done.scrollIntoView({behavior:'smooth',block:'center'});
    done.focus({preventScroll:true});};
   const onEnd=e=>{if(e.target===swap&&e.propertyName==='height')settle();};
   swap.addEventListener('transitionend',onEnd);
   setTimeout(()=>{if(swap.classList.contains('is-swapping'))settle();},900);
  };
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   const label=button.textContent;
   button.style.minWidth=button.offsetWidth+'px';
   button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='Sending';button.classList.add('is-sending');
   const started=Date.now();
   try{
    const response=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error(response.status);
    await new Promise(r=>setTimeout(r,Math.max(0,450-(Date.now()-started))));
    button.classList.remove('is-sending');button.textContent='Sent';button.classList.add('is-sent');
    await new Promise(r=>setTimeout(r,reduceMotion.matches?0:420));
    reveal();
   }catch{
    button.disabled=false;button.removeAttribute('aria-busy');button.classList.remove('is-sending');button.textContent=label;button.style.minWidth='';
    let error=form.querySelector('.form-error');
    if(!error){error=document.createElement('p');error.className='form-error';error.setAttribute('role','alert');form.querySelector('.form-actions').append(error);}
    error.textContent='That didn’t send. Call Jack at 209.321.1094 and he’ll take it down directly.';
   }
  });
 });
})();
