module.exports = async function handler(req,res){
  if(req.method!=="GET"){res.status(405).json({error:"Method not allowed"});return}
  const target=String(req.query?.url||"").trim(),strategy=String(req.query?.strategy||"mobile");
  if(!/^https?:\/\//i.test(target)){res.status(400).json({error:"A valid public URL is required."});return}
  if(!["mobile","desktop"].includes(strategy)){res.status(400).json({error:"Invalid strategy."});return}
  const key=process.env.PAGESPEED_API_KEY;
  if(!key){res.status(503).json({error:"PAGESPEED_API_KEY is not configured on the audit endpoint."});return}
  const u=new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  u.searchParams.set("key",key);u.searchParams.set("url",target);u.searchParams.set("strategy",strategy);u.searchParams.set("locale","en-US");
  ["performance","accessibility","best-practices","seo"].forEach(c=>u.searchParams.append("category",c));
  try{
    const response=await fetch(u,{headers:{Accept:"application/json"}});
    const body=await response.text();
    res.status(response.status).setHeader("Content-Type","application/json; charset=utf-8").send(body);
  }catch(error){
    res.status(502).json({error:"Unable to reach PageSpeed Insights.",detail:String(error?.message||error)});
  }
}