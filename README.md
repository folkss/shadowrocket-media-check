# Media Unlock Check (Shadowrocket / Surge 风格重写版)

## 文件

- `media_unlock_check_sr.js`：主脚本
- `media_unlock_check_shadowrocket.sgmodule`：示例模块骨架

## 检测平台

- YouTube Premium
- Netflix
- Disney+
- DAZN
- Paramount+
- Discovery+
- ChatGPT

## 设计原则

- 不再依赖 Quantumult X 的 `event-interaction` / `$environment.params` / `htmlMessage`
- 以手机端脚本环境友好的 `Surge / Shadowrocket` 风格重写
- 尽量采用多信号判定，减少单一文案匹配误判
- 对有官方支持地区列表的平台（如 YouTube / OpenAI）优先参考官方规则

## 使用说明

### 1. 托管脚本
先把 `media_unlock_check_sr.js` 放到你自己的可直链地址：

- GitHub raw
- jsDelivr
- 自己的静态托管
- 其他能被 Shadowrocket 直接下载的 HTTPS 链接

### 2. 修改模块文件
把 `media_unlock_check_shadowrocket.sgmodule` 里的：

`https://example.com/media_unlock_check_sr.js`

替换成你的真实脚本地址。

### 3. 导入模块
把 `.sgmodule` 导入 Shadowrocket（或兼容工具）中。

### 4. 手动执行
在支持手动运行脚本的入口执行该脚本。

> 说明：不同客户端的“手动执行 generic script”的入口位置可能不同。
> 如果你的 Shadowrocket 当前版本对 `type=generic` 的入口或展示方式有差异，需要按实际界面微调模块配置。

## 判定说明

### Netflix
- `完整支持`：目标 title 返回 200
- `仅支持自制剧集`：目标 title 返回 404
- `未支持`：返回 403 或明显区域限制信号

### Disney+
- 首页可达 + BAMGrid 设备注册接口返回 `inSupportedLocation`
- `false` 视为即将登陆 / 不完整支持
- `true` 视为支持

### ChatGPT
- 优先检测 `chatgpt.com/cdn-cgi/trace`
- 结合 OpenAI 官方支持国家列表进行判定
- 再用 `chatgpt.com` 主站访问结果交叉验证

### YouTube Premium
- 检测 `/premium`
- 结合页面地区信号与官方支持地区思路

## 已知限制

- 某些平台接口将来可能继续变更，需要后续维护
- Discovery+ / Paramount+ 的公开稳定检测面本来就比 Netflix / OpenAI 弱
- 不同客户端对脚本类型、通知展示、手动运行入口支持程度略有差异
- 此脚本尽量兼容 Shadowrocket / Surge 风格，但未沿用 Quantumult X 专属交互 UI

## 建议

如果你后续要长期用，建议再做两步：

1. 加一个简易版本号和 changelog
2. 单独为每个平台留一个“备用检测分支”

这样后面某个平台接口失效时，不用整体重写。
