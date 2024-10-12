import { ReactNode } from 'react';

export const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex h-full w-full overflow-hidden p-4 bg-stone-100">
      {children}
    </div>
  );
};
