document.querySelectorAll('.tour-frame[data-video]').forEach(button => {
 let activeFrame=null;
 button.closest('.tour').addEventListener('tour-reset',()=>{if(activeFrame){activeFrame.replaceWith(button);activeFrame=null;}});
 button.addEventListener('click', () => {
  const id=button.dataset.video;
  if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
  const frame=document.createElement('div');frame.className='tour-frame playing';
  const iframe=document.createElement('iframe');
  iframe.src=`https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`;
  iframe.title=button.querySelector('img').alt;
  iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.allowFullscreen=true;
  frame.append(iframe);button.replaceWith(frame);activeFrame=frame;iframe.focus();
 });
});
