/* Isolated adapter checks. No browser, network, API key or live Google calls. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../../implementation/address-google.js'), 'utf8');
let passed = 0;
function harness({key, search = '', google} = {}) {
  const scripts = [], timers = new Map();
  let timerId = 0;
  const storage = new Proxy({}, {get(){throw new Error('Adapter must not use storage');},set(){throw new Error('Adapter must not persist suggestions');}});
  const context = {
    URLSearchParams, location:{search}, localStorage:storage, sessionStorage:storage,
    setTimeout(fn){timers.set(++timerId,fn);return timerId;}, clearTimeout(id){timers.delete(id);},
    document:{createElement(tag){assert.equal(tag,'script');return {};},head:{append(script){scripts.push(script);}}},
    window:{localStorage:storage,sessionStorage:storage}
  };
  if(key !== undefined) context.window.klemmAddressConfig = {apiKey:key};
  if(google) context.window.google = google;
  vm.runInNewContext(source, context, {filename:'address-google.js'});
  return {context,scripts,timers,provider:context.window.klemmAddressProvider};
}
function mockGoogle() {
  const requests = [], masks = [], imports = [];
  let id = 0, suggestionError, resolveError;
  const components = [
    ['street_number','672','672'],['route','West 11th Street','W 11th St'],
    ['locality','Tracy','Tracy'],['administrative_area_level_1','California','CA'],
    ['postal_code','95376','95376'],['postal_code_suffix','1234','1234']
  ].map(([type,longText,shortText])=>({types:[type],longText,shortText}));
  const place = {formattedAddress:'672 W 11th St, Tracy, CA 95376, USA',addressComponents:components,
    async fetchFields(mask){masks.push(mask);if(resolveError)throw resolveError;}};
  const prediction = {text:{toString:()=>place.formattedAddress},toPlace:()=>place};
  const api = {
    AutocompleteSessionToken:class {constructor(){this.id=++id;}},
    AutocompleteSuggestion:{async fetchAutocompleteSuggestions(request){requests.push(request);if(suggestionError)throw suggestionError;return {suggestions:[{placePrediction:prediction},{queryPrediction:{}}]};}}
  };
  return {google:{maps:{async importLibrary(name){imports.push(name);return api;}}},requests,masks,imports,place,
    failSuggest(error){suggestionError=error;},failResolve(error){resolveError=error;}};
}
async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
(async()=>{
  await check('absent or blank key leaves manual input mode and loads nothing',()=>{
    for(const key of [undefined,'','   ']){const h=harness({key});assert.equal(h.provider,undefined);assert.equal(h.scripts.length,0);assert.equal(h.timers.size,0);}
  });
  await check('demo query suppresses Google even with configured key',()=>{
    const h=harness({key:'mock-only',search:'?address-demo=1'});assert.equal(h.provider,undefined);assert.equal(h.scripts.length,0);
  });
  await check('configured provider stays lazy and creates one SDK request on demand',async()=>{
    const h=harness({key:'mock-only'});assert.equal(h.scripts.length,0);assert.equal(h.provider.attribution,'Google Maps');
    const a=h.provider.suggest('672',{}),b=h.provider.suggest('673',{});
    assert.equal(h.scripts.length,1);assert(h.scripts[0].src.startsWith('https://maps.googleapis.com/maps/api/js?'));
    const g=mockGoogle();h.context.window.google=g.google;h.context.window.klemmGooglePlacesReady();
    await Promise.all([a,b]);assert.equal(h.timers.size,0);
  });
  await check('sessions are input-specific, reused during typing and reset after selection',async()=>{
    const g=mockGoogle(),h=harness({key:'mock-only',google:g.google}),one={},two={};
    const first=await h.provider.suggest('672',one);await h.provider.suggest('672 W',one);await h.provider.suggest('671',two);
    assert.equal(g.requests[0].sessionToken,g.requests[1].sessionToken);assert.notEqual(g.requests[0].sessionToken,g.requests[2].sessionToken);
    assert.equal(g.requests[0].includedPrimaryTypes.join(','),'street_address,premise,subpremise');assert.equal(first.length,1);assert.equal(g.requests[0].includedRegionCodes.join(','),'us');
    await h.provider.resolve(first[0],one);await h.provider.suggest('674',one);assert.notEqual(g.requests[0].sessionToken,g.requests[3].sessionToken);
  });
  await check('resolution asks only address fields and returns clean US components',async()=>{
    const g=mockGoogle(),h=harness({key:'mock-only',google:g.google}),input={};
    const [item]=await h.provider.suggest('672',input);const result=await h.provider.resolve(item,input);
    assert.equal(JSON.stringify(g.masks),JSON.stringify([{fields:['formattedAddress','addressComponents']}]));
    assert.equal(JSON.stringify(result),JSON.stringify({label:'672 W 11th St, Tracy, CA 95376, USA',street:'672 West 11th Street',city:'Tracy',state:'CA',zip:'95376-1234'}));
    assert.equal(result.prediction,undefined);assert.equal(result.session,undefined);
    assert.deepEqual(Object.keys(h.context.window).sort(),['google','klemmAddressConfig','klemmAddressProvider','localStorage','sessionStorage'].sort());
  });
  await check('city fallback and missing address components are safe',async()=>{
    const g=mockGoogle(),h=harness({key:'mock-only',google:g.google}),input={};
    const street=[{types:['street_number'],longText:'123'},{types:['route'],longText:'Example Lane'}];
    g.place.addressComponents=[...street,{types:['postal_town'],longText:'Tracy'}];
    let [item]=await h.provider.suggest('test',input);let result=await h.provider.resolve(item,input);assert.equal(result.city,'Tracy');assert.equal(result.zip,'');
    g.place.addressComponents=[...street,{types:['sublocality_level_1'],longText:'Neighborhood'}];
    [item]=await h.provider.suggest('test',input);result=await h.provider.resolve(item,input);assert.equal(result.city,'Neighborhood');
    g.place.addressComponents=undefined;[item]=await h.provider.suggest('test',input);await assert.rejects(h.provider.resolve(item,input),/complete street address manually/);
    for(const missing of ['street_number','route']){g.place.addressComponents=street.filter(c=>!c.types.includes(missing));[item]=await h.provider.suggest('test',input);await assert.rejects(h.provider.resolve(item,input),/complete street address manually/);}
  });
  await check('suggestion and place failures reject and failed resolution resets session',async()=>{
    const g=mockGoogle(),h=harness({key:'mock-only',google:g.google}),input={};
    g.failSuggest(new Error('suggestion failure'));await assert.rejects(h.provider.suggest('test',input),/suggestion failure/);g.failSuggest(null);
    const [item]=await h.provider.suggest('test',input);const old=item.session;g.failResolve(new Error('place failure'));await assert.rejects(h.provider.resolve(item,input),/place failure/);
    await h.provider.suggest('retry',input);assert.notEqual(g.requests.at(-1).sessionToken,old);
  });
  await check('SDK load failure and timeout reject without further network calls',async()=>{
    for(const timeout of [false,true]){const h=harness({key:'mock-only'}),promise=h.provider.suggest('test',{});if(timeout)[...h.timers.values()][0]();else h.scripts[0].onerror();await assert.rejects(promise,/Address service unavailable/);assert.equal(h.scripts.length,1);assert.equal(h.timers.size,0);}
  });
  console.log(`${passed} mocked adapter checks passed. No live API calls or saved suggestions.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
