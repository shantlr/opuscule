import { FetchPicuresJobRepo } from 'data/repo/fetch-picture-job';
import { FetchPicturesJob } from 'data/schema';

const processNextJob = async () => {
  const nextJob = await FetchPicuresJobRepo.get.next();
  if (!nextJob) {
    return;
  }

  try {
    await handleJob(nextJob);
  } catch (err) {
    console.log(`[picture-service] failed to handle job '${nextJob.id}`, err);
    throw err;
  }
};

async function handleJob(job: (typeof FetchPicturesJob)['$inferSelect']) {
  const batch = job.data;
}

export const pictureFetcherService = {
  start() {},
  stop() {},
};
