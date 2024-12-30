import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import dayjs from 'dayjs';
import { fetchBook } from 'lib/cron-jobs/fetch-book';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { object } from 'valibot';

import { RESOURCES, ROUTES } from '../proute.generated.routes';

const conf = endpointConf(ROUTES.post['/books/:id/refetch'], {
  responses: {
    200: object({
      book: RESOURCES.bookDetail,
    }),
    404: null,
    500: null,
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  params: { id },
  user,
}) => {
  try {
    const book = await BookRepo.get.byIdWithChapters(id);
    if (!book) {
      return {
        status: 404,
      };
    }

    const userState = await BookRepo.userStates.get.byId({
      bookId: id,
      userId: user.id,
    });

    if (
      book.last_detail_updated_at &&
      dayjs(book.last_detail_updated_at).isAfter(dayjs().subtract(10, 'minute'))
    ) {
      return {
        status: 200,
        data: {
          book: {
            book,
            userState,
          },
        },
      };
    }

    await fetchBook(id);
    const updated = await BookRepo.get.byIdWithChapters(id);
    if (!updated) {
      return {
        status: 404,
      };
    }

    return {
      status: 200,
      data: {
        book: {
          book: updated,
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
