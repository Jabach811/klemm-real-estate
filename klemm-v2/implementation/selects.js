/* Progressive enhancement: native controls remain authoritative for form values. */
(() => {
 document.querySelectorAll('.contact-form select, select[data-custom-select]').forEach((select, serial) => {
  if(select.multiple || select.size > 1) return;
  const field=select.closest('label');
  const labelText=select.getAttribute('aria-label') || (field ? Array.from(field.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim() : select.name);
  const wrap=document.createElement('span');wrap.className='quiet-select';select.before(wrap);wrap.append(select);
  const button=document.createElement('button');button.type='button';button.className='select-btn';button.id=`select-trigger-${serial}`;button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',labelText);button.setAttribute('aria-controls',`select-list-${serial}`);button.disabled=select.disabled;
  const value=document.createElement('span'),chevron=document.createElement('span');chevron.className='chev';chevron.setAttribute('aria-hidden','true');button.append(value,chevron);
  const list=document.createElement('ul');list.id=`select-list-${serial}`;list.className='select-list';list.setAttribute('role','listbox');list.setAttribute('aria-label',labelText);list.hidden=true;
  const options=Array.from(select.options);let active=select.selectedIndex,typing='',timer;
  const items=options.map((option,index)=>{const item=document.createElement('li');item.id=`select-option-${serial}-${index}`;item.setAttribute('role','option');item.setAttribute('aria-disabled',String(option.disabled));item.textContent=option.text;item.addEventListener('mousedown',e=>e.preventDefault());item.addEventListener('click',e=>{e.preventDefault();if(!option.disabled){choose(index);button.focus();}});list.append(item);return item;});
  function render(){value.textContent=select.selectedOptions[0]?.text || select.dataset.placeholder || 'Choose one';value.className=select.value?'':'placeholder';items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===select.selectedIndex)));}
  function highlight(index){active=index;items.forEach((item,i)=>item.classList.toggle('active',i===active));button.setAttribute('aria-activedescendant',items[active].id);items[active].scrollIntoView({block:'nearest'});}
  function close(){list.hidden=true;button.setAttribute('aria-expanded','false');button.removeAttribute('aria-activedescendant');}
  function open(){if(button.disabled)return;list.hidden=false;button.setAttribute('aria-expanded','true');highlight(Math.max(0,select.selectedIndex));}
  function choose(index){select.selectedIndex=index;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));close();}
  function move(direction){let index=active;do{index+=direction;}while(index>=0&&index<options.length&&options[index].disabled);if(index>=0&&index<options.length)highlight(index);}
  button.addEventListener('click',e=>{e.preventDefault();list.hidden?open():close();});
  button.addEventListener('keydown',e=>{
   if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(e.key)){e.preventDefault();if(list.hidden){open();if(e.key==='Home')highlight(0);if(e.key==='End')highlight(options.length-1);return;}if(e.key==='ArrowDown')move(1);else if(e.key==='ArrowUp')move(-1);else if(e.key==='Home')highlight(0);else if(e.key==='End')highlight(options.length-1);else if(!options[active].disabled)choose(active);}
   else if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='Tab')close();
   else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();if(list.hidden)open();clearTimeout(timer);typing+=e.key.toLocaleLowerCase();const index=options.findIndex(o=>!o.disabled&&o.text.toLocaleLowerCase().startsWith(typing));if(index>=0)highlight(index);timer=setTimeout(()=>typing='',600);}
  });
  document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))close();});wrap.addEventListener('focusout',()=>{requestAnimationFrame(()=>{if(!wrap.contains(document.activeElement))close();});});
  select.addEventListener('change',render);select.addEventListener('invalid',e=>{e.preventDefault();button.focus();button.setAttribute('aria-invalid','true');});select.addEventListener('change',()=>button.removeAttribute('aria-invalid'));select.addEventListener('focus',()=>button.focus());
  select.form?.addEventListener('reset',()=>setTimeout(()=>{close();render();},0));
  // Transfer the visible label to the trigger, while retaining the select ID/name.
  if(field)field.htmlFor=button.id;
  select.tabIndex=-1;select.setAttribute('aria-hidden','true');wrap.append(button,list);wrap.classList.add('enhanced');render();
 });
})();
