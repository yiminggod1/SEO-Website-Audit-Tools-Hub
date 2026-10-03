const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const parse=h=>new DOMParser().parseFromString(h||"","text/html");
const setHTML=(id,html)=>{const el=$(id);if(el)el.innerHTML=html};
const setText=(id,value)=>{const el=$(id);if(el)el.textContent=value};

function audit(h){
  const d=parse(h),title=d.querySelector("title")?.textContent.trim()||"",
  desc=d.querySelector('meta[name="description"]')?.content.trim()||"",
  canonical=d.querySelector('link[rel="canonical"]')?.href||"",
  robots=d.querySelector('meta[name="robots"]')?.content||"",
  h1=d.querySelectorAll("h1").length,
  imgs=[...d.images],missingAlt=imgs.filter(x=>!x.alt.trim()).length,
  links=[...d.querySelectorAll("a[href]")],
  empty=links.filter(x=>{const v=(x.getAttribute("href")||"").trim();return !v||v==="#" }).length,
  jsonld=d.querySelectorAll('script[type="application/ld+json"]').length,
  viewport=!!d.querySelector('meta[name="viewport"]'),
  checks=[
    ["Title",title?title.length+" chars":"Missing",!!title&&title.length>=10&&title.length<=60],
    ["Description",desc?desc.length+" chars":"Missing",!!desc&&desc.length>=50&&desc.length<=160],
    ["Canonical",canonical?"Present":"Missing",!!canonical],
    ["Robots",robots||"Not set",!robots||!robots.toLowerCase().includes("noindex")],
    ["H1",h1+" found",h1===1],
    ["Images",missingAlt?missingAlt+" missing alt":"Alt text present",missingAlt===0],
    ["Links",empty?empty+" empty links":"No empty links",empty===0],
    ["JSON-LD",jsonld+" block(s)",jsonld>0],
    ["Viewport",viewport?"Present":"Missing",viewport],
    ["HTML lang",d.documentElement.lang||"Missing",!!d.documentElement.lang]
  ];
  return{d,checks,imgs,links};
}
const row=x=>'<div class="audit-row"><span>'+esc(x[0])+'</span><b class="'+(x[2]?"good":"bad")+'">'+esc(x[1])+"</b></div>";
const showAudit=h=>{
  if(!h){setHTML("auditResult","<b>Paste HTML first.</b>");$("auditResult")?.classList.remove("hidden");return}
  const r=audit(h),passed=r.checks.filter(x=>x[2]).length,p=Math.round(passed/r.checks.length*100);
  $("auditResult")?.classList.remove("hidden");
  setHTML("auditResult",'<div class="score-head"><div><span class="eyebrow">PAGE HEALTH</span><strong>'+p+"%</strong></div><span>"+passed+" / "+r.checks.length+" passed</span></div>"+r.checks.map(row).join(""));
};

if($("auditBtn"))$("auditBtn").onclick=()=>{const u=$("auditUrl")?.value.trim();sessionStorage.setItem("pendingAuditUrl",u||"");location.href="tools.html#remote-audit"};
if($("analyzeHtml"))$("analyzeHtml").onclick=()=>showAudit($("htmlInput")?.value.trim());
if($("metaBtn"))$("metaBtn").onclick=()=>{
  const d=parse($("metaInput")?.value||""),rows=[
    ["Title",d.querySelector("title")?.textContent.trim()||"Missing",!!d.querySelector("title")],
    ["Description",d.querySelector('meta[name="description"]')?.content.trim()||"Missing",!!d.querySelector('meta[name="description"]')],
    ["Canonical",d.querySelector('link[rel="canonical"]')?.getAttribute("href")||"Missing",!!d.querySelector('link[rel="canonical"]')],
    ["Robots",d.querySelector('meta[name="robots"]')?.content||"Not set",!((d.querySelector('meta[name="robots"]')?.content||"").toLowerCase().includes("noindex"))]
  ];
  setHTML("metaResult",rows.map(row).join(""));
};
if($("headingBtn"))$("headingBtn").onclick=()=>{const h=[...parse($("headingInput")?.value).querySelectorAll("h1,h2,h3,h4,h5,h6")];setHTML("headingOut",h.length?h.map(x=>"<div><b>"+x.tagName+"</b> "+esc(x.textContent.trim())+"</div>").join(""):"No headings found.")};
if($("imageBtn"))$("imageBtn").onclick=()=>{const a=[...parse($("imageInput")?.value).images],missing=a.filter(x=>!x.alt.trim()).length,dims=a.filter(x=>!x.getAttribute("width")&&!x.getAttribute("height")).length;setHTML("imageOut","<b>"+a.length+"</b> images · <b>"+missing+"</b> missing alt · <b>"+dims+"</b> without dimensions.")};
if($("linkBtn"))$("linkBtn").onclick=()=>{const a=[...parse($("linkInput")?.value).querySelectorAll("a[href]")],i=a.filter(x=>{const v=x.getAttribute("href")||"";return v.startsWith("/")||v.startsWith("./")||v.startsWith("../")||(!v.startsWith("http://")&&!v.startsWith("https://")&&!v.startsWith("mailto:")&&!v.startsWith("tel:"))}).length,n=a.filter(x=>(x.getAttribute("rel")||"").toLowerCase().split(/\s+/).includes("nofollow")).length;setHTML("linkOut","<b>"+a.length+"</b> links · "+i+" internal-ish · "+(a.length-i)+" external/other · "+n+" nofollow.")};
if($("canonicalBtn"))$("canonicalBtn").onclick=()=>{const c=parse($("canonicalInput")?.value).querySelector('link[rel="canonical"]');setHTML("canonicalOut",c?"Canonical: <code>"+esc(c.getAttribute("href"))+"</code>":"No canonical link found.")};
if($("keywordBtn"))$("keywordBtn").onclick=()=>{const w=($("keywordInput")?.value.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g)||[]),m={};w.forEach(x=>{if(x.length>3)m[x]=(m[x]||0)+1});setHTML("keywordOut",Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,10).map(x=>"<div class='kw'><span>"+esc(x[0])+"</span><b>"+x[1]+" · "+(x[1]/Math.max(1,w.length)*100).toFixed(1)+"%</b></div>").join("")||"Add more text.")};
if($("readBtn"))$("readBtn").onclick=()=>{const t=$("readInput")?.value||"",s=(t.match(/[.!?]+/g)||[]).length||1,w=(t.match(/\b[\w'-]+\b/g)||[]).length,y=(t.toLowerCase().match(/[aeiouy]+/g)||[]).length,g=w?Math.max(0,Math.min(18,.39*(w/s)+11.8*(y/w)-15.59)).toFixed(1):0;setHTML("readOut","<b>"+w+"</b> words · <b>"+s+"</b> sentences · estimated grade <b>"+g+"</b>.")};

if($("redirectBtn"))$("redirectBtn").onclick=()=>{
  const lines=($("redirectInput")?.value||"").split(/\n+/).map(x=>x.trim()).filter(Boolean),issues=[],valid=[];
  lines.forEach((line,n)=>{const parts=line.split(/\s*(?:=>|->|→|\t)\s*/);if(parts.length<2){issues.push("Line "+(n+1)+": add a source and target.");return}try{const s=new URL(parts[0]),t=new URL(parts[1],s);if(s.href===t.href)issues.push("Line "+(n+1)+": source and target are identical.");else valid.push([s.href,t.href])}catch{issues.push("Line "+(n+1)+": invalid URL pair.")}});
  setHTML("redirectOut","<b>"+valid.length+"</b> mapping(s) parsed · <b>"+issues.length+"</b> issue(s)."+(issues.length?"<br>"+issues.map(esc).join("<br>"):"<br>Mapping syntax looks consistent. This checks the map itself, not live HTTP redirect status codes."));
};
if($("brokenBtn"))$("brokenBtn").onclick=()=>{
  const a=[...parse($("brokenInput")?.value).querySelectorAll("a[href]")],bad=a.filter(x=>{const v=(x.getAttribute("href")||"").trim().toLowerCase();return !v||v==="#"||v.startsWith("javascript:")||v.startsWith("data:")});
  setHTML("brokenOut","<b>"+a.length+"</b> links found · <b>"+bad.length+"</b> need review."+(bad.length?"<br>"+bad.slice(0,12).map(x=>"<code>"+esc(x.getAttribute("href")||"(empty)")+"</code>").join(" · "):"<br>No obvious empty/script-only links found. A static browser check cannot verify remote HTTP status codes."));
};
if($("indexBtn"))$("indexBtn").onclick=()=>{
  const raw=$("indexInput")?.value||"",d=parse(raw),meta=(d.querySelector('meta[name="robots"]')?.content||"").toLowerCase(),headers=raw.toLowerCase(),noindex=meta.includes("noindex")||/x-robots-tag\s*:\s*[^\n]*noindex/.test(headers),nofollow=meta.includes("nofollow")||/x-robots-tag\s*:\s*[^\n]*nofollow/.test(headers),canon=d.querySelector('link[rel="canonical"]')?.getAttribute("href")||"";
  const status=noindex?"NOT INDEXABLE SIGNAL FOUND": "NO noindex SIGNAL FOUND";
  setHTML("indexOut","<b>"+status+"</b><br>Canonical: "+esc(canon||"not found")+"<br>Nofollow signal: "+(nofollow?"yes":"no")+"<br><small>This is a markup/header review, not a guarantee that a search engine will index the URL.</small>");
};
if($("mobileBtn"))$("mobileBtn").onclick=()=>{
  const d=parse($("mobileInput")?.value||""),v=d.querySelector('meta[name="viewport"]')?.content||"",fixed=[...d.querySelectorAll("style")].some(s=>/width\s*:\s*\d{3,4}px/i.test(s.textContent)),checks=[["Viewport",!!v&&/width\s*=\s*device-width/i.test(v)],["Initial scale",!!v&&/initial-scale\s*=\s*1/i.test(v)],["No obvious fixed CSS width",!fixed]];
  setHTML("mobileOut",checks.map(row).join(""));
};
if($("securityBtn"))$("securityBtn").onclick=()=>{
  const h=($("securityInput")?.value||"").toLowerCase(),names=[["Content-Security-Policy","content-security-policy"],["Strict-Transport-Security","strict-transport-security"],["X-Content-Type-Options","x-content-type-options"],["Referrer-Policy","referrer-policy"],["Permissions-Policy","permissions-policy"],["X-Frame-Options","x-frame-options"]];
  const checks=names.map(x=>[x[0],h.includes(x[1])?"Present":"Not found",h.includes(x[1])]);
  setHTML("securityOut",checks.map(row).join("")+"<small>Paste actual response headers for a meaningful check; browser HTML alone cannot expose every server response header.</small>");
};
const bindPreview=(ids,out)=>{ids.forEach(id=>$(id)?.addEventListener("input",()=>{}));};
const refreshSocial=()=>{
  setText("ogOutTitle",$("ogTitle")?.value||"Your page title");setText("ogOutDesc",$("ogDesc")?.value||"A useful description for social sharing.");
  try{const u=new URL($("ogUrl")?.value||"https://example.com/page");setText("ogOutUrl",u.host+u.pathname)}catch{setText("ogOutUrl",$("ogUrl")?.value||"example.com/page")};
  setText("twOutTitle",$("twTitle")?.value||"Your page title");setText("twOutDesc",$("twDesc")?.value||"A useful description for social sharing.");
};
["ogTitle","ogDesc","ogUrl","ogImage","twTitle","twDesc","twImage"].forEach(id=>$(id)?.addEventListener("input",refreshSocial));

if($("geoBtn"))$("geoBtn").onclick=()=>{
  const d=parse($("geoInput")?.value||""),text=d.body?.textContent||"",checks=[
    ["Clear H1",d.querySelectorAll("h1").length===1],
    ["Question-style headings",/\?|how to|what is|why |when /i.test(d.body?.textContent||"")],
    ["Direct answer paragraph",/\b(is|are|means|refers to|steps?|guide)\b/i.test(text.slice(0,3000))],
    ["Lists for scannability",d.querySelectorAll("ul,ol").length>0],
    ["Author or publisher signal",/author|about|publisher|editor/i.test(text)],
    ["Source links",d.querySelectorAll('a[href^="http"]').length>0],
    ["Structured data",d.querySelectorAll('script[type="application/ld+json"]').length>0]
  ];
  setHTML("geoOut",checks.map(row).join("")+"<small>Heuristic review only: it does not predict AI citations or search rankings.</small>");
};
if($("llmBtn"))$("llmBtn").onclick=()=>{
  const raw=$("llmInput")?.value||"",lines=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean),checks=[["Has content",lines.length>0],["Has headings",/^#{1,3}\s+/m.test(raw)],["Has links",/https?:\/\//.test(raw)],["Has readable sections",lines.length>=4]];
  setHTML("llmOut",checks.map(row).join("")+"<small>Use this as a structure check for a draft, not as a claim of search-ranking benefit.</small>");
};

if($("serpTitle"))$("serpTitle").oninput=e=>{setText("serpOutTitle",e.target.value||"Your page title");setText("titleCount",e.target.value.length)};
if($("serpDesc"))$("serpDesc").oninput=e=>{setText("serpOutDesc",e.target.value||"Your meta description");setText("descCount",e.target.value.length)};
if($("schemaBtn"))$("schemaBtn").onclick=()=>setText("schemaOut",JSON.stringify({"@context":"https://schema.org","@type":"Article","headline":$("schemaHeadline")?.value||"","author":{"@type":"Person","name":$("schemaAuthor")?.value||""},"url":$("schemaUrl")?.value||""},null,2));
if($("robotBtn"))$("robotBtn").onclick=()=>setText("robotOut","User-agent: "+$("robotAgent")?.value+"\nDisallow: "+$("robotDisallow")?.value+"\n\nSitemap: "+$("robotSitemap")?.value);
if($("sitemapBtn"))$("sitemapBtn").onclick=()=>{const u=($("sitemapInput")?.value||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);setText("sitemapOut",'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+u.map(x=>"  <url><loc>"+esc(x)+"</loc></url>").join("\n")+"\n</urlset>")};
if($("utmBtn"))$("utmBtn").onclick=()=>{try{const u=new URL($("utmUrl")?.value);[["utm_source","utmSource"],["utm_medium","utmMedium"],["utm_campaign","utmCampaign"]].forEach(x=>u.searchParams.set(x[0],$(x[1])?.value||""));setText("utmOut",u.toString())}catch{setText("utmOut","Enter a valid URL.")}};

const saved=sessionStorage.getItem("seoAuditUrl");if(saved&&$("htmlInput")){const hint=document.createElement("div");hint.className="tool-note";hint.textContent="Starting URL saved from the home page: "+saved+" · paste the returned page HTML below for browser-side analysis.";$("htmlInput").before(hint);sessionStorage.removeItem("seoAuditUrl")}
refreshSocial();$("schemaBtn")?.click();$("utmBtn")?.click();