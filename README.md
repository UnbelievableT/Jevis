# Jevis

**把模型，组织成团队。**  
Many minds. One direction. · [Jevis.xyz](https://jevis.xyz)

Jevis 是本地优先的多模型工作流产品：强模型承担高杠杆工作，合适的模型执行有边界的任务，Jev 等判断模型提供细粒度信号，确定性代码管理权限、预算、状态和验收。

> 当前交付：整体工程框架、品牌资产、官网、桌面/移动界面、本地演示闭环与技术文档。已增加 Jev SDK 适配层与持久化预算/租约基础模块；真实编码执行、调度接入、生产级恢复和效果评测仍待实现。功能完整范围没有缩减，也不划分 MVP 或优先级。

## 启动

需要 **Node.js 24**、**pnpm 10.10.0**。原生桌面还需要 Rust 和平台构建工具。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

| 入口           | 地址                         |
| -------------- | ---------------------------- |
| 工作台         | http://127.0.0.1:5173        |
| 官网预览       | http://127.0.0.1:5174        |
| 移动控制台预览 | http://127.0.0.1:5175        |
| 本地 API       | http://127.0.0.1:4317/api/v1 |

服务首次启动会生成 `.jevis/token`。在自己的终端查看此文件，将内容粘贴到工作台“连接本地服务”；令牌不应提交或分享。UI 将其保存在当前浏览器标签页的 sessionStorage。创建演示工作流，依次启动、模拟推进、暂停/继续、模拟验收。数据保存在 `.jevis/jevis.sqlite`。

官网使用 Vercel 部署，Cloudflare 管理 DNS；具体发布结果见 [发布说明](docs/deployment.md)。移动端是响应式控制台和 manifest 骨架，目前仅用于本机预览；远程配对、TLS、设备撤销和离线策略尚未实现。

## 工程结构

```text
apps/
  desktop/     Tauri 2 + React 工作台
  web/         Jevis.xyz 官网
  mobile/      移动控制台 / PWA 基础入口
  daemon/      Node.js 本地 HTTP + SSE 服务
  cli/         本地命令行
  mcp/         只读 MCP 入口
packages/
  contracts/ core/ planner/ scheduler/ context/ judge/
  adapters/ runners/ tools/ sandbox/ security/ workspaces/
  verification/ budget/ storage/ experience/ evals/
  telemetry/ config/ client/ ui/
assets/brand/  图片生成模型创作的品牌资产和提示词
packs/        工作流及问题包参考
deps/         锁定提交的上游源码参考库
docs/         完整文档、状态和检查证据
tests/        框架行为与边界测试
```

当前共有 6 个应用、21 个内部包。内部包以 TypeScript 源码参与 Monorepo 构建，不是单独发布的 npm 产品。

## 常用命令

```bash
pnpm check                 # 类型、行为测试、全部 JS/前端构建
pnpm cli list
pnpm cli create "检查 Jevis 框架"
pnpm cli help
pnpm deps:verify           # 核对上游源码与 lock
pnpm deps:fetch            # 补全缺失源码；保留已有修改；不自动升级
pnpm icons:generate        # 从生成模型的 Logo 制作平台图标
pnpm desktop:dev           # Tauri 原生窗口；另一个终端先 pnpm daemon
pnpm desktop:build         # 本机平台打包；不等于签名发行
```

详细说明见 [开发指南](docs/development.md)。`pnpm dev` 已占用工作台端口时，不要同时启动 `desktop:dev`。

## 文档入口

- [当前实现状态与交付边界](docs/status.md)
- [Jev、持久化预算与租约实现](docs/runtime-foundations.md)
- [产品定义、用户收益与验证口径](docs/product.md)
- [完整技术方案 v3](docs/technical-spec-v3.md)
- [架构与状态数据流](docs/architecture.md)
- [模块契约及依赖关系](docs/module-map.md)
- [HTTP、SSE、CLI、MCP 接口](docs/api.md)
- [开发、构建和本地排错](docs/development.md)
- [上游项目及使用边界](docs/open-source.md)
- [安全与执行边界](docs/security.md)
- [品牌、配图和使用规范](docs/brand.md)
- [验收与评测设计](docs/acceptance.md)
- [架构决策记录](docs/decisions.md)
- [Jevis.xyz 与桌面发布说明](docs/deployment.md)

## 依赖与许可证

`pnpm-lock.yaml` 锁定实际 JS 依赖；`apps/desktop/src-tauri/Cargo.lock` 锁定 Rust 依赖；`deps/lock.json` 锁定上游源码。三者用途不同。

上游源码下载后未执行其安装脚本，也不直接参与 Jevis 构建。Claude Agent SDK 的公开源码使用商业条款，单独标注，不能归类为 MIT/Apache 开源软件。混合许可证项目按文件范围处理。Jevis 自有代码尚未对外指定开源许可证，工作区包均为 private；第三方的授权保持不变。
