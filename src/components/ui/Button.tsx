import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { ArrowRight } from 'lucide-react';
import { cx } from './motion';

/** primary: solid accent. secondary (alias outline): white with border. tertiary: accent text with arrow. ink and ghost are quiet extras. */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ink' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon (any node, usually a lucide icon at 16px). */
  icon?: ReactNode;
  /** Trailing icon. */
  iconEnd?: ReactNode;
  /** Keyboard shortcut hint shown inside the button, e.g. "R". */
  kbd?: string;
  /** Shows a spinner, sets aria-busy and blocks activation. */
  loading?: boolean;
  fullWidth?: boolean;
  /** Trailing arrow. Default true for the tertiary variant, false otherwise. */
  arrow?: boolean;
  className?: string;
  children?: ReactNode;
}
type AsButton = Common & { href?: undefined; ref?: Ref<HTMLButtonElement> } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common>;
type AsLink = Common & { href: string; ref?: Ref<HTMLAnchorElement> } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Common | 'href'>;
export type ButtonProps = AsButton | AsLink;

const isHttp = (href: string) => /^(https?:)?\/\//.test(href);
const isPlainAnchor = (href: string) => isHttp(href) || href.startsWith('mailto:') || /\.(txt|json|md)$/.test(href);

function Inner({ icon, iconEnd, kbd, loading, children }: Pick<Common, 'icon' | 'iconEnd' | 'kbd' | 'loading' | 'children'>) {
  return (
    <>
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : icon ? <span className="ui-btn-icon" aria-hidden="true">{icon}</span> : null}
      {children != null && <span className="ui-btn-label">{children}</span>}
      {iconEnd && !loading && <span className="ui-btn-icon" aria-hidden="true">{iconEnd}</span>}
      {kbd && <kbd className="ui-btn-kbd">{kbd}</kbd>}
    </>
  );
}

/** Accent, white, text-arrow, ink and ghost buttons (13px/500, 32/36/44px). Renders a Next Link (or a plain <a> for external URLs) when given `href`. */
export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', icon, iconEnd: iconEndProp, arrow = variant === 'tertiary', kbd, loading, fullWidth, className, children, ...rest } = props;
  const iconEnd = iconEndProp ?? (arrow ? <ArrowRight size={14} strokeWidth={1.75} /> : undefined);
  const cls = cx('ui-btn', `ui-btn-${variant}`, `ui-btn-${size}`, fullWidth && 'ui-btn-full', loading && 'is-loading', className);
  const inner = (
    <Inner icon={icon} iconEnd={iconEnd} kbd={kbd} loading={loading}>
      {children}
    </Inner>
  );
  if ('href' in rest && typeof rest.href === 'string') {
    const { href, ref, onClick, ...a } = rest as Omit<AsLink, keyof Common>;
    const block = Boolean(loading) || a['aria-disabled'] === true || a['aria-disabled'] === 'true';
    const common = {
      ...a,
      className: cls,
      'aria-busy': loading || undefined,
      'aria-disabled': block || undefined,
      tabIndex: block ? -1 : a.tabIndex,
      onClick: block ? (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault() : onClick,
    };
    if (isPlainAnchor(href)) {
      return (
        <a ref={ref} href={href} {...(isHttp(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...common}>
          {inner}
        </a>
      );
    }
    return (
      <Link ref={ref} href={href} {...common}>
        {inner}
      </Link>
    );
  }
  const { ref, disabled, type = 'button', ...b } = rest as Omit<AsButton, keyof Common>;
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cls} {...b}>
      {inner}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Required accessible name. */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'outline' | 'secondary' | 'ink';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/** Square icon-only button with a required `label`. */
export function IconButton({ label, icon, variant = 'ghost', size = 'md', loading, className, type = 'button', disabled, ref, ...rest }: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx('ui-icon-btn', `ui-btn-${variant}`, `ui-ib-${size}`, loading && 'is-loading', className)}
      {...rest}
    >
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : icon}
    </button>
  );
}
