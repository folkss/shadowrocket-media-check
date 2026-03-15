# 部署说明

## GitHub Pages

1. 仓库 Settings → Pages → Source 选 `main` 分支，目录选 `/ (root)`
2. 保存后等 1-2 分钟，访问 `https://folkss.github.io/shadowrocket-media-check/`

就这样，没有后端要部署。

## 之前的 Cloudflare Worker

已移除。之前的 Worker 方案有个根本问题：请求从 CF 边缘节点发出，流媒体看到的是 Cloudflare 的 IP 而非你代理节点的 IP，检测结果不准确。

现在改为纯前端方案，浏览器直接发请求，走你当前代理线路。
