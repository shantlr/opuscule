import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { endpointConf, EndpointHandler } from 'proute';
import { object, union, literal } from 'valibot';

import { RESOURCES, ROUTES } from '../base-conf';

const conf = endpointConf({
  route: ROUTES.post['/books/:id/bookmark'],
  responses: {
    200: object({
      book: RESOURCES.bookSummary,
    }),
    400: object({
      error: union([literal('INVALID_BOOK')]),
    }),
    500: null,
  },
});

const handler: EndpointHandler<typeof conf> = async ({ params: { id } }) => {
  try {
    const { error } = await BookRepo.bookmark.create(id);

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
    const userState = await BookRepo.userStates.get.byId(id);

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
