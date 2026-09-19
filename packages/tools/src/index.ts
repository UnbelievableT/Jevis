import type { OperationRecord, ExecutionPolicy } from '../../security/src/index';
export interface ToolRequest {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
  taskId: string;
  approvalRef?: string;
}
export interface ToolResult {
  operation: OperationRecord;
  artifactRefs: string[];
}
export interface ToolGateway {
  execute(request: ToolRequest, policy: ExecutionPolicy): Promise<ToolResult>;
  reconcile(operationId: string): Promise<OperationRecord>;
}
// Production implementations must authorize before dispatch and persist unknown outcomes; no arbitrary shell endpoint exists.
