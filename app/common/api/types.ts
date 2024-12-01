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
  unread_chapters_count: number;
  last_chapter_updated_at: Date | null;
  latests_chapters: ApiChapterSummary[];
  bookmarked: boolean;
};

export type ApiBookDetail = ApiBookSummary & {
  chapters: ApiChapterSummary[];
};
export type ApiSourceBook = {
  source_id: string;
  source_book_id: string;
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
  rank: number;
  published_at: Date | null;
  source_id: string;
  user_state: {
    percentage: number;
    page: number;
    read: boolean;
    read_at: Date | null;
  } | null;
};

export type ApiChapter = {
  id: string;
  chapter_id: string;
  rank: number;
  published_at: Date | null;
  source_book_id: string;
  source_id: string;
  pages: ApiChapterPage[] | undefined;
  user_state?: {
    current_page: number;
    percentage: number;
    read: boolean;
  };
};
