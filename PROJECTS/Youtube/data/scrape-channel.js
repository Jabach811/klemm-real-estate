// Run on https://www.youtube.com/@jackklemm3607/videos in Joel's Chrome.
// Walks YouTube's own "load more" requests until every video is collected.
// Leaves the result in window.__klemmTSV as lines of: id <tab> title <tab> views <tab> age
const cfg = window.ytcfg?.data_ || {};
const key = cfg.INNERTUBE_API_KEY, ctx = cfg.INNERTUBE_CONTEXT;
const findTokens = (o, out=[]) => { if (!o || typeof o !== 'object') return out; if (o.continuationCommand?.token) out.push(o.continuationCommand.token); for (const k in o) findTokens(o[k], out); return out; };
const findVideos = (o, out=[]) => { if (!o || typeof o !== 'object') return out; if (o.richItemRenderer?.content?.lockupViewModel) out.push(o.richItemRenderer.content.lockupViewModel); for (const k in o) findVideos(o[k], out); return out; };
const parse = v => { const m = v.metadata?.lockupMetadataViewModel; const rows = m?.metadata?.contentMetadataViewModel?.metadataRows||[]; const parts = rows.flatMap(r=>(r.metadataParts||[]).map(p=>p.text?.content)); return [v.contentId, (m?.title?.content||'').replace(/\t|\n/g,' '), parts[0]||'', parts[1]||''].join('\t'); };
let vids = findVideos(window.ytInitialData).map(parse);
let token = findTokens(window.ytInitialData)[0]; let pages = 0;
while (token && pages < 80) {
  const r = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${key}&prettyPrint=false`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ context: ctx, continuation: token }) });
  const j = await r.json();
  vids.push(...findVideos(j).map(parse));
  token = findTokens(j)[0]; pages++;
}
window.__klemmTSV = vids;
vids.length

// To read it out, run this next, then use the page-text tool (first half, then slice(760) for the rest):
// const pre = document.createElement('pre'); pre.textContent = window.__klemmTSV.slice(0, 760).join('\n');
// while (document.body.firstChild) document.body.removeChild(document.body.firstChild); document.body.appendChild(pre);
