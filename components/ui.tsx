import type { CSSProperties, ReactNode } from 'react';

export function ArrowUpRight({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
      <line x1="64" y1="192" x2="192" y2="64" />
      <polyline points="88 64 192 64 192 168" />
    </svg>
  );
}

export function ArrowDown({ color = '#3A5139' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
      <line x1="128" y1="40" x2="128" y2="216" />
      <polyline points="56 144 128 216 200 144" />
    </svg>
  );
}

type PillProps = {
  children: ReactNode;
  href?: string;
  light?: boolean;
  down?: boolean;
  /** otvara formu za porudžbinu */
  order?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

/** Zaobljeno dugme sa strelicom (tamno ili belo), kao u originalu. */
export function Pill({ children, href = '#cena', light, down, order, className = '', style, onClick }: PillProps) {
  const color = light ? '#3A5139' : '#FFFFFF';
  return (
    <a
      href={href}
      data-order={order}
      onClick={onClick}
      className={`btn${light ? ' btn--light' : ''}${down ? ' btn--down' : ''} ${className}`}
      style={style}
    >
      <span>{children}</span>
      <span className="btn__ar">{down ? <ArrowDown color={color} /> : <ArrowUpRight color={color} />}</span>
    </a>
  );
}

export function Ghost({ children, href = '#kviz', className = '', style, tabIndex }: { children: ReactNode; href?: string; className?: string; style?: CSSProperties; tabIndex?: number }) {
  return (
    <a href={href} className={`btn-ghost ${className}`} style={style} tabIndex={tabIndex}>
      {children}
    </a>
  );
}

export function CheckIcon({ size = 16, stroke = '#FFFFFF', pathStyle }: { size?: number; stroke?: string; pathStyle?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke={stroke} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
      <path d="M40,144l56,56L224,72" pathLength={pathStyle ? 1 : undefined} style={pathStyle} />
    </svg>
  );
}
