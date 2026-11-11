import type { PropsWithChildren, ReactNode } from 'react';

interface PageIntroProps { eyebrow: string; title: string; description?: string; action?: ReactNode }
export function PageIntro({ eyebrow, title, description, action, children }: PropsWithChildren<PageIntroProps>) {
  return <header className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}{children}</div>{action && <div className="page-intro-action">{action}</div>}</header>;
}
