import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const htmlFiles=fs.readdirSync(root).filter(f=>f.endsWith(".html")&&f!=="404.html");
const issues=[];

for(const file of htmlFiles){
  const html=fs.readFileSync(path.join(root,file),"utf8");
  if(!/<title>[^<]+<\/title>/i.test(html)) issues.push(`${file}: missing title`);
  if(!/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(html)) issues.push(`${file}: missing meta description`);
  if(!/<link[^>]+rel=["']canonical["'][^>]+href=/i.test(html)) issues.push(`${file}: missing canonical`);
  const hrefs=[...html.matchAll(/href=["']([^"']+)["']/gi)].map(m=>m[1]);
  for(const href of hrefs){
    if(!href||href.startsWith("#")||/^(https?:|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    const target=href.split("#")[0].split("?")[0];
    if(!target) continue;
    const resolved=path.normalize(path.join(path.dirname(file),target));
    if(!fs.existsSync(path.join(root,resolved))) issues.push(`${file}: broken local link -> ${href}`);
  }
}
if(issues.length){
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log(`QA passed: ${htmlFiles.length} HTML pages checked for titles, descriptions, canonicals and local links.`);