const PSI_ENDPOINT=window.PSI_ENDPOINT||"https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const $p=id=>document.getElementById(id);
const escP=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const scoreClass=n=>n>=90?"good":n>=50?"warn":"bad";
const metric=(label,value,detail,state)=>'<div class="metric-tile"><span>'+escP(label)+'</span><strong class="'+state+'">'+escP(value)+'</strong><small>'+escP(detail||"")+'</small></div>';
const metricState=(name,val)=>{
 const n=Number(val);
 if(!Number.isFinite(n))return"neutral";
 if(name==="LCP")return n<=2500?"good":n<=4000?"warn":"bad";
 if(name==="INP")return n<=200?"good":n<=500?"warn":"bad";
 if(name==="CLS")return n<=.1?"good":n<=.25?"warn":"bad";
 return"neutral";
};
function normalizeUrl(value){
 let u=value.trim(); if(!u)return null;
 if(!/^https?:\/\//i.test(u))u="https://"+u;
 try{const parsed=new URL(u); if(!/^https?:$/.test(parsed.protocol))return null; return parsed.href}catch{return null}
}
async function runPSI(target,strategy){
 const u=new URL(PSI_ENDPOINT);
 u.searchParams.set("url",target);u.searchParams.set("strategy",strategy);u.searchParams.set("locale","en-US");
 ["performance","accessibility","best-practices","seo"].forEach(c=>u.searchParams.append("category",c));
 const response=await fetch(u,{headers:{"Accept":"application/json"}});
 if(!response.ok){let detail="PageSpeed returned HTTP "+response.status;try{const e=await response.json();if(e?.error?.message)detail=e.error.message;else if(e?.error)detail=String(e.error)}catch{}throw new Error(detail)}
 return response.json();
}
function extractReport(data,strategy){
 const l=data.lighthouseResult||{},cats=l.categories||{},audits=l.audits||{},refs=[
 ["LCP","largest-contentful-paint"],["INP","interaction-to-next-paint"],["CLS","cumulative-layout-shift"],["FCP","first-contentful-paint"],["TBT","total-blocking-time"],["TTFB","server-response-time"]
 ];
 const metrics=refs.map(([name,id])=>{const a=audits[id];if(!a)return null;return{name,value:a.numericValue,display:a.displayValue||String(a.numericValue),state:metricState(name,a.numericValue)}}).filter(Boolean);
 const opportunities=Object.values(audits).filter(a=>a&&a.details&&a.score!==null&&a.score<.9&&a.title&&a.title.length<120).sort((a,b)=>(a.score??1)-(b.score??1)).slice(0,6);
 return{
  strategy,
  id:data.id||"",
  scores:{
   Performance:Math.round((cats.performance?.score??0)*100),
   Accessibility:Math.round((cats.accessibility?.score??0)*100),
   "Best Practices":Math.round((cats["best-practices"]?.score??0)*100),
   SEO:Math.round((cats.seo?.score??0)*100)
  },metrics,opportunities
 }
}
function renderReport(reports){
 const out=$p("remoteResult"); if(!out)return;
 const all=reports.flatMap(r=>r.metrics),cwv=all.filter(x=>["LCP","INP","CLS"].includes(x.name));
 const hero=reports.length+" fresh runs";
 out.classList.remove("hidden");
 out.innerHTML='<div class="console-head"><div><span class="eyebrow">REMOTE AUDIT</span><h2>Live Lighthouse evidence</h2></div><span class="live-badge">FRESH RUN</span></div>'+
 '<div class="remote-summary"><div class="big-score"><small>REMOTE EVIDENCE</small><strong>'+hero+'</strong><span>mobile + desktop</span></div><div class="score-grid">'+reports.flatMap(r=>Object.entries(r.scores).map(([k,v])=>metric(k,v+"/100",r.strategy,scoreClass(v)))).join("")+'</div></div>'+
 '<div class="cw-grid">'+cwv.map(x=>metric(x.name,x.name==="CLS"?Number(x.value).toFixed(2):x.name==="LCP"?(x.value/1000).toFixed(1)+"s":Math.round(x.value)+"ms",x.display,metricState(x.name,x.value))).join("")+'</div>'+
 '<div class="report-columns"><div><span class="eyebrow">TOP OPPORTUNITIES</span><div class="finding-list">'+reports.flatMap(r=>r.opportunities.slice(0,3).map(a=>'<article><span>'+escP(r.strategy)+'</span><strong>'+escP(a.title)+'</strong><small>'+escP(a.displayValue||"Review Lighthouse details")+'</small></article>')).join("")+'</div></div><div class="evidence-note"><span class="eyebrow">HOW TO READ THIS</span><p>These are lab measurements from a fresh Lighthouse run. Core Web Vitals used by Google Search are evaluated from real-world field data when available; a Lighthouse run is useful for diagnosis but is not the same thing as field experience.</p></div></div>';
}
async function startRemoteAudit(){
 const input=$p("remoteUrl"),button=$p("remoteBtn"),out=$p("remoteResult"),status=$p("remoteStatus");
 const target=normalizeUrl(input?.value||"");
 if(!target){if(status)status.textContent="Enter a valid public URL.";return}
 button?.setAttribute("disabled","disabled");if(status)status.textContent="Running mobile + desktop Lighthouse audits…";
 out?.classList.remove("hidden");if(out)out.innerHTML='<div class="loading-console"><span class="pulse-dot"></span> Fetching fresh evidence from Google PageSpeed Insights…</div>';
 try{
  const reports=await Promise.all(["mobile","desktop"].map(async strategy=>extractReport(await runPSI(target,strategy),strategy)));
  sessionStorage.setItem("lastPSIUrl",target);renderReport(reports);
  if(status)status.textContent="Audit complete · "+new Date().toLocaleTimeString();
 }catch(err){
  if(out)out.innerHTML='<div class="error-console"><strong>Remote audit could not be completed.</strong><p>'+escP(err.message||"Unknown error")+'</p><small>The public PageSpeed endpoint can be rate-limited. Try again later or configure a dedicated API endpoint/serverless proxy for production.</small></div>';
  if(status)status.textContent="Audit failed";
 }finally{button?.removeAttribute("disabled")}
}
if($p("remoteBtn"))$p("remoteBtn").onclick=startRemoteAudit;
const savedPSI=sessionStorage.getItem("lastPSIUrl");if(savedPSI&&$p("remoteUrl"))$p("remoteUrl").value=savedPSI;
