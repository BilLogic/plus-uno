import * as React from 'react';

import { cn } from '@/storybook-docs/lib/utils';

export type DocPageWidth = 'narrow' | 'wide' | 'full';

const widthClass: Record<DocPageWidth, string> = {
  narrow: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-none',
};

export type DocPageProps = {
  children: React.ReactNode;
  className?: string;
  /** Default narrative width vs full-bleed catalog */
  width?: DocPageWidth;
};

/**
 * Root wrapper for PLUS Docs MDX: shadcn-style shell only (not DS components).
 */
export function DocPage({ children, className, width = 'narrow' }: DocPageProps) {
  return (
    <div
      className={cn(
        'sb-doc-shadcn mx-auto space-y-10 font-sans text-foreground',
        widthClass[width],
        className
      )}
    >
      {children}
    </div>
  );
}

export type DocHeroProps = {
  title: string;
  lead: string;
  className?: string;
  /** e.g. a Badge above the title */
  eyebrow?: React.ReactNode;
};

export function DocHero({ title, lead, className, eyebrow }: DocHeroProps) {
  return (
    <header className={cn('space-y-3', className)}>
      {eyebrow ? <div className="flex flex-wrap gap-2">{eyebrow}</div> : null}
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight text-balance">{title}</h1>
      <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">{lead}</p>
    </header>
  );
}

export type DocSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function DocSection({ title, children, className }: DocSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <h2 className="scroll-m-20 border-b border-border pb-2 text-2xl font-semibold tracking-tight first:mt-0">
        {title}
      </h2>
      {children}
    </section>
  );
}
