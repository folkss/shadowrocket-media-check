/*
 * Media Unlock Check (mobile-friendly rewrite)
 * Target: Shadowrocket / Surge-style script environments
 *
 * Platforms:
 * - YouTube Premium
 * - Netflix
 * - Disney+
 * - DAZN
 * - Paramount+
 * - Discovery+
 * - ChatGPT / OpenAI
 *
 * Notes:
 * - Rewritten from scratch instead of migrating old Quantumult X UI script.
 * - Uses multi-signal detection where possible.
 * - Designed for script environments exposing $httpClient and $done.
 * - Notification output is plain text for broader compatibility.
 */

const VERSION = '2026.03.15-r1';
const UA_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const UA_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const TIMEOUT = 8000;
const ARROW = ' ➟ ';

const STATUS = {
  AVAILABLE: 'available',
  PARTIAL: 'partial',
  COMING: 'coming',
  NOT_AVAILABLE: 'not_available',
  ERROR: 'error',
  TIMEOUT: 'timeout'
};

const RESULT = {
  title: '📺 流媒体 / AI 服务解锁检测',
  items: {}
};

const FLAGS = new Map([
  ['AE','🇦🇪'],['AR','🇦🇷'],['AT','🇦🇹'],['AU','🇦🇺'],['BE','🇧🇪'],['BG','🇧🇬'],['BH','🇧🇭'],['BR','🇧🇷'],['CA','🇨🇦'],['CH','🇨🇭'],['CL','🇨🇱'],['CN','🇨🇳'],['CO','🇨🇴'],['CY','🇨🇾'],['CZ','🇨🇿'],['DE','🇩🇪'],['DK','🇩🇰'],['DZ','🇩🇿'],['EC','🇪🇨'],['EE','🇪🇪'],['EG','🇪🇬'],['ES','🇪🇸'],['FI','🇫🇮'],['FR','🇫🇷'],['GB','🇬🇧'],['GR','🇬🇷'],['HK','🇭🇰'],['HR','🇭🇷'],['HU','🇭🇺'],['ID','🇮🇩'],['IE','🇮🇪'],['IL','🇮🇱'],['IN','🇮🇳'],['IQ','🇮🇶'],['IS','🇮🇸'],['IT','🇮🇹'],['JP','🇯🇵'],['JO','🇯🇴'],['KE','🇰🇪'],['KR','🇰🇷'],['KW','🇰🇼'],['KZ','🇰🇿'],['LB','🇱🇧'],['LT','🇱🇹'],['LU','🇱🇺'],['LV','🇱🇻'],['MA','🇲🇦'],['MX','🇲🇽'],['MY','🇲🇾'],['NG','🇳🇬'],['NL','🇳🇱'],['NO','🇳🇴'],['NZ','🇳🇿'],['OM','🇴🇲'],['PA','🇵🇦'],['PE','🇵🇪'],['PH','🇵🇭'],['PK','🇵🇰'],['PL','🇵🇱'],['PT','🇵🇹'],['QA','🇶🇦'],['RO','🇷🇴'],['RS','🇷🇸'],['RU','🇷🇺'],['SA','🇸🇦'],['SE','🇸🇪'],['SG','🇸🇬'],['SI','🇸🇮'],['SK','🇸🇰'],['TH','🇹🇭'],['TN','🇹🇳'],['TR','🇹🇷'],['TW','🇹🇼'],['UA','🇺🇦'],['UG','🇺🇬'],['US','🇺🇸'],['UY','🇺🇾'],['VN','🇻🇳'],['ZA','🇿🇦']
]);

const OPENAI_SUPPORTED = new Set([
  'AL','DZ','AF','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA','KY','CF','TD','CL','CO','KM','CG','CD','CR','CI','HR','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FO','FJ','FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GR','GD','GL','GP','GT','GN','GW','GY','HT','VA','HN','HU','IS','IN','ID','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PL','PT','QA','RE','RO','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','KR','SS','ES','LK','SR','SE','CH','SD','SJ','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VN','WF','YE','ZM','ZW'
]);

function flag(region) {
  if (!region) return '';
  const r = String(region).toUpperCase();
  return FLAGS.get(r) || `🏳️ ${r}`;
}

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch (e) { return null; }
}

function normalizeHeaders(headers) {
  const out = {};
  Object.keys(headers || {}).forEach(k => out[k.toLowerCase()] = headers[k]);
  return out;
}

function getHeader(headers, name) {
  return normalizeHeaders(headers)[String(name).toLowerCase()];
}

function timeoutWrap(promise, ms, label) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve({ ok: false, timeout: true, error: `${label || 'request'} timeout` });
      }
    }, ms);
    promise.then((v) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(v);
      }
    }).catch((e) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ ok: false, error: String(e && e.message || e) });
      }
    });
  });
}

function httpRequest(method, options) {
  return timeoutWrap(new Promise((resolve, reject) => {
    const client = typeof $httpClient !== 'undefined' ? $httpClient : null;
    if (!client) return reject(new Error('$httpClient is unavailable in this environment'));
    const req = Object.assign({ timeout: TIMEOUT / 1000 }, options || {});
    const fn = client[String(method).toLowerCase()];
    if (typeof fn !== 'function') return reject(new Error(`$httpClient.${method} is unavailable`));
    fn(req, function(error, response, data) {
      if (error) return reject(error);
      resolve({
        ok: true,
        status: response && (response.status || response.statusCode) || 0,
        headers: response && response.headers || {},
        body: data || '',
        response
      });
    });
  }), options && options.timeoutMs || TIMEOUT, options && options.url || method);
}

function get(options) { return httpRequest('get', options); }
function post(options) { return httpRequest('post', options); }

function setResult(key, text, status, meta) {
  RESULT.items[key] = { text, status, meta: meta || {} };
}

async function testYouTubePremium() {
  const name = 'YouTube Premium';
  const res = await get({
    url: 'https://www.youtube.com/premium',
    headers: { 'User-Agent': UA_DESKTOP, 'Accept-Language': 'en-US,en;q=0.9' }
  });

  if (!res.ok) return setResult(name, 'YouTube Premium: 检测超时/失败 🚦', STATUS.TIMEOUT, { error: res.error });
  if (res.status !== 200) return setResult(name, `YouTube Premium: HTTP ${res.status} ❗️`, STATUS.ERROR, { status: res.status });

  const body = res.body || '';
  const unavailable = /Premium is not available in your country|YouTube Premium is not available in your country|not available in your country/i.test(body);
  const verifyCountry = /couldn.?t verify your country|verify your country/i.test(body);
  let region = '';
  let m = body.match(/"GL":"([A-Z]{2})"/);
  if (m) region = m[1];
  if (!region) {
    m = body.match(/countryCode["']?\s*[:=]\s*["']([A-Z]{2})["']/i);
    if (m) region = m[1];
  }
  if (!region && /www\.google\.cn/i.test(body)) region = 'CN';

  if (unavailable) {
    return setResult(name, 'YouTube Premium: 未支持 🚫', STATUS.NOT_AVAILABLE, { region });
  }
  if (verifyCountry) {
    return setResult(name, `YouTube Premium: 可访问但地区校验严格${region ? ARROW + '⟦' + flag(region) + '⟧' : ''} ⚠️`, STATUS.PARTIAL, { region });
  }
  return setResult(name, `YouTube Premium: 支持${region ? ARROW + '⟦' + flag(region) + '⟧' : ''} 🎉`, STATUS.AVAILABLE, { region });
}

async function testNetflix() {
  const name = 'Netflix';
  const filmId = '81280792';
  const res = await get({
    url: `https://www.netflix.com/title/${filmId}`,
    headers: { 'User-Agent': UA_DESKTOP, 'Accept-Language': 'en-US,en;q=0.9' }
  });

  if (!res.ok) return setResult(name, 'Netflix: 检测超时/失败 🚦', STATUS.TIMEOUT, { error: res.error });

  if (res.status === 403) {
    return setResult(name, 'Netflix: 未支持 🚫', STATUS.NOT_AVAILABLE, { status: res.status });
  }
  if (res.status === 404) {
    return setResult(name, 'Netflix: 仅支持自制剧集 ⚠️', STATUS.PARTIAL, { status: res.status });
  }
  if (res.status === 200) {
    const headers = normalizeHeaders(res.headers);
    const originating = headers['x-originating-url'] || headers['x-original-url'] || '';
    let region = '';
    let m = String(originating).match(/https?:\/\/www\.netflix\.com\/([a-z]{2})(?:-|\/)/i);
    if (m) region = m[1].toUpperCase();

    const body = res.body || '';
    if (!region) {
      m = body.match(/"requestCountry"\s*:\s*"([A-Z]{2})"/i) || body.match(/"countryCode"\s*:\s*"([A-Z]{2})"/i);
      if (m) region = m[1].toUpperCase();
    }
    return setResult(name, `Netflix: 完整支持${region ? ARROW + '⟦' + flag(region) + '⟧' : ''} 🎉`, STATUS.AVAILABLE, { status: res.status, region });
  }

  const body = res.body || '';
  if (/unavailable|proxy|vpn/i.test(body)) {
    return setResult(name, 'Netflix: 疑似未支持/被识别 🚫', STATUS.NOT_AVAILABLE, { status: res.status });
  }
  return setResult(name, `Netflix: 结果不确定 (HTTP ${res.status}) ⚠️`, STATUS.ERROR, { status: res.status });
}

async function testDisneyPlus() {
  const name = 'Disney+';
  const homepage = await get({
    url: 'https://www.disneyplus.com/',
    headers: { 'User-Agent': UA_DESKTOP, 'Accept-Language': 'en-US,en;q=0.9' }
  });

  if (!homepage.ok) return setResult(name, 'Disney+: 检测超时/失败 🚦', STATUS.TIMEOUT, { error: homepage.error });

  const body = homepage.body || '';
  if (homepage.status !== 200 || /not available in your region/i.test(body)) {
    return setResult(name, 'Disney+: 未支持 🚫', STATUS.NOT_AVAILABLE, { status: homepage.status });
  }

  let region = '';
  let m = body.match(/Region:\s*([A-Za-z]{2})[\s\S]*?CNBL:\s*([12])/i);
  let cnbl = '';
  if (m) {
    region = m[1].toUpperCase();
    cnbl = m[2];
  }

  const payload = {
    query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
    variables: {
      input: {
        applicationRuntime: 'chrome',
        attributes: {
          browserName: 'chrome',
          browserVersion: '122.0.0.0',
          manufacturer: 'apple',
          model: null,
          operatingSystem: 'macintosh',
          operatingSystemVersion: '10.15.7',
          osDeviceIds: []
        },
        deviceFamily: 'browser',
        deviceLanguage: 'en',
        deviceProfile: 'macosx'
      }
    }
  };

  const api = await post({
    url: 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',
    headers: {
      'User-Agent': UA_DESKTOP,
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
      'Authorization': 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84'
    },
    body: JSON.stringify(payload)
  });

  if (!api.ok) {
    if (cnbl === '1' || cnbl === '2') {
      const suffix = region ? ARROW + '⟦' + flag(region) + '⟧' : '';
      return setResult(name, `Disney+: 首页可达，但接口校验失败${suffix} ⚠️`, STATUS.PARTIAL, { region, cnbl, error: api.error });
    }
    return setResult(name, 'Disney+: 检测失败 ❗️', STATUS.ERROR, { error: api.error });
  }

  const json = safeJsonParse(api.body);
  const sdk = json && json.extensions && json.extensions.sdk;
  const countryCode = sdk && sdk.session && sdk.session.location && sdk.session.location.countryCode;
  const inSupportedLocation = sdk && sdk.session && sdk.session.inSupportedLocation;
  if (countryCode) region = String(countryCode).toUpperCase();

  if (inSupportedLocation === false || inSupportedLocation === 'false') {
    return setResult(name, `Disney+: 即将登陆${region ? ARROW + '⟦' + flag(region) + '⟧' : ''} ⚠️`, STATUS.COMING, { region, status: api.status });
  }
  if (inSupportedLocation === true || inSupportedLocation === 'true') {
    return setResult(name, `Disney+: 支持${region ? ARROW + '⟦' + flag(region) + '⟧' : ''} 🎉`, STATUS.AVAILABLE, { region, status: api.status });
  }

  if (cnbl === '1' || cnbl === '2') {
    return setResult(name, `Disney+: 首页可达，结果不完全确定${region ? ARROW + '⟦' + flag(region) + '⟧' : ''} ⚠️`, STATUS.PARTIAL, { region, cnbl, status: api.status });
  }
  return setResult(name, 'Disney+: 未支持或检测异常 🚫', STATUS.NOT_AVAILABLE, { region, status: api.status });
}

async function testDAZN() {
  const name = 'DAZN';
  const res = await post({
    url: 'https://startup.core.indazn.com/misl/v5/Startup',
    headers: {
      'User-Agent': UA_WIN,
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    body: JSON.stringify({
      LandingPageKey: 'generic',
      Platform: 'web',
      PlatformAttributes: {},
      Manufacturer: '',
      PromoCode: '',
      Version: '2'
    })
  });

  if (!res.ok) return setResult(name, 'DAZN: 检测超时/失败 🚦', STATUS.TIMEOUT, { error: res.error });
  if (res.status !== 200) return setResult(name, `DAZN: HTTP ${res.status} ❗️`, STATUS.ERROR, { status: res.status });

  const body = res.body || '';
  let m = body.match(/"GeolocatedCountry":"([A-Z]{2})"/i);
  const region = m ? m[1].toUpperCase() : '';
  const unavailable = /not available in this country|unsupported region|geo/i.test(body) && !region;

  if (region) {
    return setResult(name, `DAZN: 支持${ARROW}⟦${flag(region)}⟧ 🎉`, STATUS.AVAILABLE, { region });
  }
  if (unavailable) {
    return setResult(name, 'DAZN: 未支持 🚫', STATUS.NOT_AVAILABLE, {});
  }
  return setResult(name, 'DAZN: 结果不确定 ⚠️', STATUS.PARTIAL, { status: res.status });
}

async function testParamountPlus() {
  const name = 'Paramount+';
  const res = await get({
    url: 'https://www.paramountplus.com/',
    headers: { 'User-Agent': UA_DESKTOP, 'Accept-Language': 'en-US,en;q=0.9' }
  });

  if (!res.ok) return setResult(name, 'Paramount+: 检测超时/失败 🚦', STATUS.TIMEOUT, { error: res.error });

  const location = getHeader(res.headers, 'location') || '';
  const body = res.body || '';
  const lowerLoc = String(location).toLowerCase();
  const lowerBody = String(body).toLowerCase();

  if (res.status === 200) {
    if (/not available|outside your country|geo/i.test(lowerBody)) {
      return setResult(name, 'Paramount+: 未支持 🚫', STATUS.NOT_AVAILABLE, { status: res.status });
    }
    let region = '';
    let m = String(location).match(/paramountplus\.com\/(?:([a-z]{2})|([a-z]{2}-[a-z]{2}))/i);
    if (m) region = (m[1] || m[2] || '').slice(0,2).toUpperCase();
    return setResult(name, `Paramount+: 支持${region ? ARROW + '⟦' + flag(region) + '⟧' : ''} 🎉`, STATUS.AVAILABLE, { status: res.status, region });
  }

  if (res.status >= 300 && res.status < 400) {
    if (/\/intl\//.test(lowerLoc) || /not-available|unsupported|outside/i.test(lowerLoc)) {
      return setResult(name, 'Paramount+: 未支持 🚫', STATUS.NOT_AVAILABLE, { status: res.status, location });
    }
    return setResult(name, 'Paramount+: 可访问但存在地区跳转 ⚠️', STATUS.PARTIAL, { status: res.status, location });
  }

  return setResult(name, `Paramount+: 结果不确定 (HTTP ${res.status}) ⚠️`, STATUS.ERROR, { status: res.status, location });
}

async function testDiscoveryPlus() {
  const name = 'Discovery+';
  const tokenRes = await get({
    url: 'https://us1-prod-direct.discoveryplus.com/token?deviceId=d1a4a5d25212400d1e6985984604d740&realm=go&shortlived=true',
    headers: { 'User-Agent': UA_WIN, 'Accept-Language': 'en-US,en;q=0.9' }
  });

  if (!tokenRes.ok) return setResult(name, 'Discovery+: 检测超时/失败 🚦', STATUS.TIMEOUT, { error: tokenRes.error });
  if (tokenRes.status !== 200) return setResult(name, `Discovery+: Token 获取失败 (HTTP ${tokenRes.status}) ❗️`, STATUS.ERROR, { status: tokenRes.status });

  const tokenJson = safeJsonParse(tokenRes.body);
  const token = tokenJson && tokenJson.data && tokenJson.data.attributes && tokenJson.data.attributes.token;
  if (!token) {
    return setResult(name, 'Discovery+: Token 解析失败 ❗️', STATUS.ERROR, { status: tokenRes.status });
  }

  const meRes = await get({
    url: 'https://us1-prod-direct.discoveryplus.com/users/me',
    headers: {
      'User-Agent': UA_WIN,
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': `st=${token}`
    }
  });

  if (!meRes.ok) return setResult(name, 'Discovery+: 二次校验失败 🚦', STATUS.TIMEOUT, { error: meRes.error });
  if (meRes.status !== 200) {
    if (meRes.status === 401 || meRes.status === 403) {
      return setResult(name, 'Discovery+: 未支持 / 访问受限 🚫', STATUS.NOT_AVAILABLE, { status: meRes.status });
    }
    return setResult(name, `Discovery+: HTTP ${meRes.status} ❗️`, STATUS.ERROR, { status: meRes.status });
  }

  const meJson = safeJsonParse(meRes.body);
  const territory = meJson && meJson.data && meJson.data.attributes && meJson.data.attributes.currentLocationTerritory;
  if (territory) {
    const region = String(territory).toUpperCase();
    return setResult(name, `Discovery+: 支持${ARROW}⟦${flag(region)}⟧ 🎉`, STATUS.AVAILABLE, { region });
  }
  return setResult(name, 'Discovery+: 结果不确定 ⚠️', STATUS.PARTIAL, { status: meRes.status });
}

async function testChatGPT() {
  const name = 'ChatGPT';
  const traceRes = await get({
    url: 'https://chatgpt.com/cdn-cgi/trace',
    headers: { 'User-Agent': UA_DESKTOP, 'Accept-Language': 'en-US,en;q=0.9' }
  });

  let region = '';
  if (traceRes.ok && traceRes.status === 200) {
    const m = String(traceRes.body || '').match(/(?:^|\n)loc=([A-Z]{2})(?:\n|$)/);
    if (m) region = m[1].toUpperCase();
  }

  const webRes = await get({
    url: 'https://chatgpt.com/',
    headers: { 'User-Agent': UA_DESKTOP, 'Accept-Language': 'en-US,en;q=0.9' }
  });

  if (!traceRes.ok && !webRes.ok) {
    return setResult(name, 'ChatGPT: 检测超时/失败 🚦', STATUS.TIMEOUT, { traceError: traceRes.error, webError: webRes.error });
  }

  const webBody = webRes.ok ? String(webRes.body || '') : '';
  const blocked = /unsupported country|not available in your country|access denied|you do not have access/i.test(webBody);
  const supportedByOfficial = region ? OPENAI_SUPPORTED.has(region) : null;

  if (blocked) {
    return setResult(name, `ChatGPT: 未支持${region ? ARROW + '⟦' + flag(region) + '⟧' : ''} 🚫`, STATUS.NOT_AVAILABLE, { region, supportedByOfficial, webStatus: webRes.status });
  }
  if (region && supportedByOfficial === false) {
    return setResult(name, `ChatGPT: 官方不支持该地区${ARROW}⟦${flag(region)}⟧ 🚫`, STATUS.NOT_AVAILABLE, { region, supportedByOfficial });
  }
  if (webRes.ok && webRes.status === 200) {
    return setResult(name, `ChatGPT: 支持${region ? ARROW + '⟦' + flag(region) + '⟧' : ''} 🎉`, STATUS.AVAILABLE, { region, supportedByOfficial, webStatus: webRes.status });
  }
  if (region && supportedByOfficial === true) {
    return setResult(name, `ChatGPT: 地区受支持，但网页探测异常${ARROW}⟦${flag(region)}⟧ ⚠️`, STATUS.PARTIAL, { region, supportedByOfficial, webStatus: webRes.status });
  }
  return setResult(name, 'ChatGPT: 结果不确定 ⚠️', STATUS.PARTIAL, { region, supportedByOfficial, webStatus: webRes.status });
}

function formatReport() {
  const order = ['YouTube Premium', 'Netflix', 'Disney+', 'DAZN', 'Paramount+', 'Discovery+', 'ChatGPT'];
  const lines = order.map(k => (RESULT.items[k] && RESULT.items[k].text) || `${k}: 未执行`);
  return [
    RESULT.title,
    '——————————————',
    ...lines,
    '——————————————',
    `Version: ${VERSION}`
  ].join('\n');
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatHtmlReport() {
  const order = ['YouTube Premium', 'Netflix', 'Disney+', 'DAZN', 'Paramount+', 'Discovery+', 'ChatGPT'];
  const lines = order.map(k => (RESULT.items[k] && RESULT.items[k].text) || `${k}: 未执行`);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(RESULT.title)}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica, Arial, sans-serif; background:#0f1115; color:#e8eaed; padding:20px; line-height:1.65; }
.card { max-width: 820px; margin: 0 auto; background:#171a21; border:1px solid #2a2f3a; border-radius:16px; padding:20px; box-shadow: 0 10px 30px rgba(0,0,0,.25); }
h1 { font-size: 22px; margin:0 0 12px; }
.pre { white-space: pre-wrap; font-size: 15px; }
.tip { color:#9aa4b2; font-size: 13px; margin-top: 16px; }
code { background:#0f1115; padding:2px 6px; border-radius:6px; }
</style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(RESULT.title)}</h1>
    <div class="pre">${escapeHtml(lines.join('\n\n'))}</div>
    <div class="tip">Version: ${escapeHtml(VERSION)}<br>如果你是通过 Shadowrocket 触发本页，重新打开 <code>https://media-check.shadowrocket/test</code> 即可再次检测。</div>
  </div>
</body>
</html>`;
}

function notify(title, subtitle, message) {
  if (typeof $notification !== 'undefined' && $notification.post) {
    $notification.post(title, subtitle || '', message || '');
  }
}

async function runAllChecks() {
  const tasks = [
    testYouTubePremium(),
    testNetflix(),
    testDisneyPlus(),
    testDAZN(),
    testParamountPlus(),
    testDiscoveryPlus(),
    testChatGPT()
  ];
  await Promise.all(tasks.map(p => Promise.resolve(p).catch(e => e)));
}

async function main() {
  await runAllChecks();
  const report = formatReport();

  if (typeof $request !== 'undefined' && $request && $request.url) {
    notify(RESULT.title, '检测完成', report);
    return $done({
      response: {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        },
        body: formatHtmlReport()
      }
    });
  }

  notify(RESULT.title, '检测完成', report);
  $done({ title: RESULT.title, content: report });
}

main().catch((e) => {
  const msg = `脚本异常: ${String(e && e.stack || e)}`;
  notify(RESULT.title, '检测异常', msg);
  if (typeof $request !== 'undefined' && $request && $request.url) {
    return $done({
      response: {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: msg
      }
    });
  }
  $done({ title: RESULT.title, content: msg });
});
