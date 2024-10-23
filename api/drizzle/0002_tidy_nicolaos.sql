CREATE TABLE `user_chapter_states` (
	`chapter_id` text NOT NULL,
	`read` integer,
	`percentage` real,
	`current_page` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_chapter_state` ON `user_chapter_states` (`chapter_id`);