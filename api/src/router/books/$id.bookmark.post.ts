import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler } from 'proute';
import { object, picklist } from 'valibot';

import { RESOURCES, ROUTES } from '../proute.generated.routes';

const conf = endpointConf(ROUTES.post['/books/:id/bookmark'], {
  responses: {
    200: object({
      book: RESOURCES.bookSummary,
    }),
    400: object({
      error: picklist(['INVALID_BOOK']),
    }),
    500: null,
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  params: { id },
  user,
}) => {
  try {
    const { error } = await BookRepo.bookmark.create({
      bookId: id,
      userId: user.id,
    });

    if (error) {
      return {
        status: 400,
        data: {
          error,
        },
      };
    }

    const updated = await BookRepo.get.byIdLatestUpdated(id);
    if (!updated) {
      return {
        status: 400,
        data: {
          error: 'INVALID_BOOK',
        },
      };
    }
    const bookStates = await BookRepo.get.booksStates(
      updated.sourceBooks.map((s) => s.source_book_id),
    );
    const userState = await BookRepo.userStates.get.byId({
      bookId: id,
      userId: user.id,
    });

    return {
      status: 200,
      data: {
        book: {
          book: updated,
          bookStates,
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
