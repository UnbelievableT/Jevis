import type {
  Task,
  TaskEvent,
  SupplyProfile,
  CreateTask,
  Command,
} from '../../contracts/src/index';
export class JevisClient {
  constructor(
    private base: string,
    private token: string,
  ) {}
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(this.base + '/api/v1' + path, {
      ...init,
      headers: {
        Authorization: 'Bearer ' + this.token,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? 'Request failed');
    return data as T;
  }
  list() {
    return this.request<{ tasks: Task[] }>('/tasks');
  }
  get(id: string) {
    return this.request<{ task: Task }>('/tasks/' + encodeURIComponent(id));
  }
  supplies() {
    return this.request<{ supplies: SupplyProfile[] }>('/supplies');
  }
  events(taskId: string, after = 0) {
    return this.request<{ events: TaskEvent[] }>(
      '/events?taskId=' + encodeURIComponent(taskId) + '&after=' + after,
    );
  }
  create(input: CreateTask, key = crypto.randomUUID()) {
    return this.request<{ task: Task }>('/tasks', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify(input),
    });
  }
  command(task: Task, action: Command['action'], key = crypto.randomUUID()) {
    return this.request<{ task: Task }>('/tasks/' + task.id + '/commands', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify({ action, expectedRevision: task.revision }),
    });
  }
}
