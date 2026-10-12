# DBMS-SOCIAL ⚡

A modern, high-performance social networking web application designed directly around your relational **Supabase PostgreSQL Schema**.

---

## ✨ Features

- **Multi-User Architecture & Instant Account Switching**:
  - Full Sign In & Sign Up flows (`app_user`, `profile`).
  - **1-Click Fast User Switcher** in the header and sidebar to test multi-user interactions (Alex Rivera, Sarah Chen, Marcus Vance, Elena Rostova, Leo Brooks) without manual logouts.
- **Relational Social Feed**:
  - Posts with rich content, post types (`status`, `media`), visibility (`public`, `followers`), clickable `#hashtags`, and media image previews (`post`, `media`, `hashtag`, `post_hashtag`).
  - Filter between **Global Feed** and **Following Only**.
- **Interactive Engagement**:
  - Heart Likes with real-time counters & micro-animations (`post_like`, triggers `trg_notify_like`).
  - Collapsible Comment threads with instant replies (`post_comment`, triggers `trg_notify_comment`).
  - Total Engagement metric pill (`count_engagement = count_likes + count_comments`).
- **User Graph & Following**:
  - Follow / Unfollow actions with dynamic counter synchronization (`user_follow`, `count_followers`, triggers `trg_notify_follow`).
  - "Who to Follow" personalized recommendations widget.
- **Direct Messaging**:
  - Conversation list with unread counters (`message`, triggers `trg_notify_message`).
  - Active chat thread with real-time bubble rendering and instant reply simulation.
- **Trigger-Driven Notification Center**:
  - Notification feed populated by PostgreSQL triggers (`FOLLOW`, `LIKE`, `COMMENT`, `MESSAGE`).
  - Filter between All and Unread notifications.
  - "Mark all read" procedure execution (`mark_notifications_read`).
- **Explore & Topics**:
  - Search posts and users by query.
  - Trending hashtags cloud (`#supabase`, `#database`, `#webdev`, `#react`, etc.).
- **Dual-Engine Relational Storage**:
  - **Out-of-the-Box Simulated Local SQL Engine**: Full in-browser relational model with foreign keys, cascading deletes, stored procedures, and triggers. Works offline with zero setup required.
  - **Live Supabase Integration**: Seamlessly connect to your Supabase project by providing your Project URL & Anon Key in `.env` or directly through the interactive **Supabase Settings Modal** in the UI!

---

## 🗄️ Database Schema Implementation

The application mirrors your exact SQL schema:

| Table | Description |
| :--- | :--- |
| `app_user` | User authentication, identity, and personal metadata |
| `profile` | Extended bio, avatar image, location, and website |
| `post` | Published content, visibility flags, and timestamps |
| `post_comment` | Threaded post comments |
| `post_like` | Composite primary key `(post_id, user_id)` like registry |
| `user_follow` | Composite primary key `(follower_id, following_id)` graph |
| `hashtag` & `post_hashtag` | Tagging system with many-to-many relationship |
| `media` | Post attachments and asset URLs |
| `social_platform` & `social_account` | Third-party accounts integration |
| `message` | Peer-to-peer direct communication with read status |
| `notification` | Target destination for trigger events |

### Trigger Functions & Procedures
- `trg_notify_follow` ➔ Calls `fn_notify_follow()` on `user_follow`
- `trg_notify_like` ➔ Calls `fn_notify_like()` on `post_like`
- `trg_notify_comment` ➔ Calls `fn_notify_comment()` on `post_comment`
- `trg_notify_message` ➔ Calls `fn_notify_message()` on `message`
- Procedures: `add_post()`, `follow_user()`, `unfollow_user()`, `add_comment()`, `send_message()`, `mark_notifications_read()`
- Computed functions: `count_likes()`, `count_comments()`, `count_engagement()`, `is_following()`, `count_followers()`

Full SQL DDL script is provided in [`supabase_schema.sql`](./supabase_schema.sql).

---

## 🚀 Getting Started

### 1. Install & Run
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

### 2. Connect Your Live Supabase Database (Optional)

1. Run the script in [`supabase_schema.sql`](./supabase_schema.sql) in your [Supabase SQL Editor](https://supabase.com/dashboard).
2. Click the **"Local SQL Engine"** pill in the top header navbar to open the configuration modal.
3. Paste your **Supabase URL** and **Anon Key**, click **"Test Connection"**, and toggle **"Enable Supabase Client Mode"**.
4. Alternatively, add them to your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
