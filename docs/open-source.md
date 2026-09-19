# 上游源码与复用方案

核对日期：2026-09-19。共 21 个源码仓库，实际 SHA 以 [lock](../deps/lock.json) 为准。浅克隆保留 Git 与许可证信息，源码不参与 Jevis workspace 构建。

| 仓库                                                                                  | 锁定提交       | 用途                   | 授权提示                                                   |
| ------------------------------------------------------------------------------------- | -------------- | ---------------------- | ---------------------------------------------------------- |
| [pi](https://github.com/earendil-works/pi)                                            | `36b60d2e8985` | inference              | MIT                                                        |
| [codex](https://github.com/openai/codex)                                              | `78245b47af2a` | adapter                | Apache-2.0                                                 |
| [claude-agent-sdk](https://github.com/anthropics/claude-agent-sdk-typescript)         | `18661edde449` | adapter                | Anthropic Commercial Terms; not an OSI open-source license |
| [jev-router](https://github.com/BillionsBobby/JevRouter)                              | `affd9ba4e58c` | reference              | MIT                                                        |
| [sandbox-runtime](https://github.com/anthropics/sandbox-runtime)                      | `6fa731368807` | sandbox                | Apache-2.0                                                 |
| [xstate](https://github.com/statelyai/xstate)                                         | `fbee62e7c158` | state                  | MIT                                                        |
| [xyflow](https://github.com/xyflow/xyflow)                                            | `0a1f9575b256` | ui                     | MIT                                                        |
| [ccusage](https://github.com/ccusage/ccusage)                                         | `8f7035c546b3` | usage                  | MIT (apps/ccusage/LICENSE)                                 |
| [promptfoo](https://github.com/promptfoo/promptfoo)                                   | `32b79fd98a4c` | evaluation             | MIT core; inspect enterprise portions                      |
| [codex-monitor](https://github.com/Dimillian/CodexMonitor)                            | `dd61b9abd37d` | reference              | MIT                                                        |
| [vibe-kanban](https://github.com/BloopAI/vibe-kanban)                                 | `d5cbb5380fa0` | reference              | Apache-2.0                                                 |
| [opencode](https://github.com/anomalyco/opencode)                                     | `ae93d4afb3e4` | reference              | MIT                                                        |
| [openclaw](https://github.com/openclaw/openclaw)                                      | `26c8cd22713f` | optional-integration   | MIT + notices                                              |
| [agent-client-protocol](https://github.com/agentclientprotocol/agent-client-protocol) | `8587a6d198b6` | protocol               | Apache-2.0                                                 |
| [tauri](https://github.com/tauri-apps/tauri)                                          | `d8d02ba60c04` | desktop                | MIT OR Apache-2.0                                          |
| [langfuse](https://github.com/langfuse/langfuse)                                      | `ef0add7b2598` | optional-observability | MIT outside ee; mixed                                      |
| [typesafe-sdk-js](https://github.com/typesafe-ai/typesafe-sdk-js)                     | `66880ccded6c` | judge                  | MIT (verify checkout LICENSE)                              |
| [typesafe-sdk-python](https://github.com/typesafe-ai/typesafe-sdk-python)             | `2ce5c65f1364` | evaluation             | MIT (verify checkout LICENSE)                              |
| [typesafe-skills](https://github.com/typesafe-ai/skills)                              | `65a39f393687` | reference              | MIT (verify checkout LICENSE)                              |
| [system-one-adapter-python](https://github.com/typesafe-ai/system-one-adapter-python) | `adffc2eab300` | reference              | MIT (verify checkout LICENSE)                              |
| [mcp-typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)          | `603217008710` | protocol               | Apache-2.0 / retained MIT; docs CC-BY-4.0                  |

## 组合方式

实际运行依赖已使用 React、Tauri、XState、React Flow、Lucide、Zod、MCP SDK 与字体/构建工具；版本由 pnpm/Cargo 锁文件决定，不由 deps 源码目录隐式替换。

- Pi：后续用于统一推理与工具循环；Jevis 自己保留调度、权限和持久状态。Pi 无内置完整权限隔离，其 durable API 不能替代我们需要的生产恢复。
- Codex：以官方 SDK/app-server 适配，绑定可验证的版本能力。
- Claude Agent SDK：公开仓库使用 Anthropic Commercial Terms，不是 OSI 开源许可证。下载源码只为接口研究，正式接入按其支持的认证与分发条件处理。
- TypeSafe JS SDK：Jev 适配器的首选正式客户端；Python SDK 用于离线实验。官方 skills 仅保留参考，没有安装到个人 Agent。
- JevRouter：参考候选路由和决策回执。其小范围工具序列实验不是端到端代码质量证明。
- sandbox-runtime：实际隔离驱动候选；Windows 仍应按 alpha 能力验证。没有沙箱就不能启用真实工具。
- CodexMonitor：参考 Tauri/React 界面与 app-server 对接。当前快照默认分支提交较旧，不能假设协议兼容；Rust 后端不直接替换 Node daemon。
- Vibe Kanban：参考多执行器、工作区和变更审阅；原公司结束运营后保留社区源码，不能依赖原托管服务。
- OpenCode：完整编码 Agent 的执行入口或参考，采用 SolidJS；不把它与 Pi 同时作为主调度内核。
- XState：表达状态，持久化和外部操作一致性由 Jevis 实现。
- ccusage：解析用量日志，API 等价美元不表示订阅实际剩余额度。
- Promptfoo：问题包、模型回归和对照工具；完整仓库任务评测需 Jevis 自建隔离运行器。
- React Flow：任务依赖图，移动端改用可读的依赖列表。
- OpenClaw、ACP：外部宿主与协议入口，保持可选，不成为核心运行前置条件。
- Langfuse：可选观测后端。企业目录采用不同授权，不将整个仓库统一视作 MIT。
- system-one-adapter-python：替代判断后端的实验参考，不当作 Jev 等价质量保证。

## 下载与升级

`pnpm deps:fetch` 补全清单并写 lock；已有锁定版本在新机器下载时会取指定 SHA。已有 checkout 保持不动，SHA 漂移、跟踪文件修改或 origin 不一致会报错。`pnpm deps:verify` 用于检查。上游项目自己的安装脚本没有执行。

真正引入上游代码前，记录移植文件、保留 LICENSE/NOTICE、确认该文件授权、增加兼容测试并标注修改；不因为仓库首页标签就忽略 enterprise 子目录、商标或第三方依赖条款。

当前尚未产出完整发行 SBOM、递归许可证审计或真实 SDK 兼容矩阵。deps 是备用源码库，不意味着这 21 个项目全部被打包进 Jevis。
