export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a className={'brand' + (light ? ' brand-light' : '')} href="/" aria-label="Jevis 首页">
      <span className="brand-mark">
        <img src="/brand/logo.png" alt="" />
      </span>
      <span>
        Jevis<span className="brand-dot">.</span>
      </span>
    </a>
  );
}
