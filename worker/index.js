function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,OPTIONS',
      'cache-control': 'no-store'
    }
  });
}

const VERSION = '2026.03.15-web-r1';
const UA_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const UA_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const TIMEOUT = 8000;
const ARROW = ' ➟ ';
const STATUS = { AVAILABLE:'available', PARTIAL:'partial', COMING:'coming', NOT_AVAILABLE:'not_available', ERROR:'error', TIMEOUT:'timeout' };
const FLAGS = new Map([['AE','🇦🇪'],['AR','🇦🇷'],['AT','🇦🇹'],['AU','🇦🇺'],['BE','🇧🇪'],['BG','🇧🇬'],['BH','🇧🇭'],['BR','🇧🇷'],['CA','🇨🇦'],['CH','🇨🇭'],['CL','🇨🇱'],['CN','🇨🇳'],['CO','🇨🇴'],['CY','🇨🇾'],['CZ','🇨🇿'],['DE','🇩🇪'],['DK','🇩🇰'],['DZ','🇩🇿'],['EC','🇪🇨'],['EE','🇪🇪'],['EG','🇪🇬'],['ES','🇪🇸'],['FI','🇫🇮'],['FR','🇫🇷'],['GB','🇬🇧'],['GR','🇬🇷'],['HK','🇭🇰'],['HR','🇭🇷'],['HU','🇭🇺'],['ID','🇮🇩'],['IE','🇮🇪'],['IL','🇮🇱'],['IN','🇮🇳'],['IQ','🇮🇶'],['IS','🇮🇸'],['IT','🇮🇹'],['JP','🇯🇵'],['JO','🇯🇴'],['KE','🇰🇪'],['KR','🇰🇷'],['KW','🇰🇼'],['KZ','🇰🇿'],['LB','🇱🇧'],['LT','🇱🇹'],['LU','🇱🇺'],['LV','🇱🇻'],['MA','🇲🇦'],['MX','🇲🇽'],['MY','🇲🇾'],['NG','🇳🇬'],['NL','🇳🇱'],['NO','🇳🇴'],['NZ','🇳🇿'],['OM','🇴🇲'],['PA','🇵🇦'],['PE','🇵🇪'],['PH','🇵🇭'],['PK','🇵🇰'],['PL','🇵🇱'],['PT','🇵🇹'],['QA','🇶🇦'],['RO','🇷🇴'],['RS','🇷🇸'],['RU','🇷🇺'],['SA','🇸🇦'],['SE','🇸🇪'],['SG','🇸🇬'],['SI','🇸🇮'],['SK','🇸🇰'],['TH','🇹🇭'],['TN','🇹🇳'],['TR','🇹🇷'],['TW','🇹🇼'],['UA','🇺🇦'],['UG','🇺🇬'],['US','🇺🇸'],['UY','🇺🇾'],['VN','🇻🇳'],['ZA','🇿🇦']]);
const OPENAI_SUPPORTED = new Set(['AL','DZ','AF','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA','KY','CF','TD','CL','CO','KM','CG','CD','CR','CI','HR','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FO','FJ','FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GR','GD','GL','GP','GT','GN','GW','GY','HT','VA','HN','HU','IS','IN','ID','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PL','PT','QA','RE','RO','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','KR','SS','ES','LK','SR','SE','CH','SD','SJ','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VN','WF','YE','ZM','ZW']);

function flag(region){ if(!region) return ''; const r=String(region).toUpperCase(); return FLAGS.get(r)||(`🏳️ ${r}`); }
function safeJsonParse(text){ try{return JSON.parse(text);}catch{return null;} }
async function doFetch(url, init = {}, timeoutMs = TIMEOUT){
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort('timeout'), timeoutMs);
  try{
    const r = await fetch(url, {...init, signal: ctrl.signal});
    const body = await r.text();
    return {ok:true, status:r.status, headers:r.headers, body};
  }catch(e){
    return {ok:false, error:String(e)};
  }finally{ clearTimeout(timer); }
}
function setResult(obj, key, text, status, meta={}){ obj[key] = {text, status, meta}; }

async function testYouTubePremium(obj){
  const name='YouTube Premium';
  const res = await doFetch('https://www.youtube.com/premium',{headers:{'user-agent':UA_DESKTOP,'accept-language':'en-US,en;q=0.9'}});
  if(!res.ok) return setResult(obj,name,'YouTube Premium: 检测超时/失败 🚦',STATUS.TIMEOUT,{error:res.error});
  if(res.status!==200) return setResult(obj,name,`YouTube Premium: HTTP ${res.status} ❗️`,STATUS.ERROR,{status:res.status});
  const body=res.body||''; const unavailable=/Premium is not available in your country|YouTube Premium is not available in your country|not available in your country/i.test(body); const verify=/couldn.?t verify your country|verify your country/i.test(body); let m=body.match(/"GL":"([A-Z]{2})"/); let region=m?m[1]:'';
  if(unavailable) return setResult(obj,name,'YouTube Premium: 未支持 🚫',STATUS.NOT_AVAILABLE,{region});
  if(verify) return setResult(obj,name,`YouTube Premium: 可访问但地区校验严格${region?ARROW+'⟦'+flag(region)+'⟧':''} ⚠️`,STATUS.PARTIAL,{region});
  return setResult(obj,name,`YouTube Premium: 支持${region?ARROW+'⟦'+flag(region)+'⟧':''} 🎉`,STATUS.AVAILABLE,{region});
}
async function testNetflix(obj){
  const name='Netflix'; const res = await doFetch('https://www.netflix.com/title/81280792',{headers:{'user-agent':UA_DESKTOP,'accept-language':'en-US,en;q=0.9'}});
  if(!res.ok) return setResult(obj,name,'Netflix: 检测超时/失败 🚦',STATUS.TIMEOUT,{error:res.error});
  if(res.status===403) return setResult(obj,name,'Netflix: 未支持 🚫',STATUS.NOT_AVAILABLE,{status:res.status});
  if(res.status===404) return setResult(obj,name,'Netflix: 仅支持自制剧集 ⚠️',STATUS.PARTIAL,{status:res.status});
  if(res.status===200){
    const orig = res.headers.get('x-originating-url') || ''; let region=''; let m=orig.match(/https?:\/\/www\.netflix\.com\/([a-z]{2})(?:-|\/)/i); if(m) region=m[1].toUpperCase();
    if(!region){ m=(res.body||'').match(/"requestCountry"\s*:\s*"([A-Z]{2})"/i); if(m) region=m[1].toUpperCase(); }
    return setResult(obj,name,`Netflix: 完整支持${region?ARROW+'⟦'+flag(region)+'⟧':''} 🎉`,STATUS.AVAILABLE,{region});
  }
  return setResult(obj,name,`Netflix: 结果不确定 (HTTP ${res.status}) ⚠️`,STATUS.ERROR,{status:res.status});
}
async function testDisneyPlus(obj){
  const name='Disney+'; const home=await doFetch('https://www.disneyplus.com/',{headers:{'user-agent':UA_DESKTOP,'accept-language':'en-US,en;q=0.9'}});
  if(!home.ok) return setResult(obj,name,'Disney+: 检测超时/失败 🚦',STATUS.TIMEOUT,{error:home.error});
  if(home.status!==200 || /not available in your region/i.test(home.body||'')) return setResult(obj,name,'Disney+: 未支持 🚫',STATUS.NOT_AVAILABLE,{status:home.status});
  let region=''; let m=(home.body||'').match(/Region:\s*([A-Za-z]{2})[\s\S]*?CNBL:\s*([12])/i); let cnbl = m?m[2]:''; if(m) region=m[1].toUpperCase();
  const payload={query:'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',variables:{input:{applicationRuntime:'chrome',attributes:{browserName:'chrome',browserVersion:'122.0.0.0',manufacturer:'apple',model:null,operatingSystem:'macintosh',operatingSystemVersion:'10.15.7',osDeviceIds:[]},deviceFamily:'browser',deviceLanguage:'en',deviceProfile:'macosx'}}};
  const api=await doFetch('https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',{method:'POST',headers:{'user-agent':UA_DESKTOP,'accept-language':'en-US,en;q=0.9','content-type':'application/json','authorization':'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84'},body:JSON.stringify(payload)});
  if(!api.ok) return setResult(obj,name,`Disney+: 首页可达，但接口校验失败${region?ARROW+'⟦'+flag(region)+'⟧':''} ⚠️`,STATUS.PARTIAL,{region,cnbl,error:api.error});
  const json=safeJsonParse(api.body); const sdk=json&&json.extensions&&json.extensions.sdk; const country=sdk&&sdk.session&&sdk.session.location&&sdk.session.location.countryCode; const supported=sdk&&sdk.session&&sdk.session.inSupportedLocation; if(country) region=String(country).toUpperCase();
  if(supported===false || supported==='false') return setResult(obj,name,`Disney+: 即将登陆${region?ARROW+'⟦'+flag(region)+'⟧':''} ⚠️`,STATUS.COMING,{region});
  if(supported===true || supported==='true') return setResult(obj,name,`Disney+: 支持${region?ARROW+'⟦'+flag(region)+'⟧':''} 🎉`,STATUS.AVAILABLE,{region});
  return setResult(obj,name,`Disney+: 结果不完全确定${region?ARROW+'⟦'+flag(region)+'⟧':''} ⚠️`,STATUS.PARTIAL,{region,cnbl});
}
async function testDAZN(obj){
  const name='DAZN'; const res=await doFetch('https://startup.core.indazn.com/misl/v5/Startup',{method:'POST',headers:{'user-agent':UA_WIN,'content-type':'application/json','accept-language':'en-US,en;q=0.9'},body:JSON.stringify({LandingPageKey:'generic',Platform:'web',PlatformAttributes:{},Manufacturer:'',PromoCode:'',Version:'2'})});
  if(!res.ok) return setResult(obj,name,'DAZN: 检测超时/失败 🚦',STATUS.TIMEOUT,{error:res.error});
  if(res.status!==200) return setResult(obj,name,`DAZN: HTTP ${res.status} ❗️`,STATUS.ERROR,{status:res.status});
  let m=(res.body||'').match(/"GeolocatedCountry":"([A-Z]{2})"/i); let region=m?m[1].toUpperCase():'';
  if(region) return setResult(obj,name,`DAZN: 支持${ARROW}⟦${flag(region)}⟧ 🎉`,STATUS.AVAILABLE,{region});
  return setResult(obj,name,'DAZN: 结果不确定 ⚠️',STATUS.PARTIAL,{});
}
async function testParamountPlus(obj){
  const name='Paramount+'; const res=await doFetch('https://www.paramountplus.com/',{redirect:'manual',headers:{'user-agent':UA_DESKTOP,'accept-language':'en-US,en;q=0.9'}});
  if(!res.ok) return setResult(obj,name,'Paramount+: 检测超时/失败 🚦',STATUS.TIMEOUT,{error:res.error});
  const loc=res.headers.get('location')||''; const body=(res.body||'').toLowerCase();
  if(res.status===200 && !/not available|outside your country|geo/i.test(body)) return setResult(obj,name,'Paramount+: 支持 🎉',STATUS.AVAILABLE,{});
  if(res.status>=300 && res.status<400) return setResult(obj,name,'Paramount+: 可访问但存在地区跳转 ⚠️',STATUS.PARTIAL,{location:loc,status:res.status});
  if(/not available|outside your country|geo/i.test(body)) return setResult(obj,name,'Paramount+: 未支持 🚫',STATUS.NOT_AVAILABLE,{status:res.status});
  return setResult(obj,name,`Paramount+: 结果不确定 (HTTP ${res.status}) ⚠️`,STATUS.ERROR,{status:res.status});
}
async function testDiscoveryPlus(obj){
  const name='Discovery+'; const token=await doFetch('https://us1-prod-direct.discoveryplus.com/token?deviceId=d1a4a5d25212400d1e6985984604d740&realm=go&shortlived=true',{headers:{'user-agent':UA_WIN,'accept-language':'en-US,en;q=0.9'}});
  if(!token.ok) return setResult(obj,name,'Discovery+: 检测超时/失败 🚦',STATUS.TIMEOUT,{error:token.error});
  if(token.status!==200) return setResult(obj,name,`Discovery+: Token 获取失败 (HTTP ${token.status}) ❗️`,STATUS.ERROR,{status:token.status});
  const tj=safeJsonParse(token.body); const tk=tj&&tj.data&&tj.data.attributes&&tj.data.attributes.token; if(!tk) return setResult(obj,name,'Discovery+: Token 解析失败 ❗️',STATUS.ERROR,{});
  const me=await doFetch('https://us1-prod-direct.discoveryplus.com/users/me',{headers:{'user-agent':UA_WIN,'accept-language':'en-US,en;q=0.9','cookie':`st=${tk}`}});
  if(!me.ok) return setResult(obj,name,'Discovery+: 二次校验失败 🚦',STATUS.TIMEOUT,{error:me.error});
  if(me.status!==200) return setResult(obj,name, me.status===401||me.status===403 ? 'Discovery+: 未支持 / 访问受限 🚫' : `Discovery+: HTTP ${me.status} ❗️`, me.status===401||me.status===403 ? STATUS.NOT_AVAILABLE : STATUS.ERROR,{status:me.status});
  const mj=safeJsonParse(me.body); const territory=mj&&mj.data&&mj.data.attributes&&mj.data.attributes.currentLocationTerritory; if(territory) return setResult(obj,name,`Discovery+: 支持${ARROW}⟦${flag(String(territory).toUpperCase())}⟧ 🎉`,STATUS.AVAILABLE,{region:String(territory).toUpperCase()});
  return setResult(obj,name,'Discovery+: 结果不确定 ⚠️',STATUS.PARTIAL,{});
}
async function testChatGPT(obj){
  const name='ChatGPT'; const trace=await doFetch('https://chatgpt.com/cdn-cgi/trace',{headers:{'user-agent':UA_DESKTOP,'accept-language':'en-US,en;q=0.9'}}); let region=''; if(trace.ok && trace.status===200){ const m=(trace.body||'').match(/(?:^|\n)loc=([A-Z]{2})(?:\n|$)/); if(m) region=m[1].toUpperCase(); }
  const web=await doFetch('https://chatgpt.com/',{headers:{'user-agent':UA_DESKTOP,'accept-language':'en-US,en;q=0.9'}}); if(!trace.ok && !web.ok) return setResult(obj,name,'ChatGPT: 检测超时/失败 🚦',STATUS.TIMEOUT,{traceError:trace.error,webError:web.error});
  const body=web.ok ? (web.body||'') : ''; const blocked=/unsupported country|not available in your country|access denied|you do not have access/i.test(body); const supported = region ? OPENAI_SUPPORTED.has(region) : null;
  if(blocked) return setResult(obj,name,`ChatGPT: 未支持${region?ARROW+'⟦'+flag(region)+'⟧':''} 🚫`,STATUS.NOT_AVAILABLE,{region,supported});
  if(region && supported===false) return setResult(obj,name,`ChatGPT: 官方不支持该地区${ARROW}⟦${flag(region)}⟧ 🚫`,STATUS.NOT_AVAILABLE,{region,supported});
  if(web.ok && web.status===200) return setResult(obj,name,`ChatGPT: 支持${region?ARROW+'⟦'+flag(region)+'⟧':''} 🎉`,STATUS.AVAILABLE,{region,supported});
  return setResult(obj,name,'ChatGPT: 结果不确定 ⚠️',STATUS.PARTIAL,{region,supported});
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return json({ ok: true });
    const url = new URL(request.url);
    if (url.pathname !== '/check') return json({ ok:false, error:'Not Found' }, 404);
    const items = {};
    await Promise.all([
      testYouTubePremium(items),
      testNetflix(items),
      testDisneyPlus(items),
      testDAZN(items),
      testParamountPlus(items),
      testDiscoveryPlus(items),
      testChatGPT(items)
    ]);
    return json({ ok:true, version: VERSION, generatedAt: new Date().toISOString(), items });
  }
};
