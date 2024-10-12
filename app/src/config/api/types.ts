export type ApiSource = {
  id: string;
  name: string;
  url: string;
  subscribed: boolean;
};

export type ApiBookSummary = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  last_chapter_updated_at: Date | null;
  latests_chapters: ApiChapterSummary[];
};

export type ApiBookDetail = ApiBookSummary & {
  sourceBooks: ApiSourceBook[];
};
export type ApiSourceBook = {
  chapters: ApiChapterSummary[];
};

export type ApiChapterPage = {
  url: string;
  width: number;
  height: number;
};

export type ApiChapterSummary = {
  id: string;
  chapter_id: string;
  chapter_rank: number;
  published_at: Date | null;
};

export type ApiChapter = {
  id: string;
  chapter_id: string;
  chapter_rank: number;
  published_at: Date | null;
  source_book_id: string;
  source_id: string;
  pages: ApiChapterPage[] | undefined;
};
