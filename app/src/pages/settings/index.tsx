import { useSources } from 'hooks/api/use-sources';
import { MainLayout } from 'layouts/main-layout';

export const SettingsPage = () => {
  const { data } = useSources({});

  return (
    <MainLayout>
      <div className="w-full h-full overflow-auto p-4 px-8">
        <ul>{data?.map((source) => <li key={source.id}>{source.name}</li>)}</ul>
      </div>
    </MainLayout>
  );
};
