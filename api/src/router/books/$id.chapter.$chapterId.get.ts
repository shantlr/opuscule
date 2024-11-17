import { BookRepo } from 'data/repo/books-repo';
import { fetchChapter } from 'lib/cron-jobs/fetch-chapter';
import { endpointConf, EndpointHandler } from 'proute';
import { RESOURCES, ROUTES } from 'router/base-conf';
import { object } from 'valibot';

const conf = endpointConf({
  route: ROUTES.get['/books/:id/chapter/:chapterId'],
  responses: {
    200: object({
      chapter: RESOURCES.chapter,
    }),
    404: null,
  },
});

const handler: EndpointHandler<typeof conf> = async (req) => {
  const chapter = await BookRepo.chapters.get.byIdWithReadProgress(
    req.params.chapterId,
  );

  if (!chapter) {
    return {
      status: 404,
      data: null,
    };
  }

  if (chapter && !chapter.pages) {
    await fetchChapter({
      chapterId: chapter.id,
    });
    const updated = await BookRepo.chapters.get.byIdWithReadProgress(
      chapter.id,
    );
    if (!updated) {
      return {
        status: 404,
        data: null,
      };
    }

    return {
      status: 200,
      data: {
        chapter: updated,
      },
    };
  }

  return {
    status: 200,
    data: {
      chapter,
    },
  };
};

export default {
  conf,
  handler,
};
