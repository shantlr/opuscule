CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`s3_bucket` text,
	`s3_key` text,
	`last_chapter_updated_at` integer,
	`last_detail_updated_at` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` text PRIMARY KEY NOT NULL,
	`chapter_id` text NOT NULL,
	`chapter_rank` real NOT NULL,
	`source_id` text NOT NULL,
	`source_book_id` text NOT NULL,
	`pages` text,
	`published_at` integer,
	`published_at_accuracy` integer,
	`created_at` integer,
	FOREIGN KEY (`source_id`,`source_book_id`) REFERENCES `source_books`(`source_id`,`source_book_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fetch_sessions` (
	`key` text PRIMARY KEY NOT NULL,
	`user_agent` text NOT NULL,
	`cookies` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `global_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`fetch_latests_min_delay_ms` integer DEFAULT 10800000 NOT NULL,
	`fetch_latests_interval_ms` integer DEFAULT 1800000
);
--> statement-breakpoint
CREATE TABLE `html_caches` (
	`key` text PRIMARY KEY NOT NULL,
	`data` text,
	`status` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`subscribed` integer,
	`last_fetch` integer
);
--> statement-breakpoint
CREATE TABLE `source_books` (
	`source_id` text NOT NULL,
	`source_book_id` text NOT NULL,
	`source_book_key` text,
	`book_id` text,
	`last_chapter_updated_at` integer,
	`last_fetched_details_at` integer,
	`title` text NOT NULL,
	`title_accuracy` integer,
	`description` text,
	`description_accuracy` integer,
	`cover_s3_bucket` text,
	`cover_s3_key` text,
	`cover_origin_url` text,
	PRIMARY KEY(`source_id`, `source_book_id`),
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_book_states` (
	`book_id` text NOT NULL,
	`bookmarked` integer
);
--> statement-breakpoint
CREATE TABLE `user_chapter_states` (
	`chapter_id` text NOT NULL,
	`read` integer,
	`percentage` real,
	`current_page` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_source_chapter` ON `chapters` (`source_id`,`source_book_id`,`chapter_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_book_state` ON `user_book_states` (`book_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_chapter_state` ON `user_chapter_states` (`chapter_id`);