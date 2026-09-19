# Jevis.xyz 与桌面发布

## 官网

已准备 apps/web，canonical 与社交图地址为 https://jevis.xyz。构建命令 `pnpm --filter @jevis/web build`，前提先运行根目录 `pnpm assets:sync`。产物为 apps/web/dist。

官网已于 2026-09-19 发布到 [https://jevis.xyz](https://jevis.xyz)，Vercel 项目为 `starkdylans-projects/jevis`。GitHub 仓库 [UnbelievableT/Jevis](https://github.com/UnbelievableT/Jevis) 已连接 Vercel，生产分支为 main。

Cloudflare 管理 DNS，保留原 nameservers。新增两条 DNS-only CNAME：`@` 与 `www` 均指向 Vercel 本项目建议的 `99c47fc653dcec01.vercel-dns-017.com`。根域名通过 Cloudflare flattening 解析。目标是本次配置结果，后续按 Vercel 的实时建议更新，不当作其他项目通用值。

HTTPS 主页与 `/docs` 已返回 200；`www.jevis.xyz/docs` 以 308 跳转到 `https://jevis.xyz/docs`。`vercel.json` 保存构建命令、输出目录、文档重写、安全响应头和 www 重定向。Node 固定 24.x。`.vercel`、`.env*` 与本地凭据不提交；部署包排除 `.jevis`、deps 源码与构建缓存。静态站点没有模型 key，也不发布本地 API。

发布复现：先 `pnpm check`，确认 GitHub CI 通过，再推送 main 由 Vercel 构建。必要时可在已链接的项目目录运行 `vercel --prod --scope starkdylans-projects`。通过 Vercel 历史部署回滚；DNS 无需跟着每次版本发布修改。

官网“项目进展”明确说明当前是框架，没有不存在的下载包或虚构收益。

## 桌面

当前 Tauri 壳提供 UI，尚未包含 daemon sidecar、安装后启动、凭据库、自动升级和签名公证。图标由生成模型 Logo 经 Tauri 工具派生为平台所需格式。

完整发行需锁定并打包 Node 运行时、声明外部二进制、检查平台沙箱和 SDK、建立升级/回滚与数据库迁移。Windows、macOS、Linux 应分别打包和验收；本机编译检查不能证明跨平台发布成功。

## 手机

apps/mobile 提供响应式页面和 manifest；未注册离线 Service Worker，未实现远程配对。这样当前不会缓存旧审批或在恢复网络时重放动作。完整 PWA 需要明确离线只读语义、设备授权、TLS、通知与撤销。

## 发布材料

保留依赖 LICENSE/NOTICE、品牌素材提示词、兼容矩阵、检查证据、版本说明和真实能力状态。提供方订阅或登录能否供第三方产品使用，需按各通道支持的方式实现，不从公开 SDK 推导出无限制分发授权。
