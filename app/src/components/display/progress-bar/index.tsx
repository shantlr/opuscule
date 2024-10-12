import clsx from 'clsx';

export const ProgressBar = ({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) => {
  return (
    <div
      className={clsx(
        className,
        'bg-slate-500 h-[8px] rounded overflow-hidden',
      )}
    >
      <div
        className={clsx('bg-slate-200 h-full rounded')}
        style={{
          width: `${percent * 100}%`,
        }}
      />
    </div>
  );
};
