# 节点解锁检测

纯前端流媒体 / AI 服务可达性检测页。

## 原理

所有请求由浏览器直接发出，走你当前的代理线路。没有后端、没有 Cloudflare Worker——浏览器就是检测器。

## 能检测什么

| 项目 | 准确度 | 说明 |
|------|--------|------|
| 出口 IP / 国家 / ISP / ASN | ✅ 准确 | 通过 ip-api.com（支持 CORS） |
| 机房 IP vs 住宅 IP | ✅ 准确 | ip-api.com hosting 字段 |
| ChatGPT 可用性 + 地区 | ✅ 准确 | 读 Cloudflare trace，对照封禁名单 |
| Netflix / Disney+ / YouTube 等可达性 | ⚠️ 粗判断 | 能区分"通 / 不通"，无法区分"完整解锁 vs 仅自制" |

> ⚠️ 受浏览器跨域（CORS）限制，无法像服务端脚本那样读取 Netflix 等站点的响应详情。如需精确解锁判断，需在节点服务器上运行 [RegionRestrictionCheck](https://github.com/lmc999/RegionRestrictionCheck) 等脚本。

## 使用方法

1. 手机切好代理节点
2. 打开检测页：`https://folkss.github.io/shadowrocket-media-check/`
3. 点「开始检测」
4. 查看结果

## 部署

纯静态文件，GitHub Pages 直接托管即可。仓库根目录的 `index.html` 就是检测页。

## 文件

- `index.html`：检测页（GitHub Pages 入口）
- `web/index.html`：同上（副本）
- `media_unlock_check_sr.js`：Shadowrocket 脚本版（独立方案，与网页版无关）
- `media_unlock_check_shadowrocket.sgmodule`：Shadowrocket 模块配置
- `media_unlock_check.conf`：Shadowrocket 规则配置
