const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const parse=h=>new DOMParser().parseFromString(h,"text/html");
const htmlValue=id=>$(id)?.value.trim()||"";

function audit(h){
  const d=parse(h);
  const t=d.querySelector("title")?.textContent.trim()||"";
  const m=d.querySelector('meta[name="description"]')?.content.trim()||"";
  const c=d.querySelector('link[rel="canonical"]')?.href||"";
  const r=d.querySelector('meta[name="robots"]')?.content||"";
  const h1=d.querySelectorAll("h1").length;
  const im=[...d.images];
  const bad=im.filter(x=>!x.alt.trim()).length;
  const a=[...d.querySelectorAll("a[href]")];
  const empty=a.filter(x=>!x.getAttribute("href")||x.getAttribute("href")==="#").length;
  const j=d.querySelectorAll('script[type="application/ld+json"]').length;
  const v=!!d.querySelector('meta[name="viewport"]');
  const lang=!!d.documentElement.lang;
  const checks=[
    ["Title",t?t.length+" chars":"Missing",!!t&&t.length>=10&&t.length<=60],
    ["Description",m?m.length+" chars":"Missing",!!m&&m.length>=50&&m.length<=160],
    ["Canonical",c?"Present":"Missing",!!c],
    ["Robots",r||"Not set",!r||!r.includes("noindex")],
    ["H1",h1+" found",h1===1],
    ["Images",bad?bad+" missing alt":"Alt text present",bad===0],
    ["Links",empty?empty+" empty links":"No empty links",empty===0],
    ["JSON-LD",j+" block(s)",j>0],
    ["Viewport",v?"Present":"Missing",v],
    ["HTML lang",d.documentElement.lang||"Missing",lang]
  ];
  return {d,checks,im,bad,a,empty};
}
const row=x=>'<div class="audit-row"><span>'+esc(x[0])+'</span><b class="'+(x[2]?"good":"bad")+'">'+esc(x[1])+"</b></div>";

function show(id,html){const el=$(id);if(!el)return;el.classList.remove("hidden");el.innerHTML=html;}
function setText(id,value){const el=$(id);if(el)el.textContent=value;}

if($("auditBtn"))$("auditBtn").onclick=()=>{$("audit")?.scrollIntoView({behavior:"smooth",block:"center"});$("htmlInput")?.focus()};
if($("analyzeHtml"))$("analyzeHtml").onclick=()=>{
  const h=htmlValue("htmlInput");
  if(!h){show("auditResult","<b>Paste HTML first.</b>");return}
  const r=audit(h),passed=r.checks.filter(x=>x[2]).length,p=Math.round(passed/r.checks.length*100);
  show("auditResult",'<div class="score-head"><div><span class="eyebrow">PAGE HEALTH</span><strong>'+p+'%</strong></div><span>'+passed+" / "+r.checks.length+' passed</span></div>'+r.checks.map(row).join(""));
  ["headingInput","imageInput","linkInput","canonicalInput","indexInput","mobileInput","ogInput","twitterInput"].forEach(id=>{if($(id))$(id).value=h});
};

if($("headingBtn"))$("headingBtn").onclick=()=>{
  const h=[...parse(htmlValue("headingInput")).querySelectorAll("h1,h2,h3,h4,h5,h6")];
  setText("headingOut","");
  $("headingOut").innerHTML=h.length?h.map(x=>"<div><b>"+x.tagName+"</b> "+esc(x.textContent.trim())+"</div>").join(""):"No headings found.";
};
if($("imageBtn"))$("imageBtn").onclick=()=>{
  const a=[...parse(htmlValue("imageInput")).images],b=a.filter(x=>!x.alt.trim()).length,n=a.filter(x=>!x.width&&!x.height).length,lazy=a.filter(x=>x.loading==="lazy").length;
  setText("imageOut", "");
  $("imageOut").innerHTML="<b>"+a.length+"</b> images · <b>"+b+"</b> missing alt · <b>"+n+"</b> without dimensions · <b>"+lazy+"</b> lazy-loaded.";
};
if($("altBtn"))$("altBtn").onclick=()=>{
  const a=[...parse(htmlValue("altInput")).images],bad=a.filter(x=>!x.alt.trim()),decor=a.filter(x=>x.alt.trim()===""||x.alt.trim().length<3);
  $("altOut").innerHTML="<b>"+a.length+"</b> images · <b>"+bad.length+"</b> missing alt · <b>"+decor.length+"</b> empty/very-short alt. Decorative images should intentionally use an empty alt attribute.";
};
if($("linkBtn"))$("linkBtn").onclick=()=>{
  const a=[...parse(htmlValue("linkInput")).querySelectorAll("a[href]")];
  const internal=a.filter(x=>{const u=x.getAttribute("href")||"";return u.startsWith("/")||u.startsWith("#")||u.startsWith("./")||u.startsWith("../")||u.startsWith(location.origin)}).length;
  const n=a.filter(x=>(x.rel||"").split(/\s+/).includes("nofollow")).length;
  const missing=a.filter(x=>!x.textContent.trim()&&!x.querySelector("img[alt]")).length;
  $("linkOut").innerHTML="<b>"+a.length+"</b> links · "+internal+" internal-ish · "+(a.length-internal)+" external-ish · "+n+" nofollow · "+missing+" unnamed.";
};
if($("brokenBtn"))$("brokenBtn").onclick=()=>{
  const d=parse(htmlValue("brokenInput")),anchors=[...d.querySelectorAll("a[href^='#']")],ids=new Set([...d.querySelectorAll("[id]")].map(x=>x.id));
  const missing=anchors.filter(a=>{const href=a.getAttribute("href");return href&&href!=="#"&&!ids.has(href.slice(1))});
  const empty=[...d.querySelectorAll("a")].filter(a=>[""," #"].includes((a.getAttribute("href")||"").trim())||!a.getAttribute("href"));
  $("brokenOut").innerHTML="<b>"+anchors.length+"</b> fragment links · <b>"+missing.length+"</b> missing in-page targets · <b>"+empty.length+"</b> empty/invalid hrefs. External HTTP status checks require a server-side fetch.";
};
if($("canonicalBtn"))$("canonicalBtn").onclick=()=>{
  const cs=[...parse(htmlValue("canonicalInput")).querySelectorAll('link[rel="canonical"]')],c=cs[0];
  $("canonicalOut").innerHTML=c?"Canonical: <code>"+esc(c.getAttribute("href"))+"</code> · "+cs.length+" canonical tag(s).": "No canonical link found.";
};
if($("indexBtn"))$("indexBtn").onclick=()=>{
  const d=parse(htmlValue("indexInput")),r=d.querySelector('meta[name="robots"]')?.content||"",x=d.querySelector('meta[name="googlebot"]')?.content||"",canon=d.querySelector('link[rel="canonical"]')?.getAttribute("href")||"";
  const ni=/noindex/i.test(r+" "+x),nf=/nofollow/i.test(r+" "+x);
  $("indexOut").innerHTML="<b>"+(ni?"Noindex detected":"No noindex directive detected")+"</b> · "+(nf?"Nofollow detected":"No nofollow directive detected")+" · "+(canon?"Canonical present":"Canonical missing")+".";
};
if($("mobileBtn"))$("mobileBtn").onclick=()=>{
  const d=parse(htmlValue("mobileInput")),v=d.querySelector('meta[name="viewport"]')?.content||"",h=d.documentElement.clientWidth||0;
  const issues=[]; if(!v)issues.push("missing viewport"); if(v&&!/width\s*=\s*device-width/i.test(v))issues.push("viewport does not declare device-width"); if(/user-scalable\s*=\s*no|maximun-scale\s*=\s*1/i.test(v))issues.push("zoom may be restricted");
  $("mobileOut").innerHTML=(issues.length?'<b class="bad">'+issues.length+" issue(s)</b>":"<b class="good">Core mobile markup looks reasonable</b>")+" · "+(v?esc(v):"No viewport")+(h?" · parsed width "+h:"");
};
function cardPreview(inputId,outId,mode){
  const d=parse(htmlValue(inputId)),get=n=>d.querySelector('meta[property="'+n+'"]')?.content||d.querySelector('meta[name="'+n+'"]')?.content||"";
  const title=get("og:title")||d.title||"Untitled page",desc=get("og:description")||d.querySelector('meta[name="description"]')?.content||"Add a description",url=get("og:url")||location.href,img=get("og:image");
  const x=mode==="twitter";
  const site=x?(get("twitter:site")||"@site"):(get("og:site_name")||"Example");
  $(outId).innerHTML='<div class="serp-card"><div class="serp-url">'+esc(site)+'</div><div class="serp-title">'+esc(title)+'</div><p>'+esc(desc)+'</p><small>'+esc(url)+(img?' · image configured':'')+'</small></div>';
}
if($("ogBtn"))$("ogBtn").onclick=()=>cardPreview("ogInput","ogOut","og");
if($("twitterBtn"))$("twitterBtn").onclick=()=>cardPreview("twitterInput","twitterOut","twitter");
if($("keywordBtn"))$("keywordBtn").onclick=()=>{
  const w=(htmlValue("keywordInput").toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g)||[]),m={};
  w.forEach(x=>{if(x.length>3)m[x]=(m[x]||0)+1});
  $("keywordOut").innerHTML=Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,10).map(x=>"<div class='kw'><span>"+esc(x[0])+"</span><b>"+x[1]+" · "+(x[1]/w.length*100).toFixed(1)+"%</b></div>").join("")||"Add more text.";
};
if($("readBtn"))$("readBtn").onclick=()=>{
  const t=htmlValue("readInput"),s=(t.match(/[.!?]+/g)||[]).length||1,w=(t.match(/\b[\w'-]+\b/g)||[]).length,y=(t.toLowerCase().match(/[aeiouy]+/g)||[]).length,g=w?Math.max(0,Math.min(18,.39*(w/s)+11.8*(y/w)-15.59)).toFixed(1):0;
  $("readOut").innerHTML="<b>"+w+"</b> words · <b>"+s+"</b> sentences · estimated grade <b>"+g+"</b>.";
};
if($("serpTitle"))$("serpTitle").oninput=e=>{setText("serpOutTitle",e.target.value||"Your page title");setText("titleCount",e.target.value.length)};
if($("serpDesc"))$("serpDesc").oninput=e=>{setText("serpOutDesc",e.target.value||"Your meta description");setText("descCount",e.target.value.length)};
if($("schemaBtn"))$("schemaBtn").onclick=()=>{
  $("schemaOut").textContent=JSON.stringify({"@context":"https://schema.org","@type":"Article","headline":$("schemaHeadline").value,"author":{"@type":"Person","name":$("schemaAuthor").value},"url":$("schemaUrl").value},null,2)
};
if($("robotBtn"))$("robotBtn").onclick=()=>{$("robotOut").textContent="User-agent: "+$("robotAgent").value+"\nDisallow: "+$("robotDisallow").value+"\n\nSitemap: "+$("robotSitemap").value};
if($("sitemapBtn"))$("sitemapBtn").onclick=()=>{
  const u=$("sitemapInput").value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  $("sitemapOut").textContent='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+u.map(x=>"  <url><loc>"+esc(x)+"</loc></url>").join("\n")+"\n</urlset>";
};
if($("utmBtn"))$("utmBtn").onclick=()=>{
  try{const u=new URL($("utmUrl").value);[["utm_source","utmSource"],["utm_medium","utmMedium"],["utm_campaign","utmCampaign"]].forEach(x=>u.searchParams.set(x[0],$(x[1]).value));$("utmOut").textContent=u.toString()}catch{$("utmOut").textContent="Enter a valid URL."}
};

$("schemaBtn")?.click();$("robotBtn")?.click();$("utmBtn")?.click();
