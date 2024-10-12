import clsx from 'clsx';
import { ComponentProps } from 'react';

export const ButtonIcon = ({
  className,
  ...props
}: ComponentProps<'button'>) => {
  return (
    <button
      className={clsx('hover:opacity-60 transition-all', className)}
      {...props}
    />
  );
};
