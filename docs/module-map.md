# 模块契约与依赖

所有模块共同组成完整交付范围。这里的状态只描述本次框架落地情况。

| 路径                  | 职责         | 当前产物                                             |
| --------------------- | ------------ | ---------------------------------------------------- |
| apps/desktop          | 原生工作台   | Tauri 配置、React 工作台、任务图、事件和连接 UI      |
| apps/web              | 官网         | 品牌首页、工作方式、架构与项目进展                   |
| apps/mobile           | 手机入口     | 复用响应式工作台与 Web App manifest                  |
| apps/daemon           | 唯一控制服务 | 认证 API、演示命令、SSE、SQLite 生命周期             |
| apps/cli              | 命令行       | 创建/查询/控制演示任务                               |
| apps/mcp              | 外部工具入口 | 只读 list/get 两个工具                               |
| packages/contracts    | 外部契约     | Zod 请求校验、Task/Unit/Checkpoint/Judge/Runner 类型 |
| packages/core         | 确定性状态   | 生命周期、DAG 校验、演示执行和上下文基础选择         |
| packages/planner      | 规格与修订   | Spec Schema、Planner 与失效单元契约                  |
| packages/scheduler    | 调度         | 演示供给映射、生产调度接口                           |
| packages/context      | 上下文       | 有预算的选择函数、检索/视图/构建器接口               |
| packages/judge        | 结构化判断   | Choice/Score/Noul 分型、问题包、未配置明确失败       |
| packages/adapters     | 提供方接入   | 供给注册表、适配器注册、未接入适配器                 |
| packages/runners      | 执行与恢复   | 租约、fencing token、checkpoint/resume 契约          |
| packages/tools        | 副作用网关   | 操作请求、回执、对账接口                             |
| packages/sandbox      | OS 隔离      | 驱动契约与默认拒绝实现                               |
| packages/security     | 策略边界     | 路径/符号链接预检、未知副作用禁止盲重试              |
| packages/workspaces   | 仓库生命周期 | 基线快照、租约和工作区驱动接口                       |
| packages/verification | 验收         | 版本匹配、独立证据、通过/拒绝/不足判定               |
| packages/budget       | 额度         | 内存演示预留/结算；生产持久共享账本尚待实现          |
| packages/storage      | 持久化       | SQLite WAL、原子命令/事件、幂等、CAS                 |
| packages/experience   | 经验策略     | 本地经验、策略提案、影子评估契约                     |
| packages/evals        | 效果验证     | 合格率/合格交付成本基础聚合                          |
| packages/telemetry    | 可观测性     | 结构化敏感键脱敏辅助函数                             |
| packages/config       | 配置         | 本地模式 Schema、品牌常量                            |
| packages/client       | API 消费     | UI、CLI、MCP 共用的类型化客户端                      |
| packages/ui           | 共用界面     | 品牌组件、工作台、主题和响应式布局                   |

v3 中的 quota 对应 budget，learning 对应 experience，workspace 对应 workspaces，remote 对应 mobile；增加 web、mcp、client、telemetry、config 以清晰划分入口和基础设施。

## 接入规范

- 适配器报告 enforced / unsupported / unverified，不能只靠提示词声称控制了模型、子 Agent 或权限。
- Runner 只输出证据和执行结果，由核心控制状态。
- Judge 的 Noul 只有概率，没有独立 confidence；分数阈值由版本化问题包与数据标定。
- Context 筛选可以返回 omitted 引用，不能删除原证据；required 超预算必须显式报错。
- 验收基于当前规格版本的独立证据；模型自评与演示完成标记不构成真实验收。
- 同一配额池下的不同供给共享预留与结算，真实账本必须同调度事务协作。
- 运行时模块只通过契约协作，不跨模块访问数据库内部对象。
- 原始日志、提示词和提供方响应默认不写遥测；通用 redact 不能代替数据分类。

这些约束用于后续实现一致性，不能被理解成当前已完成沙箱、真实计费或恢复。
