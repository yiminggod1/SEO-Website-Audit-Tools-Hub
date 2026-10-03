import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const files=fs.readdirSync(root);
const htmlFiles=files.filter(f=>f.endsWith(".html")&&f!=="404.html");
const issues=[];

for(const file of htmlFiles){
  const html=fs.readFileSync(path.join(root,file),"utf8");
  if(!/<title>\s*[^<]+<\/title>/i.test(html)) issues.push(`${file}: missing title`);
  if(!/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(html)) issues.push(`${file}: missing meta description`);
  if(!/<link[^>]+rel=["']canonical["'][^>]+href=/i.test(html)) issues.push(`${file}: missing canonical`);

  const ids=[...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]);
  const counts=new Map();
  ids.forEach(id=>counts.set(id,(counts.get(id)||0)+1));
  for(const [id,count] of counts){ if(count>1) issues.push(`${file}: duplicate id "${id}" (${count}x)`) }

  const anchors=new Set(ids);
  const fragmentRefs=[...html.matchAll(/href=["']#([^"']+)["']/gi)].map(m=>m[1]);
  for(const ref of fragmentRefs){
    if(!anchors.has(ref)) issues.push(`${file}: broken anchor #${ref}`);
  }

  const hrefs=[...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map(m=>m[1]).filter(Boolean);
  for(const href of hrefs){
    if(/^(https?:|mailto:|tel:|javascript:|data:|#)/i.test(href)) continue;
    const target=href.split("#")[0].split("?")[0].replace(/^\.\/+/, "");
    if(!target) continue;
    if(!files.includes(target)) issues.push(`${file}: broken local link -> ${href}`);
  }

  const ads=(html.match(/class=["'][^"']*ad-slot[^"']*["']/gi)||[]).length;
  if(ads){
    if(!/aria-label=["']Advertising space["']/i.test(html) && !/>Advertisement</i.test(html)) issues.push(`${file}: ad slot exists without clear advertisement labeling`);
    if(/ad-slot[^<]{0,240}<\/div>[^]*?<button/i.test(html)) issues.push(`${file}: review ad proximity to interactive controls`);
  }

  if(/[\u{1F300}-\u{1FAFF}]/u.test(html)) issues.push(`${file}: emoji character found in page markup; use SVG/iconography instead`);
}

for(const jsFile of ["app.js","performance.js","api/pagespeed.js"]){
  const full=path.join(root,jsFile);
  if(!fs.existsSync(full)) continue;
  try{execFileSync("node",["--check",full],{stdio:"pipe"})}
  catch(err){issues.push(`${jsFile}: JavaScript syntax check failed\n${String(err.stderr||err.stdout||err.message)}`)}
}

if(issues.length){
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log(`QA passed: ${htmlFiles.length} HTML pages + JavaScript syntax checks. IDs, anchors, local links and ad labeling were inspected.`);