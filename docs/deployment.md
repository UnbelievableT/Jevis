# Jevis.xyz 与桌面发布

## 官网

已准备 apps/web，canonical 与社交图地址为 https://jevis.xyz。构建命令 `pnpm --filter @jevis/web build`，前提先运行根目录 `pnpm assets:sync`。产物为 apps/web/dist。

本次未部署，也未改 DNS。之后可将静态产物发布到选定托管平台，绑定 apex 域名 Jevis.xyz、配置 HTTPS，再决定 www 重定向。不得把 .jevis、deps、node_modules、模型 key 或本地 API 暴露到静态站点。

官网“项目进展”明确说明当前是框架，没有不存在的下载包或虚构收益。

## 桌面

当前 Tauri 壳提供 UI，尚未包含 daemon sidecar、安装后启动、凭据库、自动升级和签名公证。图标由生成模型 Logo 经 Tauri 工具派生为平台所需格式。

完整发行需锁定并打包 Node 运行时、声明外部二进制、检查平台沙箱和 SDK、建立升级/回滚与数据库迁移。Windows、macOS、Linux 应分别打包和验收；本机编译检查不能证明跨平台发布成功。

## 手机

apps/mobile 提供响应式页面和 manifest；未注册离线 Service Worker，未实现远程配对。这样当前不会缓存旧审批或在恢复网络时重放动作。完整 PWA 需要明确离线只读语义、设备授权、TLS、通知与撤销。

## 发布材料

保留依赖 LICENSE/NOTICE、品牌素材提示词、兼容矩阵、检查证据、版本说明和真实能力状态。提供方订阅或登录能否供第三方产品使用，需按各通道支持的方式实现，不从公开 SDK 推导出无限制分发授权。
