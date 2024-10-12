CREATE TABLE `user_book_states` (
	`book_id` text NOT NULL,
	`bookmarked` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_book_state` ON `user_book_states` (`book_id`);