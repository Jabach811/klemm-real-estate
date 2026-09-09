/* Google Places Autocomplete (New). No SDK loads until the first suggestion. */
(() => {
 if(new URLSearchParams(location.search).get('address-demo')==='1')return;
 const key=window.klemmAddressConfig?.apiKey?.trim();if(!key)return;
 let loading;const sessions=new WeakMap(),fallback={};
 function library(){
  if(window.google?.maps?.importLibrary)return window.google.maps.importLibrary('places');
  if(!loading)loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');let settled=false;
   const timeout=setTimeout(()=>finish(new Error('Address service unavailable')),15000);
   function finish(error){if(settled)return;settled=true;clearTimeout(timeout);if(error)reject(error);else window.google.maps.importLibrary('places').then(resolve,reject);}
   window.klemmGooglePlacesReady=()=>finish();script.onerror=()=>finish(new Error('Address service unavailable'));
   const params=new URLSearchParams({key,v:'weekly',loading:'async',libraries:'places',callback:'klemmGooglePlacesReady'});
   script.src='https://maps.googleapis.com/maps/api/js?'+params;script.async=true;document.head.append(script);
  });return loading;
 }
 window.klemmAddressProvider={
  attribution:'Google Maps',
  async suggest(query,input){
   const {AutocompleteSuggestion,AutocompleteSessionToken}=await library();const owner=input||fallback;
   let token=sessions.get(owner);if(!token){token=new AutocompleteSessionToken();sessions.set(owner,token);}
   const {suggestions}=await AutocompleteSuggestion.fetchAutocompleteSuggestions({input:query,sessionToken:token,includedRegionCodes:['us'],includedPrimaryTypes:['street_address','premise','subpremise'],locationBias:{center:{lat:37.7397,lng:-121.4252},radius:50000}});
   return suggestions.filter(s=>s.placePrediction).map(s=>({label:s.placePrediction.text.toString(),prediction:s.placePrediction,session:token}));
  },
  async resolve(item,input){
   const owner=input||fallback;
   try{
    const place=item.prediction.toPlace();await place.fetchFields({fields:['formattedAddress','addressComponents']});
    const parts=place.addressComponents||[];const part=(type,short=false)=>{const value=parts.find(p=>p.types.includes(type));return value?.[short?'shortText':'longText']||'';};
    if(!part('street_number')||!part('route'))throw new Error('Please enter the complete street address manually.');
    const street=[part('street_number'),part('route')].filter(Boolean).join(' ');const zip=part('postal_code');const suffix=part('postal_code_suffix');
    return {label:place.formattedAddress||item.label,street:street||item.label,city:part('locality')||part('postal_town')||part('sublocality_level_1'),state:part('administrative_area_level_1',true),zip:zip+(suffix?'-'+suffix:'')};
   }finally{if(sessions.get(owner)===item.session)sessions.delete(owner);}
  }
 };
})();
