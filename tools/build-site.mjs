import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist','client');
const origin=(process.env.SITE_ORIGIN || 'https://klemm-real-estate-tracy.jabach0811.chatgpt.site').replace(/\/$/,'');
if(new URL(origin).protocol!=='https:')throw new Error('SITE_ORIGIN must use HTTPS');
const keyPlaceholder='REPLACE_WITH_YOUR_YOUTUBE_API_KEY';
const youtubeKey=process.env.YOUTUBE_API_KEY;
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const pages=['home','site','cities'].flatMap(p=>walk(path.join(root,p))).filter(p=>p.endsWith('.html'));
const aliases=new Map([['home/index.html','index.html'],['cities/manteca/index.html','mantecare.html'],['cities/mountain-house/index.html','mountainhousere.html'],['cities/lathrop/index.html','lathropre.html'],['cities/river-islands/index.html','riverislandsre.html'],['cities/woodbridge/index.html','woodbridgere.html']]);
const route=source=>aliases.get(source)||(source.startsWith('site/')?source.slice(5):source);
const localOrigin='https://source.invalid';
const assets=new Set();
const write=(name,data)=>{const dest=path.join(out,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);};
const localFile=name=>{
 const full=path.resolve(root,name);
 if(!full.startsWith(root+path.sep))throw new Error('Asset outside project: '+name);
 if(!fs.existsSync(full)||!fs.statSync(full).isFile())throw new Error('Missing local file: '+name);
 return full;
};
function rewrite(value,base) {
 const url=new URL(value.replaceAll('&amp;','&'),base);
 if(url.origin!==localOrigin)return value;
 const source=decodeURIComponent(url.pathname).slice(1);
 localFile(source);
 if(!source.endsWith('.html'))assets.add(source);
 return '/'+route(source).split('/').map(encodeURIComponent).join('/')+url.search+url.hash;
}
const routes=[];
for(const file of pages){
 const source=path.relative(root,file).replaceAll('\\','/');
 let html=fs.readFileSync(file,'utf8');
 const baseTag=html.match(/<base\s+href="([^"]+)"[^>]*>/i);
 const base=new URL(baseTag?.[1]||'',localOrigin+'/'+source).href;
 html=html.replace(/<base\s[^>]*>\s*/i,'');
 html=html.replace(/\b(href|src|poster)="([^"]+)"/g,(_,key,value)=>key+'="'+rewrite(value,base)+'"');
 html=html.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g,(match,a,b,c)=>{
  const value=(a??b??c).trim();if(value.startsWith('data:')||value.startsWith('#'))return match;
  return 'url("'+rewrite(value,base)+'")';
 });
 const primary=route(source);routes.push(primary);
 html=html.replace(/<link\s+rel="canonical"[^>]*>/gi,'');
 html=html.replace('</head>','<link rel="canonical" href="'+origin+'/'+primary+'">\n</head>');
 html=html.replace(/(<meta property="og:url" content=")[^"]*(")/g,'$1'+origin+'/'+primary+'$2');
 html=html.replace(/(<meta property="og:image" content=")https:\/\/(?:www\.)?klemmre\.com([^"]+)(")/g,(_,a,url,z)=>{
  const source=decodeURIComponent(new URL(url,origin).pathname).slice(1);localFile(source);assets.add(source);return a+origin+url+z;
 });
 write(primary,html);
 if(primary!==source)write(source,html);
}
for(const asset of assets){
 const file=localFile(asset);
 if(asset.endsWith('.css')){
  let css=fs.readFileSync(file,'utf8');
  css=css.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g,(match,a,b,c)=>{
   const value=(a??b??c).trim();if(value.startsWith('data:')||value.startsWith('#'))return match;
   return 'url("'+rewrite(value,localOrigin+'/'+asset)+'")';
  });write(route(asset),css);
 }else if(asset.endsWith('.js')&&fs.readFileSync(file,'utf8').includes(keyPlaceholder)){
  if(!youtubeKey)throw new Error(asset+' still holds the placeholder key. Set YOUTUBE_API_KEY before building.');
  write(route(asset),fs.readFileSync(file,'utf8').replaceAll(keyPlaceholder,youtubeKey));
 }else write(route(asset),fs.readFileSync(file));
}
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.map(r=>'<url><loc>'+origin+'/'+r+'</loc></url>').join('')+'</urlset>');
write('robots.txt','User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n');
fs.mkdirSync(path.join(root,'dist','server'),{recursive:true});
fs.copyFileSync(path.join(root,'site-worker.js'),path.join(root,'dist','server','index.js'));
const built=walk(out);const bytes=built.reduce((sum,f)=>sum+fs.statSync(f).size,0);
console.log(`Built ${pages.length} customer pages, ${assets.size} referenced assets; ${(bytes/1048576).toFixed(1)} MB. Origin: ${origin}`);
