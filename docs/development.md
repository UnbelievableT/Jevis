# 开发与运行

## 环境与安装

Node.js 24、pnpm 10.10.0；Rust 原生检查在本机 1.91.1 验证。使用仓库 .nvmrc 切换 Node。不要用全局 Node 23 绕过 engine-strict。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

dev 启动 daemon、工作台、官网和移动预览四个进程。任一入口失败将停止此启动器管理的进程。端口固定，冲突会明确失败。停止终端即可关闭开发服务；数据保留。

数据默认在**启动命令的当前目录**下 .jevis。根脚本从项目根运行。JEVIS_DATA_DIR 可设绝对路径。环境变量需要在 shell/进程中设置；.env.example 是说明模板，目前没有自动 dotenv 加载。

## 原生桌面

先在终端 A 执行 `pnpm daemon`，再在终端 B 执行 `pnpm desktop:dev`。此命令生成图片派生的平台图标，然后由 Tauri 启动工作台 Vite。不要同时运行已占用 5173 的 pnpm dev。

`pnpm desktop:build` 先同步品牌资源、生成图标、构建本机 Tauri 包。当前壳没有打包 Node sidecar，也不会自动启动后台服务；仍依赖独立 daemon。系统签名、公证、升级和平台沙箱属于完整产品待实现项。

仅做 Rust 校验：

```bash
pnpm assets:sync
pnpm icons:generate
cargo check --locked --manifest-path apps/desktop/src-tauri/Cargo.toml
```

## 验证与构建

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm deps:verify
```

构建输出：三个前端分别在 apps/<app>/dist，服务端在 dist/daemon/src/main.js，CLI 在 dist/cli/src/main.js，MCP 在 dist/mcp/src/main.js。服务端包仍依赖工作区 node_modules；这是开发构建，不是独立发行包。

## 上游源码

`pnpm deps:fetch` 并发下载清单仓库，保留其许可证与 git 信息。已有 lock 时新下载会取锁定提交。已有 checkout 如果提交偏移或含受跟踪文件改动，命令报错并保留现场。不会替你 pull、reset 或安装上游依赖。

源码快照使用浅克隆节省空间。要研究历史可在明确需要时对单个仓库 fetch 历史，不改变锁文件。提交到 Jevis 的是 manifest 和 lock，不是 deps 中的整个源码树。

## 常见情况

- 无法连接：先查看 /api/v1/health，再确认令牌来自同一 JEVIS_DATA_DIR；页面支持重新填写。
- 修订冲突：刷新任务后重做用户意图；不要强制覆盖 revision。
- 事件未出现：UI 约两秒轮询；JSON 超过 1000 条要按游标继续。
- 页面刷新：令牌当前标签页会话保留；服务重启后任务和事件仍从 SQLite 读取。
- 模型“未接入”：预期行为。仅设置 API key 不会自动启用未实现的适配器。
- 手机不能远程访问：预期行为。当前只有本机预览，未开放 LAN 监听。
- SQLite：当前依赖 Node 内置 node:sqlite；这是已锁定 Node 24 的选择，接口仍需随运行时版本验证。

## 工程约束

不要把 deps 当 workspace package 自动打包。不要从 demo 数据生成节省比例。不要向 renderer 注入系统密钥。新增原生能力必须有明确权限与实际平台测试。
