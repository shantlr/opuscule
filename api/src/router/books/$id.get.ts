import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { fetchBook } from 'lib/cron-jobs/fetch-book';
import { endpointConf, EndpointHandler } from 'proute';
import { object } from 'valibot';

import { RESOURCES, ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.get['/books/:id'],
  responses: {
    200: object({
      book: RESOURCES.bookDetail,
    }),
    404: null,
    500: null,
  },
});

const handler: EndpointHandler<typeof conf> = async ({ params: { id } }) => {
  try {
    let book = await BookRepo.get.byIdWithChapters(id);
    const userState = await BookRepo.userStates.get.byId(id);

    // if details never fetched, fetch it
    if (book && !book.last_detail_updated_at) {
      await fetchBook(book.id);
      book = await BookRepo.get.byIdWithChapters(book.id);
    }

    if (!book) {
      return {
        status: 404,
      };
    }

    return {
      status: 200,
      data: {
        book: {
          book,
          userState,
        },
      },
    };
  } catch (err) {
    logger.error(err);
    return {
      status: 500,
    };
  }
};

export default { conf, handler };
