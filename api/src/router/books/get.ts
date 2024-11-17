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

const conf = endpointConf({
  route: ROUTES.get['/books'],
  query: object({
    bookmarked: optional(
      pipe(
        union([literal('true'), literal('false')]),
        example('true'),
        example('false'),

        transform((v) => v === 'true'),
      ),
    ),
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
  query: { bookmarked },
}) => {
  try {
    const books = await BookRepo.get.latestUpdateds({ bookmarked });
    const userStates = await BookRepo.userStates.list(
      books.map((book) => book.id),
    );

    return {
      status: 200,
      data: {
        books: {
          books,
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
