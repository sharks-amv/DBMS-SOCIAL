import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { dbService } from './services/db';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { CreatePostBox } from './components/CreatePostBox';
import { PostCard } from './components/PostCard';
import { UserProfileView } from './components/UserProfileView';
import { MessagesView } from './components/MessagesView';
import { NotificationsView } from './components/NotificationsView';
import { ExploreView } from './components/ExploreView';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';
import { AuthModal } from './components/AuthModal';
import { 
  Home, 
  Hash, 
  MessageSquare, 
  Bell, 
  User, 
  Database,
  Sparkles,
  Layers,
  Users,
  Compass
} from 'lucide-react';

function MainApp() {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'explore' | 'messages' | 'notifications' | 'profile'
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'following'
  const [posts, setPosts] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [selectedTag, setSelectedTag] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);

  const loadFeed = async () => {
    if (!currentUser) return;
    setFeedLoading(true);
    try {
      const data = await dbService.getPosts(currentUser.user_id, feedFilter);
      setPosts(data);
    } catch (err) {
      console.error("Failed to load feed", err);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadFeed();
    }
  }, [currentUser, feedFilter]);

  const handleSelectTab = (tab) => {
    if (tab === 'profile') {
      setSelectedProfileId(currentUser?.user_id);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectUser = (userId) => {
    setSelectedProfileId(userId);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHashtag = (tag) => {
    setSelectedTag(tag);
    setActiveTab('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchQuery = (query) => {
    if (query) {
      setActiveTab('explore');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: '#fff',
        gap: '16px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '16px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)',
          animation: 'pulseGlow 1.5s infinite ease-in-out'
        }}>
          <Database size={28} color="#fff" />
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Loading DBMS-Social...
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar 
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        onSelectTab={handleSelectTab}
        onSearchQuery={handleSearchQuery}
      />

      {/* Main Grid View */}
      <main className="app-main-content">
        {/* Left Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenCreatePost={() => {
            setActiveTab('feed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        />

        {/* Center Main Stage */}
        <section style={{ minWidth: 0 }}>
          {activeTab === 'feed' && (
            <div>
              {/* Feed Header Tabs: For You vs Following */}
              <div className="glass-panel" style={{
                display: 'flex',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '18px',
                gap: '4px'
              }}>
                <button
                  onClick={() => setFeedFilter('all')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: feedFilter === 'all' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    border: feedFilter === 'all' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    color: feedFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Global Feed
                </button>
                <button
                  onClick={() => setFeedFilter('following')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: feedFilter === 'following' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    border: feedFilter === 'following' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    color: feedFilter === 'following' ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Following Only
                </button>
              </div>

              {/* Create Post Widget */}
              <CreatePostBox onPostCreated={loadFeed} />

              {/* Feed Posts */}
              {posts.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {feedFilter === 'following' 
                    ? "You aren't following anyone with posts yet. Switch to Global Feed or explore suggestions on the right!"
                    : "No posts found in the database. Create the first one above!"}
                </div>
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post.post_id}
                    post={post}
                    onSelectUser={handleSelectUser}
                    onSelectHashtag={handleSelectHashtag}
                    onUpdate={loadFeed}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'explore' && (
            <ExploreView 
              selectedTag={selectedTag}
              onSelectHashtag={handleSelectHashtag}
              onSelectUser={handleSelectUser}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesView 
              onSelectUser={handleSelectUser}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView 
              onSelectUser={handleSelectUser}
            />
          )}

          {activeTab === 'profile' && (
            <UserProfileView 
              userId={selectedProfileId}
              onSelectHashtag={handleSelectHashtag}
              onSelectUser={handleSelectUser}
              onRefreshFeed={loadFeed}
            />
          )}
        </section>

        {/* Right Sidebar */}
        <RightSidebar 
          onSelectHashtag={handleSelectHashtag}
          onSelectUser={handleSelectUser}
          onRefreshFeed={loadFeed}
        />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button onClick={() => handleSelectTab('feed')} className="btn-ghost" style={{ color: activeTab === 'feed' ? '#818cf8' : 'var(--text-secondary)' }}>
          <Home size={22} />
        </button>
        <button onClick={() => handleSelectTab('explore')} className="btn-ghost" style={{ color: activeTab === 'explore' ? '#818cf8' : 'var(--text-secondary)' }}>
          <Hash size={22} />
        </button>
        <button onClick={() => handleSelectTab('messages')} className="btn-ghost" style={{ color: activeTab === 'messages' ? '#818cf8' : 'var(--text-secondary)' }}>
          <MessageSquare size={22} />
        </button>
        <button onClick={() => handleSelectTab('notifications')} className="btn-ghost" style={{ color: activeTab === 'notifications' ? '#818cf8' : 'var(--text-secondary)' }}>
          <Bell size={22} />
        </button>
        <button onClick={() => handleSelectTab('profile')} className="btn-ghost" style={{ color: activeTab === 'profile' ? '#818cf8' : 'var(--text-secondary)' }}>
          <User size={22} />
        </button>
      </nav>

      {/* Modals */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />

      <SupabaseSettingsModal 
        isOpen={isSupabaseOpen} 
        onClose={() => setIsSupabaseOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
