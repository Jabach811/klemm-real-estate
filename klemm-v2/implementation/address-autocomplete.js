/* Optional address provider; no network requests or demo data in this component. */
(() => {
 document.querySelectorAll('input[data-address-autocomplete]').forEach((input, index) => {
  if(input.dataset.addressEnhanced) return;
  input.dataset.addressEnhanced='true';
  const wrap=document.createElement('span');wrap.className='address-autocomplete';input.before(wrap);wrap.append(input);
  const list=document.createElement('ul');list.className='address-suggestions';list.id=`address-suggestions-${index}`;list.setAttribute('role','listbox');list.setAttribute('aria-label','Address suggestions');list.hidden=true;
  const note=document.createElement('span');note.className='address-help';note.id=`address-help-${index}`;note.setAttribute('role','status');note.setAttribute('aria-live','polite');
  wrap.append(list,note);
  const attribution=document.createElement('span');attribution.className='address-attribution';attribution.setAttribute('translate','no');attribution.hidden=true;attribution.textContent='Google Maps';wrap.append(attribution);
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');input.setAttribute('aria-controls',list.id);
  input.setAttribute('aria-describedby',[input.getAttribute('aria-describedby'),note.id].filter(Boolean).join(' '));
  let timer,version=0,items=[],active=-1,composing=false,committing=false;
  const available=()=>typeof window.klemmAddressProvider?.suggest==='function';
  const manual='Address suggestions are unavailable. Enter your address manually.';
  note.textContent=available()?'Start typing an address, or enter it manually.':manual;
  function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
  function cancel(){clearTimeout(timer);version++;close();input.removeAttribute('aria-busy');}
  function current(token){return token===version&&document.activeElement===input;}
  function highlight(i){active=i;Array.from(list.children).forEach((el,n)=>el.setAttribute('aria-selected',String(n===i)));input.setAttribute('aria-activedescendant',list.children[i].id);list.children[i].scrollIntoView({block:'nearest'});}
  function setValue(field,value){field.value=String(value);field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}
  async function choose(item){
   cancel();const token=version,provider=window.klemmAddressProvider;
   try{
    const result=typeof provider?.resolve==='function'?await provider.resolve(item,input):item;
    if(!current(token)||!result)return;
    const mappings=['city','state','zip'].map(key=>({key,id:input.dataset['address'+key[0].toUpperCase()+key.slice(1)]})).filter(m=>m.id);
    // Explicit target IDs only; reject fields outside this form.
    const targets=mappings.map(m=>({...m,field:document.getElementById(m.id)})).filter(m=>m.field&&m.field!==input&&m.field.form===input.form);
    input.value=String(mappings.length?(result.street||result.label||input.value):(result.label||result.street||input.value));
    // Avoid scheduling a new query for our own committed value.
    committing=true;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));committing=false;
    targets.forEach(({key,field})=>{if(result[key]!=null)setValue(field,result[key]);});
    note.textContent='Address selected. Check the details and add any apartment or unit number.';
   }catch{if(current(token))note.textContent='Could not complete that address. You can enter the details manually.';}
  }
  async function search(query,token){
   if(!available()){if(current(token))note.textContent=manual;return;}
   input.setAttribute('aria-busy','true');note.textContent='Looking for addresses…';
   try{
    const results=await window.klemmAddressProvider.suggest(query,input);
    if(!current(token))return;
    items=Array.isArray(results)?results.filter(item=>item&&typeof item.label==='string').slice(0,8):[];
    list.replaceChildren();
    items.forEach((item,i)=>{const option=document.createElement('li');option.id=`${list.id}-${i}`;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.textContent=item.label;option.addEventListener('mousedown',e=>e.preventDefault());option.addEventListener('click',e=>{e.preventDefault();choose(item);});list.append(option);});
    if(items.length){attribution.hidden=window.klemmAddressProvider?.attribution!=='Google Maps';list.hidden=false;input.setAttribute('aria-expanded','true');note.textContent=`${items.length} address suggestions. Use arrow keys to review, or keep typing.`;}
    else{close();note.textContent='No matching addresses. You can keep entering your address manually.';}
   }catch{if(current(token)){close();note.textContent=manual;}}
   finally{if(token===version)input.removeAttribute('aria-busy');}
  }
  function queue(){if(committing)return;cancel();if(composing)return;const query=input.value.trim();if(!available()){note.textContent=manual;return;}if(query.length<3){note.textContent='Type at least 3 characters for suggestions, or enter the address manually.';return;}const token=version;timer=setTimeout(()=>search(query,token),250);}
  input.addEventListener('input',queue);
  input.addEventListener('compositionstart',()=>{composing=true;cancel();});input.addEventListener('compositionend',()=>{composing=false;queue();});
  input.addEventListener('keydown',e=>{
   if(composing)return;
   if(e.key==='Escape'){e.preventDefault();cancel();note.textContent='Suggestions closed. You can keep entering your address manually.';}
   else if(e.key==='Tab')cancel();
   else if(!list.hidden&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();highlight(e.key==='ArrowDown'?Math.min(active+1,items.length-1):Math.max(active<0?items.length-1:active-1,0));}
   else if(e.key==='Enter'&&!list.hidden&&active>=0){e.preventDefault();choose(items[active]);}
  });
  input.addEventListener('blur',()=>{cancel();note.textContent=available()?'You can edit the address manually.':manual;});
  document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))cancel();});
  input.form?.addEventListener('reset',()=>{cancel();note.textContent=available()?'Start typing an address, or enter it manually.':manual;});
 });
})();
