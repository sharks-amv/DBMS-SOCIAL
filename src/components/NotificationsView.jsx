import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { 
  Bell, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  Mail, 
  CheckCheck, 
  Filter,
  Sparkles
} from 'lucide-react';

export function NotificationsView({ onSelectUser }) {
  const { currentUser, refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  const loadNotifications = async () => {
    if (!currentUser) return;
    const data = await dbService.getNotifications(currentUser.user_id);
    setNotifications(data);
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await dbService.markNotificationsRead(currentUser.user_id);
    await loadNotifications();
    await refreshNotifications();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'FOLLOW':
        return <UserPlus size={18} color="#818cf8" />;
      case 'LIKE':
        return <Heart size={18} color="#f43f5e" fill="#f43f5e" />;
      case 'COMMENT':
        return <MessageSquare size={18} color="#06b6d4" />;
      case 'MESSAGE':
        return <Mail size={18} color="#10b981" />;
      default:
        return <Bell size={18} color="var(--accent-primary)" />;
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return n.is_read === 'N';
    return true;
  });

  const unreadTotal = notifications.filter(n => n.is_read === 'N').length;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Notifications
          </h1>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Trigger-driven events from PostgreSQL procedures & triggers
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: filter === 'all' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: filter === 'unread' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: filter === 'unread' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Unread ({unreadTotal})
            </button>
          </div>

          {unreadTotal > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <CheckCheck size={14} color="#10b981" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ opacity: 0.3, margin: '0 auto 8px auto' }} />
            <div>No notifications to display</div>
          </div>
        ) : (
          filtered.map((n) => {
            const isUnread = n.is_read === 'N';
            const time = new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });

            return (
              <div
                key={n.notification_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: isUnread ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: isUnread ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getIcon(n.notification_type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {n.notification_type} TRIGGER
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {time}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: isUnread ? '#fff' : 'var(--text-secondary)', fontWeight: isUnread ? 600 : 400 }}>
                    {n.notification_text}
                  </div>
                </div>

                {isUnread && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    boxShadow: '0 0 8px var(--accent-primary)'
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
