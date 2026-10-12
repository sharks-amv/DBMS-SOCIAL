import React from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { 
  Home, 
  Hash, 
  MessageSquare, 
  Bell, 
  User, 
  Database, 
  PlusCircle, 
  Sparkles,
  Layers
} from 'lucide-react';

export function Sidebar({ activeTab, onSelectTab, onOpenCreatePost, onOpenSupabaseModal }) {
  const { currentUser, unreadNotificationsCount } = useAuth();

  const followerCount = currentUser ? dbService.countFollowers(currentUser.user_id) : 0;
  const followingCount = currentUser ? dbService.countFollowing(currentUser.user_id) : 0;

  const navItems = [
    { id: 'feed', label: 'Home Feed', icon: Home },
    { id: 'explore', label: 'Explore & Tags', icon: Hash },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null 
    },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'database', label: 'Supabase Schema', icon: Database, action: onOpenSupabaseModal }
  ];

  return (
    <aside className="left-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Navigation Card */}
      <div className="glass-panel" style={{ padding: '16px 12px' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    onSelectTab(item.id);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.925rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 15px rgba(99, 102, 241, 0.2)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Icon 
                    size={20} 
                    color={isActive ? '#818cf8' : 'currentColor'} 
                    style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.6))' : 'none' }}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--accent-rose)',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    boxShadow: '0 0 8px rgba(244, 63, 94, 0.5)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {currentUser && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={onOpenCreatePost}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', borderRadius: '12px' }}
            >
              <PlusCircle size={18} />
              <span>Create Post</span>
            </button>
          </div>
        )}
      </div>

      {/* User Mini Summary Card */}
      {currentUser && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div 
            onClick={() => onSelectTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '14px' }}
          >
            <img 
              src={currentUser.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
              alt={currentUser.name}
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {currentUser.profile?.location || 'Member'}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '10px 12px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {followerCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Followers
              </div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {followingCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Following
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relational Stats Badge */}
      <div className="glass-panel" style={{ padding: '14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#a5b4fc', fontWeight: 600 }}>
          <Layers size={14} />
          <span>PostgreSQL Relational DB</span>
        </div>
        <div>
          Triggers & RPC functions active: <code style={{ color: '#cbd5e1' }}>fn_notify_follow</code>, <code style={{ color: '#cbd5e1' }}>count_engagement</code>
        </div>
      </div>
    </aside>
  );
}
