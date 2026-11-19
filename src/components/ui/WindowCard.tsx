import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from './motion';

export interface WindowTab {
  id: string;
  label: ReactNode;
}

export interface WindowCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  as?: ElementType;
  /** Header strip with three dots. Default true. */
  chrome?: boolean;
  /** Text after the dots, e.g. a file or app name (mono). */
  title?: ReactNode;
  /** Mono tab labels in the header. Strings or {id, label}. */
  tabs?: Array<string | WindowTab>;
  /** Active tab id. With `onTabChange` the tabs are buttons; without it they are static labels. */
  activeTab?: string;
  onTabChange?: (id: string) => void;
  /** Right side of the header, e.g. an "Analyze again" button. */
  action?: ReactNode;
  /** Real code and terminal panels only: dark palette. */
  dark?: boolean;
  /** Padding of the body. Default none (the body is usually a grid or table). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const norm = (t: string | WindowTab): WindowTab => (typeof t === 'string' ? { id: t, label: t } : t);

/** App/browser window: three dots, mono tab labels, an action, then the body. Light by default; `dark` for code. Server-safe. */
export function WindowCard({ as: Tag = 'div', chrome = true, title, tabs, activeTab, onTabChange, action, dark, padding = 'none', className, children, ...rest }: WindowCardProps) {
  const list = tabs?.map(norm) ?? [];
  const current = activeTab ?? list[0]?.id;
  return (
    <Tag className={cx('ui-win', dark && 'ui-win-dark', className)} {...rest}>
      {chrome && (
        <div className="ui-win-bar">
          <span className="ui-win-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {title != null && <span className="ui-win-title">{title}</span>}
          {list.length > 0 && (
            <div className="ui-win-tabs">
              {list.map((t) =>
                onTabChange ? (
                  <button key={t.id} type="button" className="ui-win-tab" data-on={t.id === current} aria-pressed={t.id === current} onClick={() => onTabChange(t.id)}>
                    {t.label}
                  </button>
                ) : (
                  <span key={t.id} className="ui-win-tab" data-on={t.id === current} aria-current={t.id === current ? 'true' : undefined}>
                    {t.label}
                  </span>
                ),
              )}
            </div>
          )}
          {action != null && <div className="ui-win-action">{action}</div>}
        </div>
      )}
      <div className={cx('ui-win-body', `ui-pad-${padding}`)}>{children}</div>
    </Tag>
  );
}
