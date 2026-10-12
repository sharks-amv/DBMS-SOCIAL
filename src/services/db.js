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

// Storage keys for local relational simulator
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

// Safe JSON get/set
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

// Initialize tables if first run
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
  // Default active user is user 1 (Alex Rivera)
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

// Initial client creation if config present
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
// UNIFIED DATA SERVICE (Supabase + Exact Relational Logic Simulation)
// ============================================================

export const dbService = {
  // Test connection to Supabase
  async testSupabaseConnection(url, anonKey) {
    try {
      const client = createClient(url, anonKey);
      // Try querying app_user table
      const { data, error } = await client.from('app_user').select('user_id').limit(1);
      if (error) throw error;
      return { success: true, message: 'Connected successfully to Supabase!' };
    } catch (err) {
      return { success: false, message: err.message || 'Connection failed' };
    }
  },

  // USERS & AUTHENTICATION
  async getAllUsers() {
    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabaseClient
          .from('app_user')
          .select(`
            user_id, name, email, bio, date_joined, date_of_birth,
            profile (profile_id, profile_picture, location, website)
          `);
        if (!error && data && data.length > 0) {
          return data.map(u => ({
            ...u,
            profile: Array.isArray(u.profile) ? u.profile[0] : (u.profile || {})
          }));
        }
      } catch (e) {
        console.warn("Supabase fetch users error, falling back to local dataset:", e);
      }
    }
    initLocalStorage();
    return getStorage(STORAGE_KEYS.USERS, initialUsers);
  },

  async getUserById(userId) {
    const users = await this.getAllUsers();
    return users.find(u => Number(u.user_id) === Number(userId)) || null;
  },

  async login(email, password) {
    const users = await this.getAllUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('User not found with this email.');
    }
    if (user.password && user.password !== password) {
      throw new Error('Incorrect password.');
    }
    setStorage(STORAGE_KEYS.ACTIVE_USER, user);
    return user;
  },

  async register(userData) {
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

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

    if (isUsingSupabase()) {
      try {
        const { data: insertedUser, error: userErr } = await supabaseClient
          .from('app_user')
          .insert([{
            name: newUser.name,
            email: newUser.email,
            password: newUser.password,
            date_of_birth: newUser.date_of_birth,
            bio: newUser.bio
          }])
          .select()
          .single();

        if (userErr) throw userErr;
        
        await supabaseClient.from('profile').insert([{
          user_id: insertedUser.user_id,
          profile_picture: newUser.profile.profile_picture,
          location: newUser.profile.location,
          website: newUser.profile.website
        }]);

        newUser.user_id = insertedUser.user_id;
      } catch (e) {
        console.warn("Supabase insert user failed, proceeding with local store:", e);
      }
    }

    const updated = [newUser, ...users];
    setStorage(STORAGE_KEYS.USERS, updated);
    setStorage(STORAGE_KEYS.ACTIVE_USER, newUser);
    return newUser;
  },

  async updateProfile(userId, { name, bio, location, website, profile_picture, date_of_birth }) {
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

    if (isUsingSupabase()) {
      try {
        await supabaseClient.from('app_user').update({ name, bio, date_of_birth }).eq('user_id', userId);
        await supabaseClient.from('profile').update({ location, website, profile_picture }).eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase update profile error:", e);
      }
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

  // POSTS & FEED
  async getPosts(currentUserId, filter = 'all') {
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

    // Sort by created_at desc
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return filtered.map(post => {
      const author = users.find(u => Number(u.user_id) === Number(post.user_id)) || {
        name: 'Unknown User',
        profile: { profile_picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' }
      };

      const postLikes = likes.filter(l => Number(l.post_id) === Number(post.post_id));
      const postComments = comments.filter(c => Number(c.post_id) === Number(post.post_id));
      const hasLiked = postLikes.some(l => Number(l.user_id) === Number(currentUserId));
      const engagement = postLikes.length + postComments.length;

      return {
        ...post,
        author,
        like_count: postLikes.length,
        comment_count: postComments.length,
        engagement_count: engagement,
        has_liked: hasLiked
      };
    });
  },

  // Procedure: add_post(p_user_id, p_content)
  async addPost(userId, content, visibility = 'public', postType = 'status', mediaUrl = null) {
    const posts = getStorage(STORAGE_KEYS.POSTS, initialPosts);
    const newPostId = posts.length > 0 ? Math.max(...posts.map(p => p.post_id)) + 1 : 1;

    const newPost = {
      post_id: newPostId,
      user_id: Number(userId),
      content,
      created_at: new Date().toISOString(),
      visibility,
      post_type: postType,
      media_url: mediaUrl
    };

    const updated = [newPost, ...posts];
    setStorage(STORAGE_KEYS.POSTS, updated);

    // Extract hashtags & save
    const hashtagsFound = content.match(/#[a-zA-Z0-9_]+/g);
    if (hashtagsFound) {
      const hashtags = getStorage(STORAGE_KEYS.HASHTAGS, initialHashtags);
      hashtagsFound.forEach(tag => {
        const cleanTag = tag.slice(1).toLowerCase();
        if (!hashtags.some(h => h.hashtag_name.toLowerCase() === cleanTag)) {
          hashtags.push({ hashtag_id: hashtags.length + 1, hashtag_name: cleanTag });
        }
      });
      setStorage(STORAGE_KEYS.HASHTAGS, hashtags);
    }

    if (isUsingSupabase()) {
      try {
        await supabaseClient.rpc('add_post', { p_user_id: userId, p_content: content });
      } catch (e) {
        console.warn("Supabase add_post RPC error:", e);
      }
    }

    return newPost;
  },

  // Procedure & Trigger: post_like + trg_notify_like
  async likePost(postId, userId) {
    const likes = getStorage(STORAGE_KEYS.LIKES, initialLikes);
    const exists = likes.some(l => Number(l.post_id) === Number(postId) && Number(l.user_id) === Number(userId));
    if (exists) return;

    const updated = [...likes, { post_id: Number(postId), user_id: Number(userId), liked_at: new Date().toISOString() }];
    setStorage(STORAGE_KEYS.LIKES, updated);

    // Trigger: fn_notify_like()
    const posts = getStorage(STORAGE_KEYS.POSTS, initialPosts);
    const post = posts.find(p => Number(p.post_id) === Number(postId));
    if (post && Number(post.user_id) !== Number(userId)) {
      const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
      const actor = users.find(u => Number(u.user_id) === Number(userId));
      this.createNotification(
        post.user_id,
        'LIKE',
        `${actor?.name || 'Someone'} liked your post`
      );
    }

    if (isUsingSupabase()) {
      try {
        await supabaseClient.from('post_like').insert([{ post_id: postId, user_id: userId }]);
      } catch (e) {
        console.warn("Supabase like error:", e);
      }
    }
  },

  async unlikePost(postId, userId) {
    const likes = getStorage(STORAGE_KEYS.LIKES, initialLikes);
    const updated = likes.filter(l => !(Number(l.post_id) === Number(postId) && Number(l.user_id) === Number(userId)));
    setStorage(STORAGE_KEYS.LIKES, updated);

    if (isUsingSupabase()) {
      try {
        await supabaseClient
          .from('post_like')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn("Supabase unlike error:", e);
      }
    }
  },

  // Procedure & Trigger: add_comment(p_post_id, p_user_id, p_text) + trg_notify_comment
  async addComment(postId, userId, commentText) {
    const comments = getStorage(STORAGE_KEYS.COMMENTS, initialComments);
    const newCommentId = comments.length > 0 ? Math.max(...comments.map(c => c.comment_id)) + 1 : 1;

    const newComment = {
      comment_id: newCommentId,
      post_id: Number(postId),
      user_id: Number(userId),
      comment_text: commentText,
      created_at: new Date().toISOString()
    };

    setStorage(STORAGE_KEYS.COMMENTS, [...comments, newComment]);

    // Trigger: fn_notify_comment()
    const posts = getStorage(STORAGE_KEYS.POSTS, initialPosts);
    const post = posts.find(p => Number(p.post_id) === Number(postId));
    if (post && Number(post.user_id) !== Number(userId)) {
      const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
      const commenter = users.find(u => Number(u.user_id) === Number(userId));
      this.createNotification(
        post.user_id,
        'COMMENT',
        `${commenter?.name || 'Someone'} commented on your post`
      );
    }

    if (isUsingSupabase()) {
      try {
        await supabaseClient.rpc('add_comment', {
          p_post_id: postId,
          p_user_id: userId,
          p_text: commentText
        });
      } catch (e) {
        console.warn("Supabase add_comment RPC error:", e);
      }
    }

    return newComment;
  },

  async getComments(postId) {
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

  // Procedure & Trigger: follow_user + trg_notify_follow
  async followUser(followerId, followingId) {
    if (Number(followerId) === Number(followingId)) return;
    const follows = getStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
    const exists = follows.some(
      f => Number(f.follower_id) === Number(followerId) && Number(f.following_id) === Number(followingId)
    );
    if (exists) return;

    setStorage(STORAGE_KEYS.FOLLOWS, [
      ...follows,
      { follower_id: Number(followerId), following_id: Number(followingId), followed_at: new Date().toISOString() }
    ]);

    // Trigger: fn_notify_follow()
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    const follower = users.find(u => Number(u.user_id) === Number(followerId));
    this.createNotification(
      followingId,
      'FOLLOW',
      `${follower?.name || 'Someone'} started following you`
    );

    if (isUsingSupabase()) {
      try {
        await supabaseClient.rpc('follow_user', {
          p_follower_id: followerId,
          p_following_id: followingId
        });
      } catch (e) {
        console.warn("Supabase follow_user error:", e);
      }
    }
  },

  // Procedure: unfollow_user(p_follower_id, p_following_id)
  async unfollowUser(followerId, followingId) {
    const follows = getStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
    const updated = follows.filter(
      f => !(Number(f.follower_id) === Number(followerId) && Number(f.following_id) === Number(followingId))
    );
    setStorage(STORAGE_KEYS.FOLLOWS, updated);

    if (isUsingSupabase()) {
      try {
        await supabaseClient.rpc('unfollow_user', {
          p_follower_id: followerId,
          p_following_id: followingId
        });
      } catch (e) {
        console.warn("Supabase unfollow_user error:", e);
      }
    }
  },

  // Computed function: is_following(p_follower_id, p_following_id)
  isFollowing(followerId, followingId) {
    const follows = getStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
    return follows.some(
      f => Number(f.follower_id) === Number(followerId) && Number(f.following_id) === Number(followingId)
    );
  },

  // Computed function: count_followers(p_user_id)
  countFollowers(userId) {
    const follows = getStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
    return follows.filter(f => Number(f.following_id) === Number(userId)).length;
  },

  countFollowing(userId) {
    const follows = getStorage(STORAGE_KEYS.FOLLOWS, initialFollows);
    return follows.filter(f => Number(f.follower_id) === Number(userId)).length;
  },

  // NOTIFICATIONS
  createNotification(userId, type, text) {
    const notifications = getStorage(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const newId = notifications.length > 0 ? Math.max(...notifications.map(n => n.notification_id)) + 1 : 1;
    const item = {
      notification_id: newId,
      user_id: Number(userId),
      notification_type: type,
      notification_text: text,
      created_at: new Date().toISOString(),
      is_read: 'N'
    };
    setStorage(STORAGE_KEYS.NOTIFICATIONS, [item, ...notifications]);
  },

  async getNotifications(userId) {
    const notifications = getStorage(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    return notifications
      .filter(n => Number(n.user_id) === Number(userId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // Procedure: mark_notifications_read(p_user_id)
  async markNotificationsRead(userId) {
    const notifications = getStorage(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const updated = notifications.map(n => {
      if (Number(n.user_id) === Number(userId)) {
        return { ...n, is_read: 'Y' };
      }
      return n;
    });
    setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);

    if (isUsingSupabase()) {
      try {
        await supabaseClient.rpc('mark_notifications_read', { p_user_id: userId });
      } catch (e) {
        console.warn("Supabase mark_notifications_read error:", e);
      }
    }
  },

  // Procedure & Trigger: send_message(p_sender_id, p_receiver_id, p_text) + trg_notify_message
  async sendMessage(senderId, receiverId, messageText) {
    const messages = getStorage(STORAGE_KEYS.MESSAGES, initialMessages);
    const newId = messages.length > 0 ? Math.max(...messages.map(m => m.message_id)) + 1 : 1;

    const newMsg = {
      message_id: newId,
      sender_id: Number(senderId),
      receiver_id: Number(receiverId),
      message_text: messageText,
      sent_at: new Date().toISOString(),
      is_read: 'N'
    };

    setStorage(STORAGE_KEYS.MESSAGES, [...messages, newMsg]);

    // Trigger: fn_notify_message()
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    const sender = users.find(u => Number(u.user_id) === Number(senderId));
    this.createNotification(
      receiverId,
      'MESSAGE',
      `You have a new message from ${sender?.name || 'Someone'}`
    );

    if (isUsingSupabase()) {
      try {
        await supabaseClient.rpc('send_message', {
          p_sender_id: senderId,
          p_receiver_id: receiverId,
          p_text: messageText
        });
      } catch (e) {
        console.warn("Supabase send_message error:", e);
      }
    }

    return newMsg;
  },

  async getMessages(userId1, userId2) {
    const messages = getStorage(STORAGE_KEYS.MESSAGES, initialMessages);
    const u1 = Number(userId1);
    const u2 = Number(userId2);
    return messages
      .filter(m => (Number(m.sender_id) === u1 && Number(m.receiver_id) === u2) ||
                   (Number(m.sender_id) === u2 && Number(m.receiver_id) === u1))
      .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
  },

  async getRecentChatUsers(currentUserId) {
    const messages = getStorage(STORAGE_KEYS.MESSAGES, initialMessages);
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    const cId = Number(currentUserId);

    const partnerIds = new Set();
    messages.forEach(m => {
      if (Number(m.sender_id) === cId) partnerIds.add(Number(m.receiver_id));
      if (Number(m.receiver_id) === cId) partnerIds.add(Number(m.sender_id));
    });

    // Also include other users so the user can easily initiate a conversation
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

  getHashtags() {
    initLocalStorage();
    return getStorage(STORAGE_KEYS.HASHTAGS, initialHashtags);
  }
};
