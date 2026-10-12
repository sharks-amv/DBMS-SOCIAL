-- ============================================================
-- SUPABASE SOCIAL NETWORK SCHEMA & SEED DATA
-- DBMS-SOCIAL
-- ============================================================

-- Drop existing tables/functions if needed (clean setup)
DROP TRIGGER IF EXISTS trg_notify_follow ON user_follow;
DROP TRIGGER IF EXISTS trg_notify_like ON post_like;
DROP TRIGGER IF EXISTS trg_notify_comment ON post_comment;
DROP TRIGGER IF EXISTS trg_notify_message ON message;

DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS message CASCADE;
DROP TABLE IF EXISTS social_account CASCADE;
DROP TABLE IF EXISTS social_platform CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS post_hashtag CASCADE;
DROP TABLE IF EXISTS hashtag CASCADE;
DROP TABLE IF EXISTS user_follow CASCADE;
DROP TABLE IF EXISTS post_like CASCADE;
DROP TABLE IF EXISTS post_comment CASCADE;
DROP TABLE IF EXISTS post CASCADE;
DROP TABLE IF EXISTS profile CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;

-- ============================ TABLES ============================

CREATE TABLE app_user (
    user_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name           VARCHAR(100),
    email          VARCHAR(150) UNIQUE,
    password       VARCHAR(255),
    date_joined    TIMESTAMPTZ DEFAULT NOW(),
    date_of_birth  DATE,
    bio            VARCHAR(500)
);

CREATE TABLE profile (
    profile_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          BIGINT REFERENCES app_user(user_id) ON DELETE CASCADE,
    profile_picture  VARCHAR(255),
    location         VARCHAR(150),
    website          VARCHAR(255)
);

CREATE TABLE post (
    post_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT REFERENCES app_user(user_id) ON DELETE CASCADE,
    content      VARCHAR(2000),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    visibility   VARCHAR(10) DEFAULT 'public',
    post_type    VARCHAR(20) DEFAULT 'status'
);

CREATE TABLE post_comment (
    comment_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id       BIGINT REFERENCES post(post_id) ON DELETE CASCADE,
    user_id       BIGINT REFERENCES app_user(user_id) ON DELETE CASCADE,
    comment_text  VARCHAR(1000),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_like (
    post_id   BIGINT REFERENCES post(post_id) ON DELETE CASCADE,
    user_id   BIGINT REFERENCES app_user(user_id) ON DELETE CASCADE,
    liked_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE user_follow (
    follower_id   BIGINT REFERENCES app_user(user_id) ON DELETE CASCADE,
    following_id  BIGINT REFERENCES app_user(user_id) ON DELETE CASCADE,
    followed_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE hashtag (
    hashtag_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hashtag_name  VARCHAR(100) UNIQUE
);

CREATE TABLE post_hashtag (
    post_id     BIGINT REFERENCES post(post_id) ON DELETE CASCADE,
    hashtag_id  BIGINT REFERENCES hashtag(hashtag_id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

CREATE TABLE media (
    media_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id      BIGINT REFERENCES post(post_id) ON DELETE CASCADE,
    media_url    VARCHAR(500),
    media_type   VARCHAR(10),
    uploaded_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE social_platform (
    platform_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    platform_name  VARCHAR(100) UNIQUE,
    platform_url   VARCHAR(255)
);

CREATE TABLE social_account (
    account_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT REFERENCES app_user(user_id) ON DELETE CASCADE,
    platform_id     BIGINT REFERENCES social_platform(platform_id) ON DELETE CASCADE,
    username        VARCHAR(100),
    account_status  VARCHAR(10) DEFAULT 'active',
    connected_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message (
    message_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sender_id     BIGINT REFERENCES app_user(user_id) ON DELETE CASCADE,
    receiver_id   BIGINT REFERENCES app_user(user_id) ON DELETE CASCADE,
    message_text  VARCHAR(2000),
    sent_at       TIMESTAMPTZ DEFAULT NOW(),
    is_read       CHAR(1) DEFAULT 'N'
);

CREATE TABLE notification (
    notification_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT REFERENCES app_user(user_id) ON DELETE CASCADE,
    notification_type  VARCHAR(20),
    notification_text  VARCHAR(500),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    is_read              CHAR(1) DEFAULT 'N'
);

-- ============================ TRIGGER FUNCTIONS ============================

-- 1. Notify follow
CREATE OR REPLACE FUNCTION fn_notify_follow()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification (user_id, notification_type, notification_text)
    VALUES (NEW.following_id, 'FOLLOW', 'You have a new follower');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_follow
AFTER INSERT ON user_follow
FOR EACH ROW EXECUTE FUNCTION fn_notify_follow();

-- 2. Notify like
CREATE OR REPLACE FUNCTION fn_notify_like()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id BIGINT;
BEGIN
    SELECT user_id INTO v_owner_id FROM post WHERE post_id = NEW.post_id;
    IF v_owner_id IS NOT NULL AND v_owner_id <> NEW.user_id THEN
        INSERT INTO notification (user_id, notification_type, notification_text)
        VALUES (v_owner_id, 'LIKE', 'Someone liked your post');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_like
AFTER INSERT ON post_like
FOR EACH ROW EXECUTE FUNCTION fn_notify_like();

-- 3. Notify comment
CREATE OR REPLACE FUNCTION fn_notify_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id BIGINT;
BEGIN
    SELECT user_id INTO v_owner_id FROM post WHERE post_id = NEW.post_id;
    IF v_owner_id IS NOT NULL AND v_owner_id <> NEW.user_id THEN
        INSERT INTO notification (user_id, notification_type, notification_text)
        VALUES (v_owner_id, 'COMMENT', 'Someone commented on your post');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_comment
AFTER INSERT ON post_comment
FOR EACH ROW EXECUTE FUNCTION fn_notify_comment();

-- 4. Notify message
CREATE OR REPLACE FUNCTION fn_notify_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification (user_id, notification_type, notification_text)
    VALUES (NEW.receiver_id, 'MESSAGE', 'You have a new message');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_message
AFTER INSERT ON message
FOR EACH ROW EXECUTE FUNCTION fn_notify_message();

-- ============================ PROCEDURES / RPC FUNCTIONS ============================

-- 1. Create a post
CREATE OR REPLACE FUNCTION add_post(p_user_id BIGINT, p_content VARCHAR)
RETURNS VOID AS $$
BEGIN
    INSERT INTO post (user_id, content) VALUES (p_user_id, p_content);
END;
$$ LANGUAGE plpgsql;

-- 2. Follow user
CREATE OR REPLACE FUNCTION follow_user(p_follower_id BIGINT, p_following_id BIGINT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_follow (follower_id, following_id)
    VALUES (p_follower_id, p_following_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 3. Unfollow user
CREATE OR REPLACE FUNCTION unfollow_user(p_follower_id BIGINT, p_following_id BIGINT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM user_follow
    WHERE follower_id = p_follower_id AND following_id = p_following_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Add comment
CREATE OR REPLACE FUNCTION add_comment(p_post_id BIGINT, p_user_id BIGINT, p_text VARCHAR)
RETURNS VOID AS $$
BEGIN
    INSERT INTO post_comment (post_id, user_id, comment_text)
    VALUES (p_post_id, p_user_id, p_text);
END;
$$ LANGUAGE plpgsql;

-- 5. Send message
CREATE OR REPLACE FUNCTION send_message(p_sender_id BIGINT, p_receiver_id BIGINT, p_text VARCHAR)
RETURNS VOID AS $$
BEGIN
    INSERT INTO message (sender_id, receiver_id, message_text)
    VALUES (p_sender_id, p_receiver_id, p_text);
END;
$$ LANGUAGE plpgsql;

-- 6. Mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(p_user_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE notification
    SET is_read = 'Y'
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================ COMPUTED FUNCTIONS ============================

-- 1. Count likes
CREATE OR REPLACE FUNCTION count_likes(p_post_id BIGINT)
RETURNS BIGINT AS $$
    SELECT COUNT(*) FROM post_like WHERE post_id = p_post_id;
$$ LANGUAGE sql;

-- 2. Count comments
CREATE OR REPLACE FUNCTION count_comments(p_post_id BIGINT)
RETURNS BIGINT AS $$
    SELECT COUNT(*) FROM post_comment WHERE post_id = p_post_id;
$$ LANGUAGE sql;

-- 3. Total engagement
CREATE OR REPLACE FUNCTION count_engagement(p_post_id BIGINT)
RETURNS BIGINT AS $$
    SELECT count_likes(p_post_id) + count_comments(p_post_id);
$$ LANGUAGE sql;

-- 4. Is following check
CREATE OR REPLACE FUNCTION is_following(p_follower_id BIGINT, p_following_id BIGINT)
RETURNS VARCHAR AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM user_follow
    WHERE follower_id = p_follower_id AND following_id = p_following_id;

    IF v_count > 0 THEN
        RETURN 'Y';
    ELSE
        RETURN 'N';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Count followers
CREATE OR REPLACE FUNCTION count_followers(p_user_id BIGINT)
RETURNS BIGINT AS $$
    SELECT COUNT(*) FROM user_follow WHERE following_id = p_user_id;
$$ LANGUAGE sql;

-- ============================ SEED INITIAL DATA ============================

INSERT INTO social_platform (platform_name, platform_url) VALUES
('GitHub', 'https://github.com'),
('Twitter', 'https://twitter.com'),
('LinkedIn', 'https://linkedin.com');

INSERT INTO hashtag (hashtag_name) VALUES
('webdev'),
('supabase'),
('react'),
('database'),
('design'),
('fullstack');

-- Seed Users
INSERT INTO app_user (name, email, password, bio, date_of_birth) VALUES
('Alex Rivera', 'alex@example.com', 'password123', 'Full-stack software architect & open source contributor. Crafting next-gen web systems.', '1996-05-14'),
('Sarah Chen', 'sarah@example.com', 'password123', 'UI/UX Designer & Creative Technologist. Obsessed with micro-interactions and dark mode ✨', '1998-08-22'),
('Marcus Vance', 'marcus@example.com', 'password123', 'Database Administrator & PostgreSQL Enthusiast. Query optimization is my cardio ⚡', '1992-11-03'),
('Elena Rostova', 'elena@example.com', 'password123', 'AI Engineer & Cloud Architect. Building autonomous distributed agents.', '1995-02-18');

-- Seed Profiles
INSERT INTO profile (user_id, profile_picture, location, website) VALUES
(1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 'San Francisco, CA', 'https://alexrivera.dev'),
(2, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', 'New York, NY', 'https://sarahchen.design'),
(3, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 'Austin, TX', 'https://vance-db.io'),
(4, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', 'Seattle, WA', 'https://rostova.ai');

-- Seed Follows
INSERT INTO user_follow (follower_id, following_id) VALUES
(1, 2),
(1, 3),
(2, 1),
(3, 1),
(4, 1),
(2, 4);

-- Seed Posts
INSERT INTO post (user_id, content, visibility, post_type) VALUES
(1, 'Just deployed our new real-time database schema with PostgreSQL triggers! The latency dropped by 65%. Building with modern relational architecture is an absolute game-changer. #database #supabase #webdev', 'public', 'status'),
(2, 'Glassmorphism and fluid typography design systems completed! What are your favorite CSS tricks for neon dark mode glows? Drop your thoughts below 👇 #design #webdev', 'public', 'status'),
(3, 'Pro tip: Always index foreign keys in high-traffic relational tables! Joins between post_like and app_user will fly when your indexes are tuned. 🚀 #database #fullstack', 'public', 'status'),
(4, 'Exploring autonomous agent workflows with vector search embeddings. The future of software engineering is pair-programming with AI teammates. #fullstack #react', 'public', 'status');

-- Seed Likes
INSERT INTO post_like (post_id, user_id) VALUES
(1, 2),
(1, 3),
(1, 4),
(2, 1),
(2, 3),
(3, 1);

-- Seed Comments
INSERT INTO post_comment (post_id, user_id, comment_text) VALUES
(1, 2, 'Incredible latency improvement! Triggers and indexed RPCs make a massive difference.'),
(1, 3, 'PostgreSQL query plans never lie! Solid work Alex.'),
(2, 1, 'The neon glow effects look pristine. Would love to see the token system.'),
(3, 4, 'Essential advice. Missing index on foreign keys is the #1 silent killer in production.');

-- Seed Messages
INSERT INTO message (sender_id, receiver_id, message_text, is_read) VALUES
(2, 1, 'Hey Alex! Did you get a chance to review the new design mockups?', 'Y'),
(1, 2, 'Hey Sarah! Yes, they look sensational. Integrating them right now!', 'Y'),
(3, 1, 'Alex, check out the updated schema indexing script when you have time.', 'N');

-- ============================ ROW LEVEL SECURITY (RLS) ============================
-- Enable RLS and grant public access for frontend demo via anon key
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE post ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_like ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follow ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtag ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_platform ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE message ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

-- Allow anon public read and write policies
CREATE POLICY "Public full access to app_user" ON app_user FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to profile" ON profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to post" ON post FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to post_comment" ON post_comment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to post_like" ON post_like FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to user_follow" ON user_follow FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to hashtag" ON hashtag FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to post_hashtag" ON post_hashtag FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to media" ON media FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to social_platform" ON social_platform FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to social_account" ON social_account FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to message" ON message FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to notification" ON notification FOR ALL USING (true) WITH CHECK (true);

