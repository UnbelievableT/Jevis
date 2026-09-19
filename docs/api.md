# 接口说明 · Foundation v1

根地址：`http://127.0.0.1:4317/api/v1`。JSON UTF-8。除 health 外需要 `Authorization: Bearer <local-token>`。

## 已实现

| 方法 | 路径                                 | 语义                                      |
| ---- | ------------------------------------ | ----------------------------------------- |
| GET  | /health                              | 无敏感信息的版本与演示状态                |
| GET  | /tasks                               | 所有任务快照，创建顺序倒序                |
| POST | /tasks                               | 创建演示任务                              |
| GET  | /tasks/:id                           | 单任务快照                                |
| POST | /tasks/:id/commands                  | start / advance / pause / resume / cancel |
| GET  | /supplies                            | 能力注册表，明确 demo 或 not_configured   |
| GET  | /events?after=0&taskId=...           | 事件补读，单页最多 1000 条                |
| GET  | /events（Accept: text/event-stream） | SSE，支持 Last-Event-ID 或 after          |

所有 POST 需要 `Content-Type: application/json` 和 `Idempotency-Key`（8–128 位字母、数字、下划线或连字符）。相同请求重试沿用原键；新的用户意图使用新键。请求上限 64 KiB。

创建请求：

```json
{
  "title": "为项目添加设置页面",
  "goal": "演示规划、实现和验收的流转",
  "budgetUsd": 5,
  "mode": "demo"
}
```

响应为 `{ "task": Task }`。预算是用户设置，actualCostUsd 为 null；不能把 null 换成 0 作为实测费用。

命令请求：

```json
{ "action": "start", "expectedRevision": 0 }
```

响应仍为任务快照。过期修订或非法状态返回 409；同一个幂等键对应不同请求也返回 409。

事件字段：sequence、taskId、revision、type、timestamp、detail。SSE 每条使用 sequence 作为 id，并周期性发送注释心跳。客户端按 sequence 去重；这是事件表补读，不是模型输出 token 流。

## 错误

统一形状 `{ "error": { "code": "...", "message": "..." } }`，验证错误可含 issues。使用 400/401/403/404/409/413/415/500。500 不暴露内部异常或凭据，遇到不确定写入结果应沿用幂等键查回执。

当前客户端不自动重试写命令；对 UI 的未知网络结果，需要重新读取任务再决定。后续客户端应保存待确认命令，避免产生新的重复请求。

## CLI

```bash
pnpm cli list
pnpm cli create "新的演示工作流"
pnpm cli show TASK_ID
pnpm cli start TASK_ID
pnpm cli advance TASK_ID
pnpm cli pause TASK_ID
pnpm cli resume TASK_ID
pnpm cli cancel TASK_ID
pnpm cli events TASK_ID
```

默认使用本地根地址和 `.jevis/token`，可通过 JEVIS_URL、JEVIS_TOKEN、JEVIS_DATA_DIR 配置。不把凭据写进命令行参数。

## MCP

`pnpm mcp` 使用标准输入输出传输。只提供 `jevis_list_tasks` 和 `jevis_get_task`，标注 readOnlyHint。没有 shell、真实 Agent 执行或审批绕过工具。客户端配置时工作目录设为 Jevis 根目录，或使用绝对数据目录。

## 完整产品扩展

项目管理、规格修订、单元重跑、供给探测、额度、审批、产物、评测、策略激活和设备配对均尚未提供 API。v3 中这些端点是设计，不是可调用接口。新增接口同时提供运行时 Schema、权限边界、幂等行为和测试。
