import { db } from 'data/db';

export const GlobalSettingsRepo = {
  get() {
    return db.query.GlobalSettings.findFirst();
  },
};
