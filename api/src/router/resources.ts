import { BookRepo } from 'data/repo/books-repo';
import { formatPublicS3Url } from 'lib/s3';
import { keyBy } from 'lodash';
import { combineReturnTypes, createResource, returnType } from 'proute';
import {
  array,
  object,
  string,
  boolean,
  number,
  nullable,
  date,
} from 'valibot';

const chapterUserState = object({
  chapter_id: string(),
  percentage: number(),
  read: boolean(),
  current_page: number(),
});

export const chapter = createResource({
  input: returnType<
    (typeof BookRepo)['chapters']['get']['byIdWithReadProgress']
  >,
  output: object({
    id: string(),
    chapter_id: string(),
    rank: number(),
    source_id: string(),
    source_book_id: string(),
    published_at: nullable(date()),
    pages: array(
      object({
        url: string(),
        width: number(),
        height: number(),
      }),
    ),
    created_at: nullable(date()),
    user_state: nullable(chapterUserState),
  }),
  map: (input) => ({
    id: input.id,
    chapter_id: input.chapter_id,
    rank: input.chapter_rank,

    source_id: input.source_id,
    source_book_id: input.source_book_id,

    pages: (input.pages as any[]).map((page) => ({
      url: formatPublicS3Url(page.s3_bucket, page.s3_key),
      width: page.width,
      height: page.height,
    })),

    published_at: input.published_at,
    created_at: input.created_at,

    user_state: {
      chapter_id: input.id,
      percentage: input.userState?.percentage ?? 0,
      current_page: input.userState?.current_page ?? 0,
      read: input.userState?.read ?? false,
    },
  }),
});

export const bookDetail = createResource({
  input: combineReturnTypes<{
    book: (typeof BookRepo)['get']['byIdWithChapters'];
    userState: (typeof BookRepo)['userStates']['get']['byId'] | undefined;
  }>,
  output: object({
    id: string(),
    title: string(),
    description: nullable(string()),
    cover_url: nullable(string()),
    created_at: nullable(date()),

    source_books: array(
      object({
        source_id: string(),
        source_book_id: string(),
        chapters: array(
          object({
            id: string(),
            chapter_id: string(),
            rank: number(),
            published_at: nullable(date()),
            user_state: chapterUserState,
          }),
        ),
      }),
    ),

    bookmarked: boolean(),
  }),
  map: ({ book, userState }) => ({
    id: book.id,
    title: book.title,
    description: book.description,
    last_chapter_updated_at: book.last_chapter_updated_at,
    cover_url:
      book.cover_s3_key && book.cover_s3_bucket
        ? formatPublicS3Url(book.cover_s3_bucket, book.cover_s3_key)
        : null,
    created_at: book.created_at,

    source_books: book.sourceBooks.map((sb) => ({
      source_id: sb.source_id,
      source_book_id: sb.source_book_id,
      chapters: sb.chapters.map((chapter) => ({
        id: chapter.id,
        chapter_id: chapter.chapter_id,
        rank: chapter.chapter_rank,
        published_at: chapter.published_at,
        user_state: {
          chapter_id: chapter.id,
          percentage: chapter.userState?.percentage ?? 0,
          read: chapter.userState?.read ?? false,
          current_page: chapter.userState?.current_page ?? 0,
        },
      })),
    })),

    bookmarked: userState?.bookmarked ?? false,
  }),
});

const bookSummaryOutput = object({
  id: string(),
  title: string(),
  description: nullable(string()),
  last_chapter_updated_at: nullable(date()),
  cover_url: nullable(string()),
  bookmarked: boolean(),

  unread_chapters_count: number(),
  latests_chapters: array(
    object({
      id: string(),
      chapter_id: string(),
      rank: number(),
      published_at: nullable(date()),
      user_state: nullable(chapterUserState),
    }),
  ),
});

export const bookSummary = createResource({
  input: combineReturnTypes<{
    book: (typeof BookRepo)['get']['byIdLatestUpdated'];
    bookStates: (typeof BookRepo)['get']['booksStates'];
    userState: (typeof BookRepo)['userStates']['get']['byId'] | undefined;
  }>,
  output: bookSummaryOutput,
  map: ({ book, bookStates, userState }) => {
    const stateBySource = keyBy(
      bookStates,
      (state) => `${state.source_id}::${state.source_book_id}`,
    );

    const bookState = book.sourceBooks.map(
      (sb) => stateBySource[`${sb.source_id}::${sb.source_book_id}`],
    );

    return {
      id: book.id,
      title: book.title,
      description: book.description,
      last_chapter_updated_at: book.last_chapter_updated_at,
      unread_chapters_count: Math.max(
        0,
        ...bookState.map((state) => state?.unread_count ?? 0),
      ),
      cover_url:
        book.cover_s3_key && book.cover_s3_bucket
          ? formatPublicS3Url(book.cover_s3_bucket, book.cover_s3_key)
          : null,
      bookmarked: userState?.bookmarked ?? false,
      latests_chapters: book.sourceBooks.flatMap((sb) =>
        sb.chapters.map((chapter) => {
          const userState = chapter.userState
            ? {
                chapter_id: chapter.id,
                percentage: chapter.userState.percentage ?? 0,
                read: chapter.userState.read ?? false,
                current_page: chapter.userState.current_page ?? 0,
              }
            : null;

          return {
            id: chapter.id,
            chapter_id: chapter.chapter_id,
            rank: chapter.chapter_rank,
            published_at: chapter.published_at,
            user_state: userState,
          };
        }),
      ),
    };
  },
});

export const bookSummaries = createResource({
  input: combineReturnTypes<{
    books: (typeof BookRepo)['get']['latestUpdateds'];
    bookStates: (typeof BookRepo)['get']['booksStates'];
    userStates: (typeof BookRepo)['userStates']['list'];
  }>,
  output: array(bookSummaryOutput),
  map: ({ books, bookStates, userStates }) => {
    const stateByBookId = keyBy(userStates, (state) => state.book_id);
    const stateBySource = keyBy(
      bookStates,
      (state) => `${state.source_id}::${state.source_book_id}`,
    );

    return books.map((book) => {
      const bookStates = book.sourceBooks.map(
        (sb) => stateBySource[`${sb.source_id}::${sb.source_book_id}`] ?? [],
      );

      return {
        id: book.id,
        title: book.title,
        description: book.description,
        last_chapter_updated_at: book.last_chapter_updated_at,
        unread_chapters_count: Math.max(
          0,
          ...bookStates.map((state) => state?.unread_count ?? 0),
        ),
        cover_url:
          book.cover_s3_key && book.cover_s3_bucket
            ? formatPublicS3Url(book.cover_s3_bucket, book.cover_s3_key)
            : null,
        bookmarked: stateByBookId[book.id]?.bookmarked ?? false,
        latests_chapters: book.sourceBooks.flatMap((sb) =>
          sb.chapters.map((chapter) => {
            const userState = chapter.userState
              ? {
                  chapter_id: chapter.id,
                  percentage: chapter.userState.percentage ?? 0,
                  read: chapter.userState.read ?? false,
                  current_page: chapter.userState.current_page ?? 0,
                }
              : null;

            return {
              id: chapter.id,
              chapter_id: chapter.chapter_id,
              rank: chapter.chapter_rank,
              published_at: chapter.published_at,
              user_state: userState,
            };
          }),
        ),
      };
    });
  },
});
