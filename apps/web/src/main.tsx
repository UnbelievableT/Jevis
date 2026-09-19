import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Menu,
  X,
  GitBranch,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import './site.css';
const repo = 'https://github.com/UnbelievableT/Jevis';
const steps = [
  {
    n: '01',
    name: '理解与规划',
    role: 'Architect',
    model: '强模型',
    title: '先想清楚，再动手。',
    text: '把目标拆成明确的规格、依赖和验收条件。让强模型处理真正需要深思熟虑的部分。',
    output: '规格 · 边界 · 验收条件',
  },
  {
    n: '02',
    name: '分工与执行',
    role: 'Worker',
    model: '合适的模型',
    title: '让能力，匹配任务。',
    text: '每个工作单元独立选择执行器，只携带需要的上下文。普通任务有序推进，困难的实现仍可交给强模型。',
    output: '实现 · 测试 · 变更记录',
  },
  {
    n: '03',
    name: '检查与交付',
    role: 'Reviewer',
    model: '验证工具与模型',
    title: '用证据，判断完成。',
    text: '检查约束、测试和独立审查结果。证据不足时补充上下文、升级模型或重新规划。',
    output: '测试证据 · 审查 · 交付',
  },
];
function Logo() {
  return (
    <a className="wordmark" href="/" aria-label="Jevis 首页">
      <img src="/brand/logo.png" alt="" />
      <span>Jevis</span>
    </a>
  );
}
function Header({ docs = false }: { docs?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav
          id="site-navigation"
          className={open ? 'site-nav expanded' : 'site-nav'}
          aria-label="主导航"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        >
          <a href="/#workflow" onClick={() => setOpen(false)}>
            工作方式
          </a>
          <a href="/#principles" onClick={() => setOpen(false)}>
            产品理念
          </a>
          <a href="/docs" aria-current={docs ? 'page' : undefined}>
            文档
          </a>
        </nav>
        <a className="github-link" href={repo} target="_blank" rel="noreferrer">
          GitHub <ArrowUpRight size={14} />
        </a>
        <button
          className="menu-toggle"
          aria-label={open ? '关闭导航' : '打开导航'}
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer className="site-footer wrap">
      <div>
        <Logo />
        <p>Many minds. One direction.</p>
      </div>
      <div>
        <a href="/docs">文档</a>
        <a href={repo} target="_blank" rel="noreferrer">
          GitHub <ArrowUpRight size={12} />
        </a>
        <span>© 2026 Jevis</span>
      </div>
    </footer>
  );
}
function Workflow() {
  const [step, setStep] = useState(0);
  return (
    <section className="workflow-section wrap" id="workflow">
      <div className="section-intro">
        <p className="eyebrow">工作方式</p>
        <h2>
          一个目标。
          <br />
          一套完整的协作。
        </h2>
        <p className="section-description">
          从规划到验收，清楚地知道谁在做什么，
          <br />
          以及为什么这样做。
        </p>
      </div>
      <div className="workflow-demo">
        <div className="demo-toolbar">
          <span>
            <i className="tiny-dot" /> Jevis / 工作流
          </span>
          <span>交互示意 · 非真实运行</span>
        </div>
        <div className="demo-goal">
          <span className="goal-icon">
            <GitBranch size={18} />
          </span>
          <div>
            <small>目标</small>
            <strong>为项目添加账户设置功能</strong>
          </div>
          <small>本地项目</small>
        </div>
        <div className="demo-track" role="tablist" aria-label="工作流阶段">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <button
                id={'step-' + i}
                role="tab"
                aria-selected={step === i}
                aria-controls="workflow-panel"
                tabIndex={step === i ? 0 : -1}
                onKeyDown={(event) => {
                  const next =
                    event.key === 'ArrowRight'
                      ? (i + 1) % steps.length
                      : event.key === 'ArrowLeft'
                        ? (i + steps.length - 1) % steps.length
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? steps.length - 1
                            : null;
                  if (next !== null) {
                    event.preventDefault();
                    setStep(next);
                    document.getElementById('step-' + next)?.focus();
                  }
                }}
                className={'step-tab' + (step === i ? ' selected' : '')}
                onClick={() => setStep(i)}
              >
                <span>{i < step ? <Check size={13} /> : s.n}</span>
                <strong>{s.name}</strong>
                <small>{s.role}</small>
              </button>
              {i < 2 && <ChevronRight className="track-arrow" size={13} />}
            </React.Fragment>
          ))}
        </div>
        <div
          id="workflow-panel"
          role="tabpanel"
          aria-labelledby={'step-' + step}
          className="demo-detail"
        >
          <div>
            <span>{steps[step].model}</span>
            <h3>{steps[step].title}</h3>
            <p>{steps[step].text}</p>
          </div>
          <div className="demo-output">
            <span>本步输出</span>
            <p>{steps[step].output}</p>
            <span>
              <Check size={13} /> 明确下一步所需材料
            </span>
          </div>
        </div>
        <div className="demo-bottom">
          <span>
            <ShieldCheck size={13} />
            权限与预算由你决定
          </span>
          <button onClick={() => setStep((step + 1) % 3)}>
            {step === 2 ? (
              <>
                <RotateCcw size={13} />
                重新查看
              </>
            ) : (
              <>
                下一步 <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero wrap">
          <a className="release-note" href="/docs#status">
            <i className="tiny-dot" />
            开发中 <span />
            查看项目进展 <ArrowRight size={12} />
          </a>
          <h1>
            把模型，
            <br />
            组织成团队<span>。</span>
          </h1>
          <div className="hero-bottom">
            <p>
              强模型规划，合适的模型执行。
              <br />
              Jevis 让不同能力的 AI，协作完成同一个目标。
            </p>
            <div className="hero-actions">
              <a className="button dark" href={repo} target="_blank" rel="noreferrer">
                查看项目 <ArrowUpRight size={15} />
              </a>
              <a className="button plain" href="#workflow">
                了解工作方式 <ArrowRight size={15} />
              </a>
            </div>
          </div>
          <div className="hero-meta">
            <span>本地优先</span>
            <i />
            <span>多模型协作</span>
            <i />
            <span>证据驱动</span>
            <span>MANY MINDS. ONE DIRECTION.</span>
          </div>
        </section>
        <Workflow />
        <section className="principles wrap" id="principles">
          <div className="section-intro">
            <p className="eyebrow">为什么做 Jevis</p>
            <h2>
              把强模型的能力，
              <br />
              用在更重要的地方。
            </h2>
          </div>
          <div className="principle-list">
            {[
              [
                '01',
                '不让每件小事，都消耗顶级额度。',
                '按工作单元选择模型。规划、常规实现和复杂审查，可以使用不同的供给与推理配置。',
              ],
              [
                '02',
                '传递必要信息，而不是整个会话。',
                '规格与原始证据保留在项目中。上下文按需构建，缺少信息时可以取回，而不是永久丢弃。',
              ],
              [
                '03',
                '省下资源，也要交付合格结果。',
                '把测试、审查和返工纳入工作流。是否更划算，要通过相同任务的真实对照来判断。',
              ],
            ].map(([n, t, p]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{p}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="integration-section wrap">
          <div className="section-intro">
            <p className="eyebrow">为你的工作环境而设计</p>
            <h2>
              模型可以不同。
              <br />
              工作的目标保持一致。
            </h2>
            <a className="inline-link" href="/docs#architecture">
              阅读架构 <ArrowRight size={14} />
            </a>
          </div>
          <div className="integration-table">
            {[
              ['编码执行器', 'Codex / Claude Agent'],
              ['第三方与本地模型', 'Pi / 自定义供给'],
              ['细粒度判断', 'Jev / 可替换 Judge'],
              ['操作入口', 'Desktop / CLI / MCP'],
            ].map(([a, b]) => (
              <div key={a}>
                <span>{a}</span>
                <strong>{b}</strong>
              </div>
            ))}
            <p>
              以上为完整架构方向。各模块的实际接入状态，
              <a href="/docs#status">在文档中公开说明 ↗</a>。
            </p>
          </div>
        </section>
        <section className="faq wrap">
          <div className="section-intro">
            <p className="eyebrow">常见问题</p>
            <h2>开始之前。</h2>
          </div>
          <div className="faq-list">
            {[
              [
                'Jevis 和 Jev 是什么关系？',
                'Jevis 是独立的多模型编排项目；Jev 是 TypeSafe 提供的判断模型。Jevis 可以接入 Jev，也保留替换判断后端的接口。两者没有品牌隶属关系。',
              ],
              [
                '混合模型一定更便宜吗？',
                '不一定。拆解、交接、审查和返工都会产生开销。Jevis 的目标是提高预算内的合格交付量，简单任务也可以直接执行。当前没有经过真实任务验证的节省比例。',
              ],
              [
                '代码会上传到哪里？',
                'Jevis 采用本地优先设计。项目状态和证据保存在本地；使用云端模型时，需要把选定上下文发送给对应提供方。本地优先并不代表所有模型调用都离线。',
              ],
              [
                '现在可以使用什么？',
                '目前可以从仓库运行工作台和本地演示流程。真实执行器、沙箱与跨模型恢复还在持续开发。当前没有正式安装包，也不会把演示流程当成真实模型执行。',
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing wrap">
          <p className="eyebrow">让智能，成为协作。</p>
          <h2>
            下一个目标，
            <br />
            一起完成。
          </h2>
          <a className="button dark" href={repo} target="_blank" rel="noreferrer">
            在 GitHub 查看 Jevis <ArrowUpRight size={15} />
          </a>
          <p>项目正在开发，欢迎从文档和代码开始了解。</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
const sections = [
  ['overview', '项目概览'],
  ['start', '本地运行'],
  ['architecture', '架构与边界'],
  ['status', '开发状态'],
];
function Docs() {
  const [active, setActive] = useState(() => location.hash.slice(1) || 'overview');
  const [copied, setCopied] = useState(false);
  const command =
    'git clone https://github.com/UnbelievableT/Jevis.git\ncd Jevis\npnpm install --frozen-lockfile\npnpm dev';
  useEffect(() => {
    const change = () => setActive(location.hash.slice(1) || 'overview');
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const selected = sections.some((s) => s[0] === active) ? active : 'overview';
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <>
      <Header docs />
      <main id="main" className="docs-layout wrap">
        <aside className="docs-sidebar">
          <p className="eyebrow">JEViS / 文档</p>
          <nav aria-label="文档章节">
            {sections.map(([id, label]) => (
              <a key={id} href={'#' + id} aria-current={selected === id ? 'page' : undefined}>
                {label}
                <ChevronRight size={13} />
              </a>
            ))}
          </nav>
          <a
            className="docs-source"
            href={repo + '/tree/main/docs'}
            target="_blank"
            rel="noreferrer"
          >
            完整工程文档 <ArrowUpRight size={13} />
          </a>
        </aside>
        <article className="docs-article" key={selected}>
          {selected === 'overview' && (
            <>
              <p className="eyebrow">项目概览</p>
              <h1>
                让不同的模型，
                <br />
                协作完成工作。
              </h1>
              <p className="docs-lead">
                Jevis 是本地优先的模型编排器。它把规划、执行、上下文与验收组织在同一个工作流中。
              </p>
              <h2>我们想解决的问题</h2>
              <p>
                强模型能力强，但资源有限。普通模型可以承担许多有边界的任务，却需要明确的规格和必要的上下文。Jevis
                的目标是让两者协作，而不是让用户手动搬运任务和会话。
              </p>
              <h2>核心原则</h2>
              <ul>
                <li>每个工作单元独立选择模型与推理配置。</li>
                <li>原始证据与上下文视图分离，需要时能够取回。</li>
                <li>以测试和独立审查判定结果，不让模型自评替代验收。</li>
                <li>权限、预算和状态由确定性代码控制。</li>
              </ul>
              <a className="inline-link" href="#start">
                在本地运行 <ArrowRight size={14} />
              </a>
            </>
          )}
          {selected === 'start' && (
            <>
              <p className="eyebrow">本地运行</p>
              <h1>从你的设备开始。</h1>
              <p className="docs-lead">
                需要 Node.js 24 和 pnpm 10.10.0。原生桌面窗口还需要 Rust 与对应平台的构建工具。
              </p>
              <div className="code-block">
                <div>
                  <span>Terminal</span>
                  <button
                    onClick={() => void copy()}
                    aria-label={copied ? '已复制命令' : '复制启动命令'}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <pre>
                  <code>{command}</code>
                </pre>
              </div>
              <h2>打开工作台</h2>
              <p>
                运行后访问 <code>http://127.0.0.1:5173</code>。后台会在项目根目录生成{' '}
                <code>.jevis/token</code>，把这个本地令牌填入工作台即可连接。不要提交或分享令牌。
              </p>
              <p>当前可创建演示任务，检查依赖推进、暂停、继续和持久化记录。演示不修改真实仓库。</p>
              <h2>常用入口</h2>
              <div className="doc-table">
                {[
                  ['工作台', '127.0.0.1:5173'],
                  ['本地 API', '127.0.0.1:4317/api/v1'],
                  ['命令行', 'pnpm cli help'],
                  ['验证工程', 'pnpm check'],
                ].map(([a, b]) => (
                  <div key={a}>
                    <span>{a}</span>
                    <code>{b}</code>
                  </div>
                ))}
              </div>
              <a
                className="inline-link"
                href={repo + '/blob/main/docs/development.md'}
                target="_blank"
                rel="noreferrer"
              >
                完整开发说明 <ArrowUpRight size={14} />
              </a>
            </>
          )}
          {selected === 'architecture' && (
            <>
              <p className="eyebrow">架构与边界</p>
              <h1>
                一个控制面，
                <br />
                多个执行器。
              </h1>
              <p className="docs-lead">
                桌面、CLI 和 MCP 共用本地服务中的任务状态。模型提供能力，Jevis 管理工作。
              </p>
              <ol className="architecture-list">
                {[
                  ['规格与上下文', '定义约束、验收条件和依赖，为工作单元提供必要材料。'],
                  ['调度与执行', '在能力、资源和权限约束下选择执行器；真实工具需要实际沙箱。'],
                  ['验证与恢复', '保存产物和事件。未知副作用先对账，不能在恢复时盲目重复执行。'],
                ].map(([h, p], i) => (
                  <li key={h}>
                    <span>0{i + 1}</span>
                    <div>
                      <h3>{h}</h3>
                      <p>{p}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <h2>Jev 在哪里发挥作用？</h2>
              <p>
                作为独立的判断层，Jev
                可以提供上下文相关性、任务路由和语义检查的信号。它不直接修改权限、不控制预算，也不单独决定最终验收。
              </p>
              <h2>本地优先的含义</h2>
              <p>
                状态、证据和经验默认在设备上保存。云模型调用仍会向提供方传输选定材料。手机远程控制需要独立的配对和
                TLS 设计，不能直接把本地端口暴露到公网。
              </p>
              <a
                className="inline-link"
                href={repo + '/blob/main/docs/technical-spec-v3.md'}
                target="_blank"
                rel="noreferrer"
              >
                完整技术方案 <ArrowUpRight size={14} />
              </a>
            </>
          )}
          {selected === 'status' && (
            <>
              <p className="eyebrow">开发状态</p>
              <h1>把进展说清楚。</h1>
              <p className="docs-lead">
                Jevis 正在开发。完整产品范围保持一致，下面区分可运行的功能与仍在实现的能力。
              </p>
              <h2>目前可运行</h2>
              <ul>
                <li>桌面工作台、响应式移动界面与本地服务。</li>
                <li>演示任务创建、依赖推进、暂停/继续与事件记录。</li>
                <li>SQLite 持久化、命令幂等和修订冲突检查。</li>
                <li>CLI 管理入口与只读 MCP 查询。</li>
                <li>Jev SDK 适配层、返回校验与合成数据连通性命令。</li>
                <li>持久化预算账本与租约基础模块，已通过边界测试。</li>
              </ul>
              <h2>正在实现</h2>
              <ul>
                <li>Codex / Claude 真实执行与 Jev 实测、校准。</li>
                <li>预算与调度器的原子接入、执行恢复与副作用对账。</li>
                <li>规格生成、上下文构建、代码执行与独立验收。</li>
                <li>平台沙箱、设备配对、安装包和升级。</li>
              </ul>
              <div className="docs-callout">
                当前没有正式下载包，也没有已验证的成本节省百分比。具体实现与测试结果以仓库记录为准。
              </div>
              <a
                className="inline-link"
                href={repo + '/blob/main/docs/status.md'}
                target="_blank"
                rel="noreferrer"
              >
                查看工程状态与测试记录 <ArrowUpRight size={14} />
              </a>
            </>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <a className="skip-link" href="#main">
      跳到主要内容
    </a>
    {location.pathname.replace(/\/$/, '') === '/docs' ? <Docs /> : <Home />}
  </React.StrictMode>,
);
