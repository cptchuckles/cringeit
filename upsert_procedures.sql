DELIMITER $$

DROP PROCEDURE IF EXISTS `UpsertCringeRating`$$
DROP PROCEDURE IF EXISTS `UpsertCommentRating`$$

CREATE PROCEDURE `UpsertCringeRating`(
    c INT,
    u INT,
    d TINYINT
)
BEGIN
    IF EXISTS(SELECT * FROM `cringe_ratings` WHERE `cringe_id` = c AND `user_id` = u)
    THEN UPDATE `cringe_ratings`
        SET `delta` = d
        WHERE `cringe_id` = c AND `user_id` = u;
    ELSE INSERT INTO `cringe_ratings`
        (`cringe_id`, `user_id`, `delta`)
        VALUES
        (c, u, d);
    END IF;
END $$

CREATE PROCEDURE `UpsertCommentRating`(
    c INT,
    u INT,
    d TINYINT
)
BEGIN
    IF EXISTS(SELECT * FROM `comment_ratings` WHERE `comment_id` = c AND `user_id` = u)
    THEN UPDATE `comment_ratings`
        SET `delta` = d
        WHERE `comment_id` = c AND `user_id` = u;
    ELSE INSERT INTO `comment_ratings`
        (`comment_id`, `user_id`, `delta`)
        VALUES
        (c, u, d);
    END IF;
END $$

DELIMITER ;
