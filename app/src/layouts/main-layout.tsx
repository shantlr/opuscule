import { AppSideBar } from 'components/domains/app-side-bar';
import { ReactNode } from 'react';

export const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex h-full w-full overflow-hidden bg-mainbg">
      <AppSideBar />
      <main className="flex w-full h-full overflow-hidden">{children}</main>
    </div>
  );
};
