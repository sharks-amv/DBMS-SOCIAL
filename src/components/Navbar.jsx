import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  Search, 
  Bell, 
  Users, 
  LogOut, 
  LogIn, 
  Sparkles, 
  ChevronDown,
  UserCheck
} from 'lucide-react';

export function Navbar({ onOpenAuth, onOpenSupabaseModal, onSelectTab, onSearchQuery }) {
  const { currentUser, users, logout, switchUser, unreadNotificationsCount, supabaseConfig } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    if (onSearchQuery) {
      onSearchQuery(e.target.value);
    }
  };

  const isSupabaseActive = supabaseConfig.enabled && supabaseConfig.url;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => onSelectTab('feed')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.45)'
          }}>
            <Database size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ 
              fontWeight: 800, 
              fontSize: '1.2rem', 
              letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #fff 0%, #cbd5e1 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              DBMS<span style={{ color: '#818cf8', WebkitTextFillColor: '#818cf8' }}>.SOCIAL</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Relational Network
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={{
          position: 'relative',
          flex: 1,
          maxWidth: '420px',
          display: 'none',
          sm: 'block'
        }} className="navbar-search">
          <Search 
            size={18} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input 
            type="text" 
            placeholder="Search posts, #hashtags, users..."
            value={searchValue}
            onChange={handleSearchChange}
            className="form-input"
            style={{ 
              paddingLeft: '42px',
              height: '40px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.04)',
              fontSize: '0.85rem'
            }}
          />
        </div>

        {/* Actions & User State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Supabase Status Pill */}
          <button 
            onClick={onOpenSupabaseModal}
            className={`glow-pill ${isSupabaseActive ? 'green' : 'amber'}`}
            title="Click to configure Supabase Connection"
            style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '6px 12px' }}
          >
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: isSupabaseActive ? '#10b981' : '#f59e0b',
              boxShadow: isSupabaseActive ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
              display: 'inline-block'
            }}></span>
            <span>{isSupabaseActive ? 'Supabase Live' : 'Local SQL Engine'}</span>
          </button>

          {currentUser ? (
            <>
              {/* Notification Bell */}
              <button 
                onClick={() => onSelectTab('notifications')}
                className="btn-ghost"
                style={{ position: 'relative', padding: '10px', borderRadius: '50%' }}
                title="Notifications"
              >
                <Bell size={20} color="var(--text-primary)" />
                {unreadNotificationsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'var(--accent-rose)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(244, 63, 94, 0.6)'
                  }}>
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Multi-User Switcher & Active Profile Dropdown */}
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '4px 8px 4px 4px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <img 
                    src={currentUser.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                    alt={currentUser.name}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--accent-primary)'
                    }}
                  />
                  <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                      {currentUser.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      ID: #{currentUser.user_id}
                    </span>
                  </div>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </div>

                {/* Dropdown Menu: Multi-User Fast Switcher */}
                {showUserDropdown && (
                  <div 
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '120%',
                      width: '280px',
                      background: 'rgba(15, 20, 34, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '16px',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '12px',
                      zIndex: 100,
                      animation: 'fadeIn 0.15s ease'
                    }}
                  >
                    <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Switch Active Account
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Simulate multi-user interactions instantly
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                      {users.map((u) => {
                        const isCurrent = Number(u.user_id) === Number(currentUser.user_id);
                        return (
                          <div 
                            key={u.user_id}
                            onClick={() => {
                              switchUser(u.user_id);
                              setShowUserDropdown(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                              border: isCurrent ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrent) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isCurrent) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img 
                                src={u.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                                alt={u.name}
                                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isCurrent ? '#a5b4fc' : 'var(--text-primary)' }}>
                                  {u.name}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                  {u.email}
                                </div>
                              </div>
                            </div>
                            {isCurrent && <UserCheck size={16} color="#818cf8" />}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '8px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button 
                        onClick={() => {
                          setShowUserDropdown(false);
                          onSelectTab('profile');
                        }}
                        className="btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem', padding: '8px 10px' }}
                      >
                        <Users size={16} /> My Full Profile
                      </button>
                      <button 
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem', padding: '8px 10px', color: 'var(--accent-rose)' }}
                      >
                        <LogOut size={16} /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary">
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
