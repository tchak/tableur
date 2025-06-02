import { Breadcrumbs as HeroBreadcrumbs, BreadcrumbItem } from '@heroui/react';
import { useMatches, type UIMatch } from 'react-router';

export function Breadcrumbs() {
  const matches = useMatches();
  const breadcrumbs: Breadcrumb[] = [];
  for (const match of matches) {
    const breadcrumb = getBreadcrumb(match);
    if (breadcrumb) {
      breadcrumbs.push(breadcrumb);
    }
  }

  if (breadcrumbs.length) {
    return (
      <HeroBreadcrumbs>
        {breadcrumbs.map((breadcrumb, index) => (
          <BreadcrumbItem key={index} href={breadcrumb.path}>
            {breadcrumb.title}
          </BreadcrumbItem>
        ))}
      </HeroBreadcrumbs>
    );
  }
}

interface Breadcrumb {
  title: string;
  path: string;
}
type BreadcrumbFn<T = unknown> = (data: T) => Breadcrumb;
interface BreadcrumbHandle {
  breadcrumb: BreadcrumbFn;
}

function isBreadcrumb(handle: unknown): handle is BreadcrumbHandle {
  return !!(
    handle &&
    typeof handle == 'object' &&
    'breadcrumb' in handle &&
    typeof handle?.breadcrumb == 'function'
  );
}

function getBreadcrumb(match: UIMatch): Breadcrumb | false {
  const handle = match.handle;
  if (isBreadcrumb(handle)) {
    return handle.breadcrumb(match.data);
  }
  return false;
}

export function breadcrumb<T>(breadcrumb: (data: T) => Breadcrumb): {
  breadcrumb: BreadcrumbFn<T>;
} {
  return { breadcrumb };
}
