import { House, Settings } from 'lucide-react';
import { ReactNode } from 'react';

const MenuItem = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => {
  return (
    <div className="w-full flex justify-center items-center border-2 border-transparent hover:border-grey rounded-lg transition-all">
      <a href={href}>
        <div className="flex justify-center items-center h-[40px] w-[40px] rounded">
          {children}
        </div>
      </a>
    </div>
  );
};

export const AppSideBar = () => {
  return (
    <div className="shrink-0 p-1 py-24 bg-mainbg">
      <div className="h-full flex flex-col gap-1 rounded-3xl pt-12 p-1 bg-accentbg text-accentbg-text">
        <MenuItem href="/">
          <House />
        </MenuItem>
        <MenuItem href="/">
          <Settings />
        </MenuItem>
      </div>
    </div>
  );
};
