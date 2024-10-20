import { Bookmark, House, Settings } from 'lucide-react';
import { ReactNode } from 'react';

const MenuItem = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => {
  return (
    <div className="w-full flex justify-center items-center border border-transparent group rounded-lg transition-all">
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
    <div className="shrink-0 bg-mainbg">
      <div className="h-full flex flex-col pt-48 gap-1 pt-12 p-1 bg-mainbg text-grey">
        <MenuItem href="/">
          <House className="fill-transparent group-hover:fill-grey transition-all" />
        </MenuItem>
        <MenuItem href="/bookmarked">
          <Bookmark className="fill-transparent group-hover:fill-grey transition-all" />
        </MenuItem>
        <MenuItem href="/settings">
          <Settings className="fill-transparent group-hover:fill-grey transition-all" />
        </MenuItem>
      </div>
    </div>
  );
};
