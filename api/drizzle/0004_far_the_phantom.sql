DROP INDEX IF EXISTS `unique_source_chapter`;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_source_chapter` ON `chapters` (`source_id`,`source_book_id`,`chapter_id`);