import { DatabaseSync } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createTask, applyCommand, DomainError } from '../../core/src/index';
import {
  taskSchema,
  type Task,
  type CreateTask,
  type Command,
  type TaskEvent,
  type ArtifactRef,
} from '../../contracts/src/index';
export class Store {
  private db: DatabaseSync;
  constructor(file: string) {
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(file);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY);
      INSERT OR IGNORE INTO schema_migrations VALUES(1);
      CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY, body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS events(sequence INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT NOT NULL REFERENCES tasks(id), revision INTEGER NOT NULL, type TEXT NOT NULL, timestamp TEXT NOT NULL, detail TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS commands(key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, result TEXT NOT NULL);
    `);
  }
  close() {
    this.db.close();
  }
  list(): Task[] {
    return (
      this.db.prepare('SELECT body FROM tasks ORDER BY rowid DESC').all() as { body: string }[]
    ).map((r) => taskSchema.parse(JSON.parse(r.body)));
  }
  get(id: string): Task {
    const row = this.db.prepare('SELECT body FROM tasks WHERE id=?').get(id) as
      { body: string } | undefined;
    if (!row) throw new DomainError('Task not found', 'not_found', 404);
    return taskSchema.parse(JSON.parse(row.body));
  }
  events(after = 0, taskId?: string): TaskEvent[] {
    const sql =
      'SELECT sequence, task_id AS taskId, revision, type, timestamp, detail FROM events WHERE sequence > ?' +
      (taskId ? ' AND task_id = ?' : '') +
      ' ORDER BY sequence LIMIT 1000';
    return this.db
      .prepare(sql)
      .all(...(taskId ? [after, taskId] : [after])) as unknown as TaskEvent[];
  }
  private transact(key: string, fingerprint: string, fn: () => Task): Task {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const prior = this.db
        .prepare('SELECT fingerprint,result FROM commands WHERE key=?')
        .get(key) as { fingerprint: string; result: string } | undefined;
      if (prior) {
        if (prior.fingerprint !== fingerprint)
          throw new DomainError(
            'Idempotency key reused with a different request',
            'idempotency_conflict',
          );
        this.db.exec('COMMIT');
        return taskSchema.parse(JSON.parse(prior.result));
      }
      const task = fn();
      this.db
        .prepare('INSERT INTO commands VALUES(?,?,?)')
        .run(key, fingerprint, JSON.stringify(task));
      this.db.exec('COMMIT');
      return task;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  create(input: CreateTask, key: string): Task {
    return this.transact(key, JSON.stringify(['create', input]), () => {
      const task = createTask(input, randomUUID());
      this.db.prepare('INSERT INTO tasks VALUES(?,?)').run(task.id, JSON.stringify(task));
      this.record(task, 'created', '演示任务已创建。预算为用户设置，真实费用未知。');
      return task;
    });
  }
  command(id: string, command: Command, key: string): Task {
    return this.transact(key, JSON.stringify([id, command]), () => {
      const { task, detail } = applyCommand(this.get(id), command);
      this.db.prepare('UPDATE tasks SET body=? WHERE id=?').run(JSON.stringify(task), id);
      this.record(task, command.action, detail);
      return task;
    });
  }
  private record(task: Task, type: string, detail: string) {
    this.db
      .prepare('INSERT INTO events(task_id,revision,type,timestamp,detail) VALUES(?,?,?,?,?)')
      .run(task.id, task.revision, type, task.updatedAt, detail);
  }
}
export class ArtifactStore {
  constructor(private root: string) {
    mkdirSync(root, { recursive: true, mode: 0o700 });
  }
  put(data: Uint8Array, mediaType = 'application/octet-stream'): ArtifactRef {
    const digest = createHash('sha256').update(data).digest('hex'),
      file = join(this.root, digest);
    if (!existsSync(file)) {
      const temp = file + '.' + randomUUID() + '.tmp';
      writeFileSync(temp, data, { mode: 0o600 });
      renameSync(temp, file);
    }
    return { digest, mediaType, size: data.length };
  }
  get(ref: ArtifactRef): Buffer {
    if (!/^[a-f0-9]{64}$/.test(ref.digest)) throw new Error('Invalid artifact digest');
    const data = readFileSync(join(this.root, ref.digest));
    if (data.length !== ref.size || createHash('sha256').update(data).digest('hex') !== ref.digest)
      throw new Error('Artifact integrity failure');
    return data;
  }
}
