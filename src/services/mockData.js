export const initialUsers = [
  {
    user_id: 1,
    name: "Alex Rivera",
    email: "alex@example.com",
    password: "password123",
    date_joined: "2024-01-15T10:00:00Z",
    date_of_birth: "1996-05-14",
    bio: "Full-stack software architect & open source contributor. Crafting next-gen web systems with Supabase & React.",
    profile: {
      profile_id: 1,
      profile_picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      location: "San Francisco, CA",
      website: "https://alexrivera.dev"
    }
  },
  {
    user_id: 2,
    name: "Sarah Chen",
    email: "sarah@example.com",
    password: "password123",
    date_joined: "2024-02-10T14:30:00Z",
    date_of_birth: "1998-08-22",
    bio: "UI/UX Designer & Creative Technologist. Obsessed with micro-interactions, dark mode glows, and human-centered design ✨",
    profile: {
      profile_id: 2,
      profile_picture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      location: "New York, NY",
      website: "https://sarahchen.design"
    }
  },
  {
    user_id: 3,
    name: "Marcus Vance",
    email: "marcus@example.com",
    password: "password123",
    date_joined: "2024-03-05T09:15:00Z",
    date_of_birth: "1992-11-03",
    bio: "Database Administrator & PostgreSQL Evangelist. Query optimization and trigger design is my cardio ⚡",
    profile: {
      profile_id: 3,
      profile_picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      location: "Austin, TX",
      website: "https://vance-db.io"
    }
  },
  {
    user_id: 4,
    name: "Elena Rostova",
    email: "elena@example.com",
    password: "password123",
    date_joined: "2024-04-01T11:45:00Z",
    date_of_birth: "1995-02-18",
    bio: "AI Engineer & Cloud Architect. Building autonomous distributed agents and real-time knowledge graphs.",
    profile: {
      profile_id: 4,
      profile_picture: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
      location: "Seattle, WA",
      website: "https://rostova.ai"
    }
  },
  {
    user_id: 5,
    name: "Leo Brooks",
    email: "leo@example.com",
    password: "password123",
    date_joined: "2024-04-12T16:20:00Z",
    date_of_birth: "2000-07-09",
    bio: "Product engineer & frontend nerd. Experimenting with CSS canvas animations and sound design.",
    profile: {
      profile_id: 5,
      profile_picture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      location: "Toronto, Canada",
      website: "https://leobrooks.me"
    }
  }
];

export const initialFollows = [
  { follower_id: 1, following_id: 2, followed_at: "2024-02-15T12:00:00Z" },
  { follower_id: 1, following_id: 3, followed_at: "2024-03-06T08:00:00Z" },
  { follower_id: 2, following_id: 1, followed_at: "2024-02-16T09:30:00Z" },
  { follower_id: 3, following_id: 1, followed_at: "2024-03-07T11:00:00Z" },
  { follower_id: 4, following_id: 1, followed_at: "2024-04-02T15:00:00Z" },
  { follower_id: 2, following_id: 4, followed_at: "2024-04-03T10:00:00Z" },
  { follower_id: 5, following_id: 1, followed_at: "2024-04-13T12:00:00Z" }
];

export const initialHashtags = [
  { hashtag_id: 1, hashtag_name: "webdev" },
  { hashtag_id: 2, hashtag_name: "supabase" },
  { hashtag_id: 3, hashtag_name: "react" },
  { hashtag_id: 4, hashtag_name: "database" },
  { hashtag_id: 5, hashtag_name: "design" },
  { hashtag_id: 6, hashtag_name: "fullstack" },
  { hashtag_id: 7, hashtag_name: "postgres" }
];

export const initialPosts = [
  {
    post_id: 1,
    user_id: 1,
    content: "Just deployed our new real-time database schema with PostgreSQL triggers! The latency dropped by 65%. Building with modern relational architecture is an absolute game-changer. #database #supabase #webdev",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    visibility: "public",
    post_type: "status",
    media_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80"
  },
  {
    post_id: 2,
    user_id: 2,
    content: "Glassmorphism, fluid typography, and dark mode neon accents completed! What are your favorite CSS tricks for modern web apps? Drop your thoughts below 👇 #design #webdev",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    visibility: "public",
    post_type: "status",
    media_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80"
  },
  {
    post_id: 3,
    user_id: 3,
    content: "Pro tip for high-traffic social apps: Always index your foreign keys! Without indexes on follower_id and post_id, table scans will degrade your feeds at scale. Keep queries sharp! ⚡ #database #fullstack #postgres",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    visibility: "public",
    post_type: "status",
    media_url: null
  },
  {
    post_id: 4,
    user_id: 4,
    content: "Exploring multi-agent collaborative systems and real-time streaming notifications. The speed of iteration is thrilling! Who is experimenting with vector search alongside relational SQL? #react #fullstack",
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    visibility: "public",
    post_type: "status",
    media_url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1000&q=80"
  }
];

export const initialLikes = [
  { post_id: 1, user_id: 2, liked_at: "2024-04-10T11:00:00Z" },
  { post_id: 1, user_id: 3, liked_at: "2024-04-10T12:00:00Z" },
  { post_id: 1, user_id: 4, liked_at: "2024-04-10T13:00:00Z" },
  { post_id: 2, user_id: 1, liked_at: "2024-04-10T14:00:00Z" },
  { post_id: 2, user_id: 3, liked_at: "2024-04-10T15:00:00Z" },
  { post_id: 3, user_id: 1, liked_at: "2024-04-10T16:00:00Z" }
];

export const initialComments = [
  {
    comment_id: 1,
    post_id: 1,
    user_id: 2,
    comment_text: "Incredible latency improvement! Triggers and indexed RPCs make a massive difference.",
    created_at: new Date(Date.now() - 3600000 * 2.5).toISOString()
  },
  {
    comment_id: 2,
    post_id: 1,
    user_id: 3,
    comment_text: "PostgreSQL query plans never lie! Solid architectural work Alex.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    comment_id: 3,
    post_id: 2,
    user_id: 1,
    comment_text: "The neon glow effects look pristine. Would love to inspect the token variables!",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    comment_id: 4,
    post_id: 3,
    user_id: 4,
    comment_text: "Essential advice. Missing index on foreign keys is the #1 silent killer in production.",
    created_at: new Date(Date.now() - 3600000 * 11).toISOString()
  }
];

export const initialMessages = [
  {
    message_id: 1,
    sender_id: 2,
    receiver_id: 1,
    message_text: "Hey Alex! Did you get a chance to review the new design mockups for the social feed?",
    sent_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    is_read: "Y"
  },
  {
    message_id: 2,
    sender_id: 1,
    receiver_id: 2,
    message_text: "Hey Sarah! Yes, they look sensational. Integrating them with the Supabase schema right now!",
    sent_at: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    is_read: "Y"
  },
  {
    message_id: 3,
    sender_id: 3,
    receiver_id: 1,
    message_text: "Alex, check out the updated schema indexing script when you have time. Added composite indexes for follower lookup.",
    sent_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    is_read: "N"
  }
];

export const initialNotifications = [
  {
    notification_id: 1,
    user_id: 1,
    notification_type: "FOLLOW",
    notification_text: "Sarah Chen started following you",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    is_read: "Y"
  },
  {
    notification_id: 2,
    user_id: 1,
    notification_type: "LIKE",
    notification_text: "Sarah Chen liked your post",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    is_read: "Y"
  },
  {
    notification_id: 3,
    user_id: 1,
    notification_type: "COMMENT",
    notification_text: "Marcus Vance commented on your post",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_read: "N"
  },
  {
    notification_id: 4,
    user_id: 1,
    notification_type: "MESSAGE",
    notification_text: "You have a new message from Marcus Vance",
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    is_read: "N"
  }
];
