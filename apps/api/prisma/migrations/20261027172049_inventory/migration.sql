ALTER TABLE `users` ADD COLUMN `warehouse_id` INTEGER NULL;

CREATE TABLE `warehouses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `product_types_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `date` DATETIME(3) NOT NULL,
    `warehouse_id` INTEGER NULL,
    `created_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `orders_date_idx`(`date`),
    INDEX `orders_warehouse_id_idx`(`warehouse_id`),
    INDEX `orders_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serial_number` VARCHAR(64) NOT NULL,
    `is_new` BOOLEAN NOT NULL DEFAULT true,
    `photo` VARCHAR(255) NULL,
    `title` VARCHAR(255) NOT NULL,
    `type_id` INTEGER NOT NULL,
    `specification` VARCHAR(255) NOT NULL,
    `status` ENUM('FREE', 'IN_REPAIR') NOT NULL DEFAULT 'FREE',
    `guarantee_start` DATETIME(3) NOT NULL,
    `guarantee_end` DATETIME(3) NOT NULL,
    `order_id` INTEGER NOT NULL,
    `group_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_serial_number_key`(`serial_number`),
    INDEX `products_order_id_idx`(`order_id`),
    INDEX `products_type_id_specification_idx`(`type_id`, `specification`),
    INDEX `products_group_id_idx`(`group_id`),
    INDEX `products_user_id_idx`(`user_id`),
    INDEX `products_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `value` DECIMAL(12, 2) NOT NULL,
    `symbol` ENUM('USD', 'UAH') NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `product_prices_product_id_symbol_key`(`product_id`, `symbol`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `users_warehouse_id_idx` ON `users`(`warehouse_id`);

ALTER TABLE `users` ADD CONSTRAINT `users_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `orders` ADD CONSTRAINT `orders_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `orders` ADD CONSTRAINT `orders_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `products` ADD CONSTRAINT `products_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `product_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `products` ADD CONSTRAINT `products_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `products` ADD CONSTRAINT `products_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `product_groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `products` ADD CONSTRAINT `products_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `product_prices` ADD CONSTRAINT `product_prices_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
