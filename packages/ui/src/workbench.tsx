import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react';
import {
  ArrowUpRight,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Check,
  Layers3,
  SlidersHorizontal,
  Workflow,
  History,
  CircleHelp,
  Square,
  ChevronRight,
  Radio,
  RefreshCw,
  X,
  PlugZap,
  Terminal,
  ShieldCheck,
} from 'lucide-react';
import { JevisClient } from '../../client/src/index';
import type { Task, TaskEvent, SupplyProfile, Command } from '../../contracts/src/index';
import { Brand } from './brand';
import '@xyflow/react/dist/style.css';
import './theme.css';
const states: Record<string, string> = {
  ready: '待启动',
  running: '进行中',
  paused: '已暂停',
  verifying: '待验收',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
};
const initialBase =
  import.meta.env.VITE_JEVIS_API_URL ??
  ('__TAURI_INTERNALS__' in window ? 'http://127.0.0.1:4317' : '');
export function Workbench({ mobile = false }: { mobile?: boolean }) {
  const [tab, setTab] = useState('workflows');
  const [token, setToken] = useState(() => sessionStorage.getItem('jevis-token') ?? '');
  const [draftToken, setDraftToken] = useState('');
  const [connected, setConnected] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [supplies, setSupplies] = useState<SupplyProfile[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('5');
  const [showConnect, setShowConnect] = useState(!token);
  const [compactGraph, setCompactGraph] = useState(
    () => window.matchMedia('(max-width: 760px)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const update = () => setCompactGraph(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const client = useMemo(() => new JevisClient(initialBase, token), [token]);
  const selected = tasks.find((t) => t.id === selectedId) ?? tasks[0];
  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [a, b] = await Promise.all([client.list(), client.supplies()]);
      setTasks(a.tasks);
      setSupplies(b.supplies);
      setConnected(true);
      setShowConnect(false);
    } catch (e) {
      setConnected(false);
      setError(e instanceof Error ? e.message : '连接失败');
    }
  }, [client, token]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!connected) return;
    let active = true;
    async function update() {
      try {
        const results = await Promise.all([
          client.list(),
          selected ? client.events(selected.id) : Promise.resolve({ events: [] }),
        ]);
        if (active) {
          setTasks(results[0].tasks);
          setEvents(results[1].events);
        }
      } catch (e) {
        if (active) {
          setConnected(false);
          setError(e instanceof Error ? e.message : '连接中断');
        }
      }
    }
    void update();
    const timer = setInterval(update, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [client, connected, selected?.id]);
  async function action(command: Command['action']) {
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await client.command(selected, command);
      setTasks((t) => t.map((row) => (row.id === result.task.id ? result.task : row)));
    } catch (e) {
      setError(e instanceof Error ? e.message : '命令失败');
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await client.create({ title, goal, budgetUsd: Number(budget), mode: 'demo' });
      setTasks((t) => [result.task, ...t]);
      setSelectedId(result.task.id);
      setCreating(false);
      setTitle('');
      setGoal('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setBusy(false);
    }
  }
  function connect(e: React.FormEvent) {
    e.preventDefault();
    const value = draftToken.trim();
    if (value.length < 32) {
      setError('请输入完整的本地连接令牌。');
      return;
    }
    sessionStorage.setItem('jevis-token', value);
    setToken(value);
    setError('');
    if (value === token) void refresh();
  }
  const positions = [
    { x: 0, y: 94 },
    { x: 285, y: 0 },
    { x: 285, y: 188 },
    { x: 570, y: 94 },
  ];
  const nodes: Node[] = (selected?.units ?? []).map((u, i) => ({
    id: u.id,
    position: positions[i] ?? { x: i * 240, y: 0 },
    data: {
      label: (
        <div className="flow-label">
          <div className="flow-role">
            <span>{u.role === 'architect' ? '规划' : u.role === 'reviewer' ? '验收' : '执行'}</span>
            {u.status === 'completed' ? <Check size={14} /> : <span className="node-dot" />}
          </div>
          <strong>{u.title}</strong>
          <small>
            {u.executor} · {u.status === 'completed' ? '已完成' : '待执行'}
          </small>
        </div>
      ),
    },
    sourcePosition: 'right' as never,
    targetPosition: 'left' as never,
    className: u.status === 'completed' ? 'finished-node' : '',
    style: { width: 230 },
  }));
  const edges: Edge[] = (selected?.units ?? []).flatMap((u) =>
    u.dependencies.map((id) => ({
      id: id + '-' + u.id,
      source: id,
      target: u.id,
      type: 'smoothstep',
      style: {
        stroke:
          selected?.units.find((n) => n.id === id)?.status === 'completed' ? '#517862' : '#c8cec3',
        strokeWidth: 1.5,
      },
    })),
  );
  const completed = selected?.units.filter((u) => u.status === 'completed').length ?? 0;
  const navigation = [
    ['workflows', '工作流', Workflow],
    ['models', '模型与执行器', Layers3],
    ['activity', '事件记录', History],
    ['about', '项目说明', CircleHelp],
  ] as const;
  return (
    <div className={'app-shell' + (mobile ? ' mobile-shell' : '')}>
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">
          <span className="workspace-avatar">J</span>
          <div>
            Jevis Workspace<small>本地工作空间</small>
          </div>
          <ChevronRight size={14} />
        </div>
        <span className="eyebrow nav-caption">CONTROL ROOM</span>
        <nav aria-label="主导航">
          {navigation.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? 'nav-item active' : 'nav-item'}
              onClick={() => setTab(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === 'workflows' && <small>{tasks.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <ShieldCheck size={17} />
            <div>
              在你的设备上<small>任务和记录保存在本地</small>
            </div>
          </div>
          <a href="https://jevis.xyz" target="_blank" rel="noreferrer">
            Jevis.xyz <ArrowUpRight size={15} />
          </a>
          <small>FOUNDATION / 0.1.0</small>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="topbar">
          <span>
            工作空间 <ChevronRight size={13} /> {navigation.find((n) => n[0] === tab)?.[1]}
          </span>
          <button className="connection-button" onClick={() => setShowConnect((v) => !v)}>
            <i className={connected ? 'live-dot' : 'offline-dot'} />
            {connected ? '本地服务已连接' : '连接本地服务'}
            <SlidersHorizontal size={14} />
          </button>
        </header>
        <div className="workspace-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">MANY MINDS. ONE DIRECTION.</p>
              <h1>
                {tab === 'workflows'
                  ? '让每一份智能，各尽其用。'
                  : tab === 'models'
                    ? '一支由你组建的模型团队。'
                    : tab === 'activity'
                      ? '每一步，都有迹可循。'
                      : '从同一个目标出发。'}
              </h1>
              <p className="muted">
                {tab === 'workflows'
                  ? '把目标交给工作流，让规划、执行与验收有序衔接。'
                  : tab === 'models'
                    ? '按工作单元选择执行器，保留模型、权限和费用的控制权。'
                    : tab === 'activity'
                      ? '事件来自本地持久化记录，可在重新连接后继续查看。'
                      : 'Jevis 把不同能力的模型，组织成一套可检查的工作系统。'}
              </p>
            </div>
            {tab === 'workflows' && (
              <button
                className="primary"
                onClick={() => {
                  if (!connected) {
                    setShowConnect(true);
                    return;
                  }
                  setCreating((v) => !v);
                }}
              >
                <Plus size={17} />
                新建工作流
              </button>
            )}
          </div>
          {error && (
            <div className="error-message" role="alert">
              <span>{error}</span>
              <button aria-label="关闭提示" onClick={() => setError('')}>
                <X size={16} />
              </button>
            </div>
          )}
          {showConnect && (
            <form className="connect-panel" onSubmit={connect}>
              <div>
                <PlugZap size={20} />
                <div>
                  <strong>连接本地 Jevis 服务</strong>
                  <p>
                    先运行 <code>pnpm dev</code>，再粘贴 <code>.jevis/token</code>{' '}
                    中的令牌。仅保留在此标签页会话。
                  </p>
                </div>
              </div>
              <label className="sr-only" htmlFor="local-token">
                本地连接令牌
              </label>
              <input
                id="local-token"
                type="password"
                autoComplete="off"
                placeholder="本地连接令牌"
                value={draftToken}
                onChange={(e) => setDraftToken(e.target.value)}
              />
              <button className="primary" type="submit">
                连接 <ArrowRight size={15} />
              </button>
            </form>
          )}
          <div className="demo-notice">
            <span>框架演示</span>
            <p>流程与保存机制可用。真实模型尚未接入，演示不会修改仓库或产生模型费用。</p>
          </div>
          {creating && tab === 'workflows' && (
            <form className="create-panel" onSubmit={create}>
              <div className="section-heading">
                <h2>定义一个目标</h2>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="关闭创建表单"
                  onClick={() => setCreating(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <label>
                工作流名称
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：为项目添加账户设置页面"
                />
              </label>
              <label>
                目标与验收条件
                <textarea
                  required
                  minLength={3}
                  maxLength={4000}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="描述预期结果、约束和完成条件。"
                />
              </label>
              <div className="form-bottom">
                <label>
                  预算上限（USD）
                  <input
                    type="number"
                    min=".01"
                    max="10000"
                    step=".01"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </label>
                <button className="primary" disabled={busy} type="submit">
                  创建演示工作流 <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}
          {tab === 'workflows' && (
            <>
              {!tasks.length ? (
                <section className="empty-workspace">
                  <div>
                    <span className="eyebrow">YOUR NEXT GOOD IDEA</span>
                    <h2>
                      一个目标。
                      <br />
                      一整支智能团队。
                    </h2>
                    <p>
                      从一个清晰的目标开始，查看任务如何在
                      <br className="desktop-break" />
                      规划、执行和验收之间流转。
                    </p>
                    <button
                      className="text-button"
                      onClick={() => {
                        if (connected) setCreating(true);
                        else setShowConnect(true);
                      }}
                    >
                      创建你的第一个工作流 <ArrowRight size={17} />
                    </button>
                  </div>
                  <img
                    src="/brand/empty-state.png"
                    alt="绿色 J 形构件、拱桥和橙色方块相互衔接的品牌插画"
                  />
                </section>
              ) : (
                <>
                  <div className="workflow-toolbar">
                    <div className="workflow-picker">
                      <label htmlFor="task-select">当前工作流</label>
                      <select
                        id="task-select"
                        value={selected?.id ?? ''}
                        onChange={(e) => setSelectedId(e.target.value)}
                      >
                        {tasks.map((task) => (
                          <option key={task.id} value={task.id}>
                            {task.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="刷新工作流"
                      onClick={() => void refresh()}
                    >
                      <RefreshCw size={17} />
                    </button>
                  </div>
                  {selected && (
                    <section className="workflow-panel">
                      <div className="workflow-title">
                        <div>
                          <div className="status-line">
                            <span className={'status status-' + selected.status}>
                              {states[selected.status]}
                            </span>
                            <span>演示任务 · 修订 {selected.revision}</span>
                          </div>
                          <h2>{selected.title}</h2>
                          <p>{selected.goal}</p>
                        </div>
                        <div className="run-actions">
                          {selected.status === 'ready' && (
                            <button
                              className="primary"
                              disabled={busy || !connected}
                              onClick={() => void action('start')}
                            >
                              <Play size={15} />
                              启动演示
                            </button>
                          )}
                          {selected.status === 'running' && (
                            <>
                              <button
                                className="secondary"
                                disabled={busy || !connected}
                                onClick={() => void action('pause')}
                              >
                                <Pause size={15} />
                                暂停
                              </button>
                              <button
                                className="primary"
                                disabled={busy || !connected}
                                onClick={() => void action('advance')}
                              >
                                模拟下一步 <ArrowRight size={15} />
                              </button>
                            </>
                          )}
                          {selected.status === 'paused' && (
                            <button
                              className="primary"
                              disabled={busy || !connected}
                              onClick={() => void action('resume')}
                            >
                              <Play size={15} />
                              继续
                            </button>
                          )}
                          {selected.status === 'verifying' && (
                            <button
                              className="primary"
                              disabled={busy || !connected}
                              onClick={() => void action('advance')}
                            >
                              <Check size={15} />
                              模拟验收
                            </button>
                          )}
                          {['ready', 'running', 'paused', 'verifying'].includes(
                            selected.status,
                          ) && (
                            <button
                              className="icon-button"
                              disabled={busy || !connected}
                              onClick={() => void action('cancel')}
                              aria-label="取消演示任务"
                            >
                              <Square size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="graph-caption">
                        <span>
                          <Workflow size={14} />
                          任务协作图
                        </span>
                        <span>
                          {completed} / {selected.units.length} 个工作单元完成
                        </span>
                      </div>
                      {compactGraph ? (
                        <ol className="mobile-unit-list" aria-label="任务依赖列表">
                          {selected.units.map((unit, index) => (
                            <li key={unit.id}>
                              <span
                                className={
                                  unit.status === 'completed' ? 'unit-step done' : 'unit-step'
                                }
                              >
                                {unit.status === 'completed' ? <Check size={14} /> : index + 1}
                              </span>
                              <div>
                                <strong>{unit.title}</strong>
                                <small>
                                  {unit.executor} ·{' '}
                                  {unit.dependencies.length
                                    ? '依赖：' + unit.dependencies.join('、')
                                    : '起点'}
                                </small>
                              </div>
                              <span className="status">
                                {unit.status === 'completed' ? '已完成' : '待执行'}
                              </span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <div className="task-graph" aria-label="任务依赖图">
                          <ReactFlow
                            key={selected.id}
                            nodes={nodes}
                            edges={edges}
                            fitView
                            fitViewOptions={{ padding: 0.18 }}
                            nodesDraggable={false}
                            nodesConnectable={false}
                            minZoom={0.3}
                            maxZoom={1.5}
                          >
                            <Background color="#d9ddd2" gap={22} size={1} />
                            <Controls showInteractive={false} />
                          </ReactFlow>
                        </div>
                      )}
                      <div className="workflow-footer">
                        <span>
                          预算上限 <strong>$ {selected.budgetUsd.toFixed(2)}</strong>
                        </span>
                        <span>
                          实际模型费用 <strong>—</strong>
                        </span>
                        <span>
                          原始证据 <strong>演示标记</strong>
                        </span>
                        <span>
                          <ShieldCheck size={15} /> 本地持久化
                        </span>
                      </div>
                    </section>
                  )}
                  <section className="event-section">
                    <div className="section-heading">
                      <h2>最近事件</h2>
                      <button className="text-button" onClick={() => setTab('activity')}>
                        查看全部 <ArrowUpRight size={14} />
                      </button>
                    </div>
                    <EventList events={events.slice(-3).reverse()} />
                  </section>
                </>
              )}
              <div className="principle-strip">
                <div>
                  <span>01</span>
                  <strong>强模型规划</strong>
                  <p>把复杂目标变成明确的工作单元</p>
                </div>
                <div>
                  <span>02</span>
                  <strong>合适的模型执行</strong>
                  <p>让能力与任务的实际需要匹配</p>
                </div>
                <div>
                  <span>03</span>
                  <strong>证据驱动验收</strong>
                  <p>检查结果，再决定继续或升级</p>
                </div>
              </div>
            </>
          )}
          {tab === 'models' && (
            <section className="model-section">
              <div className="section-heading">
                <h2>模型供给</h2>
                <span className="muted">真实接入仍待实现</span>
              </div>
              {!connected ? (
                <p className="muted">连接本地服务后查看供给注册表。</p>
              ) : (
                supplies.map((s) => (
                  <div className="model-row" key={s.id}>
                    <span className={'model-avatar tier-' + s.tier}>
                      {s.kind === 'judge' ? 'J' : s.kind === 'demo' ? 'D' : s.name[0]}
                    </span>
                    <div>
                      <strong>{s.name}</strong>
                      <small>
                        {s.kind === 'demo'
                          ? '固定演示执行器'
                          : s.kind === 'judge'
                            ? '结构化判断接口'
                            : '执行器适配接口'}{' '}
                        ·{' '}
                        {s.tier === 'strong'
                          ? '架构 / 复杂任务'
                          : s.tier === 'judge'
                            ? '细粒度判断'
                            : '有边界的执行'}
                      </small>
                    </div>
                    <span className={s.availability === 'demo' ? 'status status-ready' : 'status'}>
                      {s.availability === 'demo' ? '演示可用' : '未接入'}
                    </span>
                  </div>
                ))
              )}
            </section>
          )}
          {tab === 'activity' && (
            <section className="event-section full-events">
              <div className="section-heading">
                <h2>{selected ? selected.title : '事件记录'}</h2>
                <span className="muted">{events.length} 条事件</span>
              </div>
              <EventList events={[...events].reverse()} />
            </section>
          )}
          {tab === 'about' && (
            <section className="about-panel">
              <img src="/brand/hero.png" alt="多个 J 形构件组成统一结构的 Jevis 品牌主视觉" />
              <div>
                <span className="eyebrow">JEViS / FOUNDATION</span>
                <h2>
                  让同样的 AI 预算，
                  <br />
                  完成更多合格工作。
                </h2>
                <p>
                  这是 Jevis
                  的产品目标，收益仍需要真实任务对照验证。当前版本交付整体工程框架、品牌资产和可运行的演示闭环。
                </p>
                <p>
                  工作台、本地服务与 CLI 共用同一套任务状态。Codex、Claude、Pi 与 Jev
                  已预留契约；生产级沙箱、跨模型恢复和配额调度尚待实现。
                </p>
                <a
                  className="text-button"
                  href="https://jevis.xyz"
                  target="_blank"
                  rel="noreferrer"
                >
                  Jevis.xyz <ArrowUpRight size={16} />
                </a>
              </div>
            </section>
          )}
        </div>
        <footer className="app-footer">
          <span>
            <Radio size={12} />
            LOCAL FIRST · BUILT TO WORK TOGETHER
          </span>
          <span>Jevis © 2026</span>
        </footer>
      </main>
    </div>
  );
}
function EventList({ events }: { events: TaskEvent[] }) {
  return events.length ? (
    <ol className="event-list">
      {events.map((event) => (
        <li key={event.sequence}>
          <span className="event-bullet" />
          <div>
            <p>{event.detail}</p>
            <small>
              #{event.sequence} · revision {event.revision}
            </small>
          </div>
          <time dateTime={event.timestamp}>
            {new Date(event.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </time>
        </li>
      ))}
    </ol>
  ) : (
    <p className="event-empty">
      <History size={18} />
      工作流启动后，运行事件会显示在这里。
    </p>
  );
}
