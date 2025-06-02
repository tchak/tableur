import { useNavigate, useHref } from 'react-router';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import type { ReactNode } from 'react';

export function UIProvider({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <HeroUIProvider
      locale={locale}
      navigate={navigate}
      useHref={useHref}
      reducedMotion="user"
    >
      <ToastProvider disableAnimation />
      {children}
    </HeroUIProvider>
  );
}
