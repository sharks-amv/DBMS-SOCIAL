import { createClient } from '@supabase/supabase-js';
import {
  initialUsers,
  initialFollows,
  initialHashtags,
  initialPosts,
  initialLikes,
  initialComments,
  initialMessages,
  initialNotifications
} from './mockData';

// Storage keys for local relational simulator & cache
const STORAGE_KEYS = {
  USERS: 'dbms_social_users',
  POSTS: 'dbms_social_posts',
  LIKES: 'dbms_social_likes',
  COMMENTS: 'dbms_social_comments',
  FOLLOWS: 'dbms_social_follows',
  MESSAGES: 'dbms_social_messages',
  NOTIFICATIONS: 'dbms_social_notifications',
  HASHTAGS: 'dbms_social_hashtags',
  ACTIVE_USER: 'dbms_social_active_user',
  SUPABASE_CONFIG: 'dbms_social_supabase_config'
};

// Safe JSON get/set for local storage fallback
function getStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// In-memory cache for fast sync UI checks (e.g. isFollowing, counts)
let cachedFollows = [];
let cachedHashtags = [];

export function initLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStorage(STORAGE_KEYS.USERS, initialUsers);
    setStorage(STORAGE_KEYS.POSTS, initialPosts);
    setStorage(STORAGE_KEYS.LIKES, initialLikes);
    setStorage(STORAGE_KEYS.COMMENTS, initialComments);
    setStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
    setStorage(STORAGE_KEYS.MESSAGES, initialMessages);
    setStorage(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    setStorage(STORAGE_KEYS.HASHTAGS, initialHashtags);
  }
  if (!cachedFollows.length) {
    cachedFollows = getStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
  }
  if (!cachedHashtags.length) {
    cachedHashtags = getStorage(STORAGE_KEYS.HASHTAGS, initialHashtags);
  }
}

export function resetLocalStorage() {
  setStorage(STORAGE_KEYS.USERS, initialUsers);
  setStorage(STORAGE_KEYS.POSTS, initialPosts);
  setStorage(STORAGE_KEYS.LIKES, initialLikes);
  setStorage(STORAGE_KEYS.COMMENTS, initialComments);
  setStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
  setStorage(STORAGE_KEYS.MESSAGES, initialMessages);
  setStorage(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  setStorage(STORAGE_KEYS.HASHTAGS, initialHashtags);
  cachedFollows = [...initialFollows];
  cachedHashtags = [...initialHashtags];
  setStorage(STORAGE_KEYS.ACTIVE_USER, initialUsers[0]);
}

// Supabase client instance holder
let supabaseClient = null;

export function getSupabaseConfig() {
  const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xqfjreafdkpvlsxuxhiu.supabase.co';
  const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZmpyZWFmZGtwdmxzeHV4aGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MTUwMjMsImV4cCI6MjEwNzM5MTAyM30.5KSccVn1QTcqNd19OuNkyZgQEfdCQ9hUs-K8eq-t5m4';

  const stored = getStorage(STORAGE_KEYS.SUPABASE_CONFIG, null);
  if (stored) {
    return {
      ...stored,
      url: stored.url || defaultUrl,
      anonKey: stored.anonKey || defaultKey,
      enabled: stored.enabled !== undefined ? stored.enabled : true
    };
  }

  return {
    url: defaultUrl,
    anonKey: defaultKey,
    enabled: true
  };
}

export function saveSupabaseConfig(config) {
  setStorage(STORAGE_KEYS.SUPABASE_CONFIG, config);
  if (config.enabled && config.url && config.anonKey) {
    try {
      supabaseClient = createClient(config.url, config.anonKey);
    } catch (e) {
      console.error("Failed to initialize Supabase client", e);
    }
  } else {
    supabaseClient = null;
  }
}

// Initialize Supabase Client
const initialConfig = getSupabaseConfig();
if (initialConfig.enabled && initialConfig.url && initialConfig.anonKey) {
  try {
    supabaseClient = createClient(initialConfig.url, initialConfig.anonKey);
  } catch (e) {
    console.warn("Could not create initial Supabase client:", e);
  }
}

export function getClient() {
  return supabaseClient;
}

export function isUsingSupabase() {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.enabled && supabaseClient);
}

// ============================================================
// SUPABASE FIRST DATA SERVICE
// Direct queries and mutations to Supabase with automatic caching
// ============================================================

export const dbService = {
  // Test connection to Supabase
  async testSupabaseConnection(url, anonKey) {
    try {
      const client = createClient(url, anonKey);
      const { data, error } = await client.from('app_user').select('user_id').limit(1);
      if (error) throw error;
      return { success: true, message: 'Connected successfully to Supabase!' };
    } catch (err) {
      return { success: false, message: err.message || 'Connection failed' };
    }
  },

  // Seed Supabase database with starter users, profiles, posts, comments, likes, follows
  async seedSupabaseDatabase() {
    if (!isUsingSupabase()) {
      throw new Error("Supabase is not configured or disabled.");
    }

    try {
      // 1. Seed social platforms
      await supabaseClient.from('social_platform').upsert([
        { platform_id: 1, platform_name: 'GitHub', platform_url: 'https://github.com' },
        { platform_id: 2, platform_name: 'Twitter', platform_url: 'https://twitter.com' },
        { platform_id: 3, platform_name: 'LinkedIn', platform_url: 'https://linkedin.com' }
      ], { onConflict: 'platform_name' });

      // 2. Seed hashtags
      await supabaseClient.from('hashtag').upsert(
        initialHashtags.map(h => ({ hashtag_name: h.hashtag_name })),
        { onConflict: 'hashtag_name' }
      );

      // 3. Seed users
      for (const u of initialUsers) {
        const { data: userRow, error: uErr } = await supabaseClient
          .from('app_user')
          .upsert([{
            user_id: u.user_id,
            name: u.name,
            email: u.email,
            password: u.password || 'password123',
            bio: u.bio,
            date_of_birth: u.date_of_birth,
            date_joined: u.date_joined
          }], { onConflict: 'email' })
          .select()
          .single();

        if (userRow && u.profile) {
          await supabaseClient.from('profile').upsert([{
            user_id: userRow.user_id,
            profile_picture: u.profile.profile_picture,
            location: u.profile.location,
            website: u.profile.website
          }], { onConflict: 'user_id' });
        }
      }

      // 4. Seed follows
      await supabaseClient.from('user_follow').upsert(
        initialFollows.map(f => ({ follower_id: f.follower_id, following_id: f.following_id })),
        { onConflict: 'follower_id,following_id' }
      );

      // 5. Seed posts
      for (const p of initialPosts) {
        const { data: postRow } = await supabaseClient
          .from('post')
          .upsert([{
            post_id: p.post_id,
            user_id: p.user_id,
            content: p.content,
            created_at: p.created_at,
            visibility: p.visibility || 'public',
            post_type: p.post_type || 'status'
          }], { onConflict: 'post_id' })
          .select()
          .single();

        if (postRow && p.media_url) {
          await supabaseClient.from('media').upsert([{
            post_id: postRow.post_id,
            media_url: p.media_url,
            media_type: 'image'
          }], { onConflict: 'post_id' });
        }
      }

      // 6. Seed likes
      await supabaseClient.from('post_like').upsert(
        initialLikes.map(l => ({ post_id: l.post_id, user_id: l.user_id })),
        { onConflict: 'post_id,user_id' }
      );

      // 7. Seed comments
      for (const c of initialComments) {
        await supabaseClient.from('post_comment').upsert([{
          comment_id: c.comment_id,
          post_id: c.post_id,
          user_id: c.user_id,
          comment_text: c.comment_text,
          created_at: c.created_at
        }], { onConflict: 'comment_id' });
      }

      // 8. Seed messages
      for (const m of initialMessages) {
        await supabaseClient.from('message').upsert([{
          message_id: m.message_id,
          sender_id: m.sender_id,
          receiver_id: m.receiver_id,
          message_text: m.message_text,
          sent_at: m.sent_at,
          is_read: m.is_read
        }], { onConflict: 'message_id' });
      }

      return { success: true, message: "Supabase database seeded successfully!" };
    } catch (err) {
      console.error("Seeding error:", err);
      throw err;
    }
  },

  // USERS & AUTHENTICATION
  async getAllUsers() {
    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('app_user')
          .select(`
            user_id, name, email, password, bio, date_joined, date_of_birth,
            profile (profile_id, profile_picture, location, website)
          `)
          .order('user_id', { ascending: true });

        if (!error && data && data.length > 0) {
          const formatted = data.map(u => ({
            ...u,
            profile: Array.isArray(u.profile) ? (u.profile[0] || {}) : (u.profile || {})
          }));
          setStorage(STORAGE_KEYS.USERS, formatted);

          // Also sync follow graph cache
          this.syncFollowCache();

          return formatted;
        }
      } catch (e) {
        console.warn("Supabase fetch users error, falling back to cached dataset:", e);
      }
    }
    initLocalStorage();
    return getStorage(STORAGE_KEYS.USERS, initialUsers);
  },

  async syncFollowCache() {
    if (isUsingSupabase()) {
      try {
        const { data } = await supabaseClient.from('user_follow').select('follower_id, following_id');
        if (data) {
          cachedFollows = data.map(f => ({ follower_id: Number(f.follower_id), following_id: Number(f.following_id) }));
          setStorage(STORAGE_KEYS.FOLLOWS, cachedFollows);
        }
      } catch (e) {
        // silent
      }
    }
  },

  async getUserById(userId) {
    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('app_user')
          .select(`
            user_id, name, email, password, bio, date_joined, date_of_birth,
            profile (profile_id, profile_picture, location, website)
          `)
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return {
            ...data,
            profile: Array.isArray(data.profile) ? (data.profile[0] || {}) : (data.profile || {})
          };
        }
      } catch (e) {
        console.warn("Supabase getUserById error:", e);
      }
    }
    const users = await this.getAllUsers();
    return users.find(u => Number(u.user_id) === Number(userId)) || null;
  },

  async login(email, password) {
    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('app_user')
          .select(`
            user_id, name, email, password, bio, date_joined, date_of_birth,
            profile (profile_id, profile_picture, location, website)
          `)
          .ilike('email', email.trim())
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('User not found with this email in Supabase.');
        if (data.password && data.password !== password) throw new Error('Incorrect password.');

        const user = {
          ...data,
          profile: Array.isArray(data.profile) ? (data.profile[0] || {}) : (data.profile || {})
        };
        setStorage(STORAGE_KEYS.ACTIVE_USER, user);
        return user;
      } catch (e) {
        console.warn("Supabase login error, checking fallback:", e);
        if (e.message.includes('not found') || e.message.includes('password')) throw e;
      }
    }

    const users = await this.getAllUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('User not found with this email.');
    if (user.password && user.password !== password) throw new Error('Incorrect password.');
    setStorage(STORAGE_KEYS.ACTIVE_USER, user);
    return user;
  },

  async register(userData) {
    if (isUsingSupabase()) {
      try {
        // Check existing user
        const { data: existing } = await supabaseClient
          .from('app_user')
          .select('user_id')
          .ilike('email', userData.email.trim())
          .maybeSingle();

        if (existing) {
          throw new Error('An account with this email already exists in Supabase.');
        }

        const { data: insertedUser, error: userErr } = await supabaseClient
          .from('app_user')
          .insert([{
            name: userData.name,
            email: userData.email,
            password: userData.password || 'password123',
            date_of_birth: userData.date_of_birth || '1998-01-01',
            bio: userData.bio || 'New member of the DBMS-Social community ✨'
          }])
          .select()
          .single();

        if (userErr) throw userErr;

        const defaultAvatar = userData.profile_picture || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`;
        const { data: insertedProfile } = await supabaseClient
          .from('profile')
          .insert([{
            user_id: insertedUser.user_id,
            profile_picture: defaultAvatar,
            location: userData.location || 'Earth, Orbit',
            website: userData.website || ''
          }])
          .select()
          .single();

        const newUser = {
          ...insertedUser,
          profile: insertedProfile || {
            profile_picture: defaultAvatar,
            location: userData.location || 'Earth, Orbit',
            website: userData.website || ''
          }
        };

        const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
        setStorage(STORAGE_KEYS.USERS, [newUser, ...users]);
        setStorage(STORAGE_KEYS.ACTIVE_USER, newUser);
        return newUser;
      } catch (e) {
        console.error("Supabase register error:", e);
        throw e;
      }
    }

    // Local storage fallback
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) throw new Error('An account with this email already exists.');

    const newUserId = users.length > 0 ? Math.max(...users.map(u => u.user_id)) + 1 : 1;
    const newUser = {
      user_id: newUserId,
      name: userData.name,
      email: userData.email,
      password: userData.password || 'password123',
      date_joined: new Date().toISOString(),
      date_of_birth: userData.date_of_birth || '1998-01-01',
      bio: userData.bio || 'New member of the DBMS-Social community ✨',
      profile: {
        profile_id: newUserId,
        profile_picture: userData.profile_picture || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
        location: userData.location || 'Earth, Orbit',
        website: userData.website || ''
      }
    };

    setStorage(STORAGE_KEYS.USERS, [newUser, ...users]);
    setStorage(STORAGE_KEYS.ACTIVE_USER, newUser);
    return newUser;
  },

  async updateProfile(userId, { name, bio, location, website, profile_picture, date_of_birth }) {
    if (isUsingSupabase()) {
      try {
        const userUpdates = {};
        if (name !== undefined) userUpdates.name = name;
        if (bio !== undefined) userUpdates.bio = bio;
        if (date_of_birth !== undefined) userUpdates.date_of_birth = date_of_birth;

        if (Object.keys(userUpdates).length > 0) {
          await supabaseClient.from('app_user').update(userUpdates).eq('user_id', userId);
        }

        const profileUpdates = {};
        if (location !== undefined) profileUpdates.location = location;
        if (website !== undefined) profileUpdates.website = website;
        if (profile_picture !== undefined) profileUpdates.profile_picture = profile_picture;

        if (Object.keys(profileUpdates).length > 0) {
          await supabaseClient.from('profile').upsert({
            user_id: userId,
            ...profileUpdates
          }, { onConflict: 'user_id' });
        }
      } catch (e) {
        console.error("Supabase updateProfile error:", e);
      }
    }

    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    const updated = users.map(u => {
      if (Number(u.user_id) === Number(userId)) {
        return {
          ...u,
          name: name ?? u.name,
          bio: bio ?? u.bio,
          date_of_birth: date_of_birth ?? u.date_of_birth,
          profile: {
            ...u.profile,
            location: location ?? u.profile?.location,
            website: website ?? u.profile?.website,
            profile_picture: profile_picture ?? u.profile?.profile_picture
          }
        };
      }
      return u;
    });

    setStorage(STORAGE_KEYS.USERS, updated);
    const active = getStorage(STORAGE_KEYS.ACTIVE_USER, null);
    if (active && Number(active.user_id) === Number(userId)) {
      const refreshed = updated.find(u => Number(u.user_id) === Number(userId));
      setStorage(STORAGE_KEYS.ACTIVE_USER, refreshed);
    }

    return updated.find(u => Number(u.user_id) === Number(userId));
  },

  getCurrentUser() {
    initLocalStorage();
    const stored = getStorage(STORAGE_KEYS.ACTIVE_USER, null);
    if (stored) return stored;
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    const defaultUser = users[0] || null;
    if (defaultUser) setStorage(STORAGE_KEYS.ACTIVE_USER, defaultUser);
    return defaultUser;
  },

  switchUser(userId) {
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    const user = users.find(u => Number(u.user_id) === Number(userId));
    if (user) {
      setStorage(STORAGE_KEYS.ACTIVE_USER, user);
      return user;
    }
    return null;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
  },

  // POSTS & FEED - DIRECT SUPABASE QUERIES
  async getPosts(currentUserId, filter = 'all') {
    if (isUsingSupabase()) {
      try {
        let query = supabaseClient
          .from('post')
          .select(`
            post_id, user_id, content, created_at, visibility, post_type,
            author:app_user (
              user_id, name, email,
              profile (profile_picture, location, website)
            ),
            likes:post_like (user_id),
            comments:post_comment (comment_id),
            media (media_url, media_type)
          `)
          .order('created_at', { ascending: false });

        if (filter.startsWith('user:')) {
          const targetId = Number(filter.split(':')[1]);
          query = query.eq('user_id', targetId);
        } else if (filter.startsWith('hashtag:')) {
          const tag = filter.split(':')[1].toLowerCase();
          query = query.ilike('content', `%#${tag}%`);
        }

        const { data: dbPosts, error } = await query;

        if (!error && dbPosts && dbPosts.length > 0) {
          // If following filter requested
          let followingIds = [];
          if (filter === 'following' && currentUserId) {
            const { data: followsData } = await supabaseClient
              .from('user_follow')
              .select('following_id')
              .eq('follower_id', currentUserId);
            
            followingIds = (followsData || []).map(f => Number(f.following_id));
            followingIds.push(Number(currentUserId));
          }

          let postsList = dbPosts;
          if (filter === 'following') {
            postsList = postsList.filter(p => followingIds.includes(Number(p.user_id)));
          }

          return postsList.map(post => {
            const authorData = Array.isArray(post.author) ? post.author[0] : post.author;
            const profileData = authorData?.profile
              ? (Array.isArray(authorData.profile) ? authorData.profile[0] : authorData.profile)
              : {};

            const author = {
              user_id: authorData?.user_id || post.user_id,
              name: authorData?.name || 'Unknown User',
              email: authorData?.email || '',
              profile: {
                profile_picture: profileData?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                location: profileData?.location || '',
                website: profileData?.website || ''
              }
            };

            const postLikes = post.likes || [];
            const postComments = post.comments || [];
            const hasLiked = currentUserId ? postLikes.some(l => Number(l.user_id) === Number(currentUserId)) : false;
            const mediaItem = post.media && post.media.length > 0 ? post.media[0] : null;

            return {
              post_id: post.post_id,
              user_id: post.user_id,
              content: post.content,
              created_at: post.created_at,
              visibility: post.visibility,
              post_type: post.post_type,
              media_url: mediaItem ? mediaItem.media_url : null,
              author,
              like_count: postLikes.length,
              comment_count: postComments.length,
              engagement_count: postLikes.length + postComments.length,
              has_liked: hasLiked
            };
          });
        }
      } catch (e) {
        console.warn("Supabase getPosts error, falling back to local simulation:", e);
      }
    }

    // Local simulator fallback
    initLocalStorage();
    const posts = getStorage(STORAGE_KEYS.POSTS, initialPosts);
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    const likes = getStorage(STORAGE_KEYS.LIKES, initialLikes);
    const comments = getStorage(STORAGE_KEYS.COMMENTS, initialComments);
    const follows = getStorage(STORAGE_KEYS.FOLLOWS, initialFollows);

    const followingIds = follows
      .filter(f => Number(f.follower_id) === Number(currentUserId))
      .map(f => Number(f.following_id));

    let filtered = [...posts];

    if (filter === 'following') {
      filtered = filtered.filter(p => followingIds.includes(Number(p.user_id)) || Number(p.user_id) === Number(currentUserId));
    } else if (filter.startsWith('user:')) {
      const targetId = Number(filter.split(':')[1]);
      filtered = filtered.filter(p => Number(p.user_id) === targetId);
    } else if (filter.startsWith('hashtag:')) {
      const tag = filter.split(':')[1].toLowerCase();
      filtered = filtered.filter(p => p.content.toLowerCase().includes(`#${tag}`));
    }

    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return filtered.map(post => {
      const author = users.find(u => Number(u.user_id) === Number(post.user_id)) || {
        name: 'Unknown User',
        profile: { profile_picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }
      };

      const postLikes = likes.filter(l => Number(l.post_id) === Number(post.post_id));
      const postComments = comments.filter(c => Number(c.post_id) === Number(post.post_id));
      const hasLiked = postLikes.some(l => Number(l.user_id) === Number(currentUserId));

      return {
        ...post,
        author,
        like_count: postLikes.length,
        comment_count: postComments.length,
        engagement_count: postLikes.length + postComments.length,
        has_liked: hasLiked
      };
    });
  },

  // ADD POST - DIRECT SUPABASE INSERTION
  async addPost(userId, content, visibility = 'public', postType = 'status', mediaUrl = null) {
    let newPostId = Date.now();
    let newPost = null;

    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('post')
          .insert([{
            user_id: userId,
            content: content,
            visibility: visibility,
            post_type: postType
          }])
          .select()
          .single();

        if (error) throw error;
        newPost = data;
        newPostId = data.post_id;

        // Media attachment
        if (mediaUrl) {
          await supabaseClient.from('media').insert([{
            post_id: newPostId,
            media_url: mediaUrl,
            media_type: 'image'
          }]);
        }

        // Hashtags extraction & insertion
        const hashtagsFound = content.match(/#[a-zA-Z0-9_]+/g);
        if (hashtagsFound) {
          for (const rawTag of hashtagsFound) {
            const cleanTag = rawTag.slice(1).toLowerCase();
            const { data: tagRow } = await supabaseClient
              .from('hashtag')
              .upsert([{ hashtag_name: cleanTag }], { onConflict: 'hashtag_name' })
              .select()
              .single();

            if (tagRow) {
              await supabaseClient
                .from('post_hashtag')
                .upsert([{ post_id: newPostId, hashtag_id: tagRow.hashtag_id }], { onConflict: 'post_id,hashtag_id' });
            }
          }
        }
      } catch (e) {
        console.error("Supabase direct post insert error:", e);
      }
    }

    if (!newPost) {
      newPost = {
        post_id: newPostId,
        user_id: Number(userId),
        content,
        created_at: new Date().toISOString(),
        visibility,
        post_type: postType,
        media_url: mediaUrl
      };
    } else {
      newPost.media_url = mediaUrl;
    }

    const posts = getStorage(STORAGE_KEYS.POSTS, initialPosts);
    setStorage(STORAGE_KEYS.POSTS, [newPost, ...posts]);
    return newPost;
  },

  // LIKES - DIRECT SUPABASE QUERY & MUTATION
  async likePost(postId, userId) {
    if (isUsingSupabase()) {
      try {
        await supabaseClient
          .from('post_like')
          .upsert([{ post_id: postId, user_id: userId }], { onConflict: 'post_id,user_id' });
      } catch (e) {
        console.error("Supabase likePost error:", e);
      }
    }

    const likes = getStorage(STORAGE_KEYS.LIKES, initialLikes);
    if (!likes.some(l => Number(l.post_id) === Number(postId) && Number(l.user_id) === Number(userId))) {
      setStorage(STORAGE_KEYS.LIKES, [...likes, { post_id: Number(postId), user_id: Number(userId), liked_at: new Date().toISOString() }]);
    }
  },

  async unlikePost(postId, userId) {
    if (isUsingSupabase()) {
      try {
        await supabaseClient
          .from('post_like')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
      } catch (e) {
        console.error("Supabase unlikePost error:", e);
      }
    }

    const likes = getStorage(STORAGE_KEYS.LIKES, initialLikes);
    setStorage(STORAGE_KEYS.LIKES, likes.filter(l => !(Number(l.post_id) === Number(postId) && Number(l.user_id) === Number(userId))));
  },

  // COMMENTS - DIRECT SUPABASE QUERY & MUTATION
  async addComment(postId, userId, commentText) {
    let newComment = null;

    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('post_comment')
          .insert([{
            post_id: postId,
            user_id: userId,
            comment_text: commentText
          }])
          .select(`
            comment_id, post_id, user_id, comment_text, created_at,
            author:app_user (
              user_id, name,
              profile (profile_picture)
            )
          `)
          .single();

        if (!error && data) {
          const authData = Array.isArray(data.author) ? data.author[0] : data.author;
          const profData = authData?.profile ? (Array.isArray(authData.profile) ? authData.profile[0] : authData.profile) : {};
          newComment = {
            ...data,
            author: {
              user_id: authData?.user_id || userId,
              name: authData?.name || 'User',
              profile: { profile_picture: profData?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }
            }
          };
        }
      } catch (e) {
        console.error("Supabase addComment error:", e);
      }
    }

    if (!newComment) {
      const comments = getStorage(STORAGE_KEYS.COMMENTS, initialComments);
      const newCommentId = comments.length > 0 ? Math.max(...comments.map(c => c.comment_id)) + 1 : 1;
      newComment = {
        comment_id: newCommentId,
        post_id: Number(postId),
        user_id: Number(userId),
        comment_text: commentText,
        created_at: new Date().toISOString()
      };
      setStorage(STORAGE_KEYS.COMMENTS, [...comments, newComment]);
    }

    return newComment;
  },

  async getComments(postId) {
    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('post_comment')
          .select(`
            comment_id, post_id, user_id, comment_text, created_at,
            author:app_user (
              user_id, name,
              profile (profile_picture)
            )
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          return data.map(c => {
            const auth = Array.isArray(c.author) ? c.author[0] : c.author;
            const prof = auth?.profile ? (Array.isArray(auth.profile) ? auth.profile[0] : auth.profile) : {};
            return {
              ...c,
              author: {
                user_id: auth?.user_id || c.user_id,
                name: auth?.name || 'Unknown',
                profile: {
                  profile_picture: prof?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                }
              }
            };
          });
        }
      } catch (e) {
        console.warn("Supabase getComments error:", e);
      }
    }

    const comments = getStorage(STORAGE_KEYS.COMMENTS, initialComments);
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    return comments
      .filter(c => Number(c.post_id) === Number(postId))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(c => ({
        ...c,
        author: users.find(u => Number(u.user_id) === Number(c.user_id)) || { name: 'Unknown' }
      }));
  },

  // FOLLOW / UNFOLLOW - DIRECT SUPABASE QUERIES
  async followUser(followerId, followingId) {
    if (Number(followerId) === Number(followingId)) return;

    if (isUsingSupabase()) {
      try {
        await supabaseClient
          .from('user_follow')
          .upsert([{ follower_id: followerId, following_id: followingId }], { onConflict: 'follower_id,following_id' });
      } catch (e) {
        console.error("Supabase followUser error:", e);
      }
    }

    if (!cachedFollows.some(f => Number(f.follower_id) === Number(followerId) && Number(f.following_id) === Number(followingId))) {
      cachedFollows.push({ follower_id: Number(followerId), following_id: Number(followingId), followed_at: new Date().toISOString() });
      setStorage(STORAGE_KEYS.FOLLOWS, cachedFollows);
    }
  },

  async unfollowUser(followerId, followingId) {
    if (isUsingSupabase()) {
      try {
        await supabaseClient
          .from('user_follow')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId);
      } catch (e) {
        console.error("Supabase unfollowUser error:", e);
      }
    }

    cachedFollows = cachedFollows.filter(
      f => !(Number(f.follower_id) === Number(followerId) && Number(f.following_id) === Number(followingId))
    );
    setStorage(STORAGE_KEYS.FOLLOWS, cachedFollows);
  },

  isFollowing(followerId, followingId) {
    if (!cachedFollows.length) {
      cachedFollows = getStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
    }
    return cachedFollows.some(
      f => Number(f.follower_id) === Number(followerId) && Number(f.following_id) === Number(followingId)
    );
  },

  countFollowers(userId) {
    if (!cachedFollows.length) {
      cachedFollows = getStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
    }
    return cachedFollows.filter(f => Number(f.following_id) === Number(userId)).length;
  },

  countFollowing(userId) {
    if (!cachedFollows.length) {
      cachedFollows = getStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
    }
    return cachedFollows.filter(f => Number(f.follower_id) === Number(userId)).length;
  },

  // NOTIFICATIONS - DIRECT SUPABASE QUERIES
  async createNotification(userId, type, text) {
    if (isUsingSupabase()) {
      try {
        await supabaseClient.from('notification').insert([{
          user_id: userId,
          notification_type: type,
          notification_text: text,
          is_read: 'N'
        }]);
      } catch (e) {
        console.error("Supabase notification insert error:", e);
      }
    }

    const notifications = getStorage(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const newId = Date.now();
    setStorage(STORAGE_KEYS.NOTIFICATIONS, [{
      notification_id: newId,
      user_id: Number(userId),
      notification_type: type,
      notification_text: text,
      created_at: new Date().toISOString(),
      is_read: 'N'
    }, ...notifications]);
  },

  async getNotifications(userId) {
    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('notification')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn("Supabase getNotifications error:", e);
      }
    }

    const notifications = getStorage(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    return notifications
      .filter(n => Number(n.user_id) === Number(userId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async markNotificationsRead(userId) {
    if (isUsingSupabase()) {
      try {
        await supabaseClient
          .from('notification')
          .update({ is_read: 'Y' })
          .eq('user_id', userId);
      } catch (e) {
        console.error("Supabase markNotificationsRead error:", e);
      }
    }

    const notifications = getStorage(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const updated = notifications.map(n => {
      if (Number(n.user_id) === Number(userId)) {
        return { ...n, is_read: 'Y' };
      }
      return n;
    });
    setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  // MESSAGING - DIRECT SUPABASE QUERIES
  async sendMessage(senderId, receiverId, messageText) {
    let newMsg = null;

    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('message')
          .insert([{
            sender_id: senderId,
            receiver_id: receiverId,
            message_text: messageText,
            is_read: 'N'
          }])
          .select()
          .single();

        if (!error && data) {
          newMsg = data;
        }
      } catch (e) {
        console.error("Supabase sendMessage error:", e);
      }
    }

    if (!newMsg) {
      newMsg = {
        message_id: Date.now(),
        sender_id: Number(senderId),
        receiver_id: Number(receiverId),
        message_text: messageText,
        sent_at: new Date().toISOString(),
        is_read: 'N'
      };
    }

    const messages = getStorage(STORAGE_KEYS.MESSAGES, initialMessages);
    setStorage(STORAGE_KEYS.MESSAGES, [...messages, newMsg]);
    return newMsg;
  },

  async getMessages(userId1, userId2) {
    const u1 = Number(userId1);
    const u2 = Number(userId2);

    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('message')
          .select('*')
          .or(`and(sender_id.eq.${u1},receiver_id.eq.${u2}),and(sender_id.eq.${u2},receiver_id.eq.${u1})`)
          .order('sent_at', { ascending: true });

        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn("Supabase getMessages error:", e);
      }
    }

    const messages = getStorage(STORAGE_KEYS.MESSAGES, initialMessages);
    return messages
      .filter(m => (Number(m.sender_id) === u1 && Number(m.receiver_id) === u2) ||
                   (Number(m.sender_id) === u2 && Number(m.receiver_id) === u1))
      .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
  },

  async getRecentChatUsers(currentUserId) {
    const users = await this.getAllUsers();
    const cId = Number(currentUserId);

    let messages = [];
    if (isUsingSupabase()) {
      try {
        const { data } = await supabaseClient
          .from('message')
          .select('*')
          .or(`sender_id.eq.${cId},receiver_id.eq.${cId}`)
          .order('sent_at', { ascending: true });
        
        if (data) messages = data;
      } catch (e) {
        messages = getStorage(STORAGE_KEYS.MESSAGES, initialMessages);
      }
    } else {
      messages = getStorage(STORAGE_KEYS.MESSAGES, initialMessages);
    }

    const partnerIds = new Set();
    messages.forEach(m => {
      if (Number(m.sender_id) === cId) partnerIds.add(Number(m.receiver_id));
      if (Number(m.receiver_id) === cId) partnerIds.add(Number(m.sender_id));
    });

    users.forEach(u => {
      if (Number(u.user_id) !== cId) partnerIds.add(Number(u.user_id));
    });

    return Array.from(partnerIds).map(id => {
      const user = users.find(u => Number(u.user_id) === id);
      const convMessages = messages.filter(
        m => (Number(m.sender_id) === cId && Number(m.receiver_id) === id) ||
             (Number(m.sender_id) === id && Number(m.receiver_id) === cId)
      );
      const lastMessage = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;
      const unreadCount = convMessages.filter(m => Number(m.receiver_id) === cId && m.is_read === 'N').length;

      return {
        ...user,
        lastMessage,
        unreadCount
      };
    });
  },

  // HASHTAGS
  getHashtags() {
    if (!cachedHashtags.length) {
      cachedHashtags = getStorage(STORAGE_KEYS.HASHTAGS, initialHashtags);
    }
    return cachedHashtags;
  },

  async fetchHashtags() {
    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('hashtag')
          .select('*')
          .order('hashtag_name', { ascending: true });

        if (!error && data && data.length > 0) {
          cachedHashtags = data;
          setStorage(STORAGE_KEYS.HASHTAGS, data);
          return data;
        }
      } catch (e) {
        // fallback
      }
    }
    return this.getHashtags();
  }
};
