-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema cringeit_schema
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `cringeit_schema` ;

-- -----------------------------------------------------
-- Schema cringeit_schema
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `cringeit_schema` ;
USE `cringeit_schema` ;

-- -----------------------------------------------------
-- Table `cringeit_schema`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cringeit_schema`.`users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `email` VARCHAR(90) NOT NULL,
  `password_hash` CHAR(60) NOT NULL,
  `is_admin` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE,
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cringeit_schema`.`cringe`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cringeit_schema`.`cringe` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `headline` VARCHAR(60) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`, `user_id`),
  INDEX `fk_cringe_users_idx` (`user_id` ASC) VISIBLE,
  CONSTRAINT `fk_cringe_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `cringeit_schema`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cringeit_schema`.`cringe_ratings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cringeit_schema`.`cringe_ratings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cringe_id` INT NOT NULL,
  `user_id` INT NULL,
  `delta` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `fk_cringe_has_users_users1_idx` (`user_id` ASC) VISIBLE,
  INDEX `fk_cringe_has_users_cringe1_idx` (`cringe_id` ASC) VISIBLE,
  PRIMARY KEY (`id`, `cringe_id`),
  CONSTRAINT `fk_rating_cringe`
    FOREIGN KEY (`cringe_id`)
    REFERENCES `cringeit_schema`.`cringe` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_rating_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `cringeit_schema`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cringeit_schema`.`comments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cringeit_schema`.`comments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `cringe_id` INT NOT NULL,
  `parent_comment_id` INT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`, `user_id`, `cringe_id`),
  INDEX `fk_cringe_has_users_users2_idx` (`user_id` ASC) VISIBLE,
  INDEX `fk_cringe_has_users_cringe2_idx` (`cringe_id` ASC) VISIBLE,
  INDEX `fk_comments_reply_idx` (`parent_comment_id` ASC) VISIBLE,
  CONSTRAINT `fk_comments_cringe`
    FOREIGN KEY (`cringe_id`)
    REFERENCES `cringeit_schema`.`cringe` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `cringeit_schema`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_reply`
    FOREIGN KEY (`parent_comment_id`)
    REFERENCES `cringeit_schema`.`comments` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cringeit_schema`.`comment_ratings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cringeit_schema`.`comment_ratings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `comment_id` INT NOT NULL,
  `user_id` INT NULL,
  `delta` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `fk_comment_ratings_1_idx` (`user_id` ASC) VISIBLE,
  PRIMARY KEY (`id`, `comment_id`),
  CONSTRAINT `fk_comment_ratings_comment`
    FOREIGN KEY (`comment_id`)
    REFERENCES `cringeit_schema`.`comments` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comment_ratings_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `cringeit_schema`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cringeit_schema`.`suspensions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cringeit_schema`.`suspensions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `admin_user_id` INT NULL,
  `suspended_user_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` DATETIME NULL,
  INDEX `fk_suspensions_users1_idx` (`suspended_user_id` ASC) VISIBLE,
  INDEX `fk_suspensions_admin_idx` (`admin_user_id` ASC) VISIBLE,
  PRIMARY KEY (`id`, `suspended_user_id`),
  CONSTRAINT `fk_suspensions_users1`
    FOREIGN KEY (`suspended_user_id`)
    REFERENCES `cringeit_schema`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_suspensions_admin`
    FOREIGN KEY (`admin_user_id`)
    REFERENCES `cringeit_schema`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cringeit_schema`.`whines`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cringeit_schema`.`whines` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `cringe_id` INT NULL,
  `cringe_user_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`, `user_id`),
  INDEX `fk_cringe_has_users_users2_idx` (`user_id` ASC) VISIBLE,
  INDEX `fk_whines_cringe_user_idx` (`cringe_user_id` ASC) VISIBLE,
  CONSTRAINT `fk_whines_cringe`
    FOREIGN KEY (`cringe_id`)
    REFERENCES `cringeit_schema`.`cringe` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_whines_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `cringeit_schema`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_whines_cringe_user`
    FOREIGN KEY (`cringe_user_id`)
    REFERENCES `cringeit_schema`.`cringe` (`user_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
