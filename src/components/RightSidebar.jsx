import React from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { 
  TrendingUp, 
  UserPlus, 
  UserCheck, 
  Hash, 
  Shuffle, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export function RightSidebar({ onSelectHashtag, onSelectUser, onRefreshFeed }) {
  const { currentUser, users, switchUser } = useAuth();
  const [hashtags, setHashtags] = React.useState(dbService.getHashtags());

  React.useEffect(() => {
    dbService.fetchHashtags().then(tags => {
      if (tags && tags.length) setHashtags(tags);
    });
  }, []);

  const handleToggleFollow = async (targetUserId) => {
    if (!currentUser) return;
    const isCurrentlyFollowing = dbService.isFollowing(currentUser.user_id, targetUserId);
    if (isCurrentlyFollowing) {
      await dbService.unfollowUser(currentUser.user_id, targetUserId);
    } else {
      await dbService.followUser(currentUser.user_id, targetUserId);
    }
    if (onRefreshFeed) onRefreshFeed();
  };

  const otherUsers = currentUser 
    ? users.filter(u => Number(u.user_id) !== Number(currentUser.user_id))
    : users;

  return (
    <aside className="right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Multi-User Quick Simulator Widget */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#a5b4fc' }}>
            <Shuffle size={16} />
            <span>Fast User Switcher</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Multi-User</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
          Switch between users to test follow notifications, likes, comments, and direct messaging in real time.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {users.map((u) => {
            const isActive = currentUser && Number(currentUser.user_id) === Number(u.user_id);
            return (
              <button
                key={u.user_id}
                onClick={() => switchUser(u.user_id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src={u.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                    alt={u.name}
                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{u.name}</span>
                </div>
                {isActive ? (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#818cf8', background: 'rgba(99, 102, 241, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                    ACTIVE
                  </span>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Switch
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Who to Follow Widget */}
      {currentUser && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            <UserPlus size={16} color="var(--accent-primary)" />
            <span>Who to Follow</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {otherUsers.slice(0, 4).map((u) => {
              const isFollowing = dbService.isFollowing(currentUser.user_id, u.user_id);

              return (
                <div key={u.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div 
                    onClick={() => onSelectUser(u.user_id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                  >
                    <img 
                      src={u.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                      alt={u.name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {u.profile?.location || 'Member'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFollow(u.user_id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isFollowing ? '1px solid var(--border-medium)' : 'none',
                      background: isFollowing ? 'rgba(255, 255, 255, 0.08)' : 'var(--accent-gradient)',
                      color: isFollowing ? 'var(--text-secondary)' : '#ffffff',
                      boxShadow: isFollowing ? 'none' : '0 2px 10px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trending Hashtags Widget */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          <TrendingUp size={16} color="var(--accent-cyan)" />
          <span>Trending Hashtags</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {hashtags.map((tag) => (
            <button
              key={tag.hashtag_id}
              onClick={() => onSelectHashtag(tag.hashtag_name)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.color = '#a5b4fc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Hash size={12} color="#818cf8" />
              <span>{tag.hashtag_name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Schema Security & Compliance footer info */}
      <div style={{ padding: '0 8px', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        DBMS-Social v1.0 • Supabase PostgreSQL 15+ Ready • Cascading Deletes • Triggers & Procedures Verified
      </div>
    </aside>
  );
}
