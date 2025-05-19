'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import MainNavBar from '@/components/nav-bar/MainNavBar'; 
import Footer from '@/components/nav-bar/MainFooter';
import { CookieConsent } from '@/features/cookies';

interface LayoutWrapperProps {
  children: ReactNode;
}

const HIDE_UI_PATHS = ['/matrix']; // Add any routes that should hide UI

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const shouldHideUI = HIDE_UI_PATHS.some((path) => pathname.startsWith(path));

  return (
    <>
      {!shouldHideUI && <MainNavBar />}

      <div className="w-full">
        {children}
        {!shouldHideUI && <CookieConsent />}
        {!shouldHideUI && <Footer />}
      </div>
    </>
  );
}
