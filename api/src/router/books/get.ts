import { logger } from 'config/logger';
import { BookRepo } from 'data/repo/books-repo';
import { endpointConf, EndpointHandler, example } from 'proute';
import {
  object,
  pipe,
  literal,
  transform,
  optional,
  union,
  description,
} from 'valibot';

import { RESOURCES, ROUTES } from '../base-conf';

const coerceBoolean = pipe(
  union([literal('true'), literal('false')]),
  example('true'),
  example('false'),

  transform((v) => v === 'true'),
);

const conf = endpointConf({
  route: ROUTES.get['/books'],
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
});

const handler: EndpointHandler<typeof conf> = async ({
  query: { bookmarked, has_unread },
}) => {
  try {
    const books = await BookRepo.get.latestUpdateds({
      bookmarked,
      hasUnread: has_unread,
    });
    const userStates = await BookRepo.userStates.list(
      books.map((book) => book.id),
    );
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
