import { db } from 'data/db';
import { GlobalSettings } from 'data/schema';
import { formatDuration } from 'lib/utils/format-duration';
import { forEach, map, omit, sortBy } from 'lodash';

export const checkGlobalSettings = async () => {
  const result = await db.transaction(async (tx) => {
    const [config] = await tx.select().from(GlobalSettings);
    if (config) {
      return {
        type: 'existing' as const,
        config,
      };
    }

    const [res] = await tx
      .insert(GlobalSettings)
      .values({
        id: 'global',
      })
      .returning();
    return {
      type: 'inited' as const,
      config: res,
    };
  });

  if (result.type === 'inited') {
    console.log(`[global-settings] Inited`);
  }

  // Log global settings
  forEach(
    sortBy(
      map(
        omit(result.config, ['id']),
        (value, key) => [value, key] as [any, string],
      ),
    ),
    ([value, configKey]) => {
      let formattedValue = value;
      if (configKey.endsWith('_ms')) {
        formattedValue = formatDuration(value);
      }
      if (configKey)
        console.log(`[global-settings] ${configKey}: ${formattedValue}`);
    },
  );
};
