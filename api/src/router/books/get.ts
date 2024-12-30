import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { authenticated } from 'middlewares';
import { endpointConf, EndpointHandler, example } from 'proute';
import {
  object,
  pipe,
  transform,
  optional,
  description,
  picklist,
} from 'valibot';

import { RESOURCES, ROUTES } from '../proute.generated.routes';

const coerceBoolean = pipe(
  picklist(['true', 'false']),
  example('true'),
  example('false'),

  transform((v) => v === 'true'),
);

const conf = endpointConf(ROUTES.get['/books'], {
  query: object({
    bookmarked: optional(coerceBoolean),
    has_unread: optional(coerceBoolean),
  }),
  responses: {
    200: pipe(
      object({
        books: RESOURCES.bookSummaries,
      }),
      description('List of books'),
    ),
    500: null,
  },
}).middleware(authenticated);

const handler: EndpointHandler<typeof conf> = async ({
  query: { bookmarked, has_unread },
  user,
}) => {
  try {
    const books = await BookRepo.get.latestUpdateds({
      bookmarked,
      hasUnread: has_unread,
      userId: user.id,
    });
    const userStates = await BookRepo.userStates.list({
      bookIds: books.map((book) => book.id),
      userId: user.id,
    });
    const bookStates = await BookRepo.get.booksStates(
      books.flatMap((book) => book.sourceBooks.map((sb) => sb.source_book_id)),
    );

    return {
      status: 200,
      data: {
        books: {
          books,
          bookStates,
          userStates,
        },
      },
    };
  } catch (err) {
    logger.error(err);
    return {
      status: 500,
      data: null,
    };
  }
};

export default { conf, handler };
