CREATE TABLE `content` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_kind_slug` ON `content` (`kind`,`slug`);--> statement-breakpoint
CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`created` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`data` text NOT NULL,
	`files` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`notification` text DEFAULT 'Not configured' NOT NULL,
	`ready` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_token_unique` ON `enquiries` (`token`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`mime` text NOT NULL,
	`filename` text NOT NULL,
	`created` text NOT NULL
);
