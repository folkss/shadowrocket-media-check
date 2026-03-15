# 手机浏览器检测页方案（最终版）

## 结论
纯静态网页无法稳定自动检测这些跨域站点，因此本方案采用：

- **前端检测页**：GitHub Pages 托管
- **轻量后端**：Cloudflare Worker 托管

这样你在 iPhone 上：
1. 切好 Shadowrocket 节点
2. 打开检测页
3. 点开始检测
4. 检测结果即为当前节点出口能力

---

## 文件

- `web/index.html`：前端页面
- `worker/index.js`：Cloudflare Worker 后端
- `worker/wrangler.toml`：Worker 配置

---

## 部署步骤

### 一、部署 Worker（后端）

最简单：把 `worker/index.js` 部署到 Cloudflare Workers。

如果你本机有 Node：

```bash
npm install -g wrangler
cd worker
wrangler login
wrangler deploy
```

部署成功后会得到一个地址，例如：

```text
https://media-unlock-check.xxx.workers.dev/check
```

### 二、启用 GitHub Pages（前端）

仓库里已经有 `web/index.html`。

你可以：
- 直接把 `web/index.html` 挪到仓库根目录作为 `index.html`
- 或在 GitHub Pages 设置里指向对应目录（如果你用 Actions / Pages 工作流）

启用后得到前端地址，例如：

```text
https://folkss.github.io/shadowrocket-media-check/
```

### 三、组合最终访问地址

把 Worker 地址作为 `api` 参数传给前端页面：

```text
https://folkss.github.io/shadowrocket-media-check/?api=https://media-unlock-check.xxx.workers.dev/check
```

注意：`api=` 后面的 URL 需要做 URL 编码，更稳。

示例：

```text
https://folkss.github.io/shadowrocket-media-check/?api=https%3A%2F%2Fmedia-unlock-check.xxx.workers.dev%2Fcheck
```

---

## 使用方法

1. iPhone 上切好 Shadowrocket 节点
2. 打开前端检测页（如果你已经把根目录 `index.html` 发布到 GitHub Pages，则可直接打开 Pages 地址）
3. 点“开始检测”
4. 查看结果

### 当前已部署的 Worker

```text
https://media-unlock-check.amdceo.workers.dev/check
```

如果前端默认已经写入这个地址，则无需再手动拼 `?api=` 参数。

---

## 为什么这版能成立

因为：
- 真正去请求 Netflix / Disney+ / ChatGPT 等站点的是 **Worker 后端**
- 后端请求不会被浏览器 CORS 限制卡死
- 而你手机当前访问 Worker 时走的是当前 Shadowrocket 节点，因此检测反映的是你当前代理出口

---

## 备注

- 如果某些平台未来改接口，需要更新 `worker/index.js`
- 这版比 Shadowrocket 内脚本主动巡检更稳定，也更容易维护
