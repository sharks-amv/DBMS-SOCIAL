import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  Layers, 
  Zap,
  Code2
} from 'lucide-react';

export function SupabaseSettingsModal({ isOpen, onClose }) {
  const { supabaseConfig, updateConfig, resetAllData } = useAuth();
  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [enabled, setEnabled] = useState(supabaseConfig.enabled || false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState('connect'); // 'connect' | 'schema'

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url || !anonKey) {
      setTestResult({ success: false, message: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await dbService.testSupabaseConnection(url, anonKey);
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    updateConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      enabled: enabled && Boolean(url && anonKey)
    });
    onClose();
  };

  const handleCopySql = () => {
    const sqlCode = `-- ============================ SUPABASE SCHEMA ============================
-- Tables, Triggers & Procedures are available in supabase_schema.sql in the project root!`;
    navigator.clipboard?.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const tables = [
    { name: 'app_user', desc: 'User accounts (user_id, name, email, password, bio, date_joined, date_of_birth)' },
    { name: 'profile', desc: 'Extended profile (profile_picture, location, website) -> FK to app_user' },
    { name: 'post', desc: 'Feed publications (content, created_at, visibility, post_type) -> FK to app_user' },
    { name: 'post_comment', desc: 'Comments thread (comment_text, created_at) -> FK to post, app_user' },
    { name: 'post_like', desc: 'Liked posts (post_id, user_id, liked_at) -> Composite PK' },
    { name: 'user_follow', desc: 'Follow graph (follower_id, following_id, followed_at) -> Composite PK' },
    { name: 'hashtag', desc: 'Unique tags (hashtag_id, hashtag_name)' },
    { name: 'post_hashtag', desc: 'Post-to-tag mapping (post_id, hashtag_id)' },
    { name: 'media', desc: 'Media attachments (media_url, media_type, uploaded_at)' },
    { name: 'social_platform & social_account', desc: 'Third-party connected social platforms' },
    { name: 'message', desc: 'Direct messages (sender_id, receiver_id, message_text, is_read)' },
    { name: 'notification', desc: 'Triggers destination (notification_type, notification_text, is_read)' }
  ];

  const triggersAndRpcs = [
    { name: 'trg_notify_follow', type: 'Trigger', desc: 'Executes fn_notify_follow() on user_follow insert' },
    { name: 'trg_notify_like', type: 'Trigger', desc: 'Executes fn_notify_like() on post_like insert' },
    { name: 'trg_notify_comment', type: 'Trigger', desc: 'Executes fn_notify_comment() on post_comment insert' },
    { name: 'trg_notify_message', type: 'Trigger', desc: 'Executes fn_notify_message() on message insert' },
    { name: 'add_post / follow_user / unfollow_user', type: 'RPC Procedure', desc: 'Direct stored procedures for atomic mutations' },
    { name: 'add_comment / send_message', type: 'RPC Procedure', desc: 'Stored procedures for interaction' },
    { name: 'count_likes / count_comments / count_engagement', type: 'Computed Func', desc: 'Optimized SQL aggregate metrics' },
    { name: 'is_following / count_followers', type: 'Computed Func', desc: 'Social relationship graph helpers' }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-glow)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Database Architecture & Supabase Config
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                PostgreSQL Relational Schema & Real-time Integration
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          gap: '12px'
        }}>
          <button
            onClick={() => setActiveTab('connect')}
            style={{
              padding: '12px 14px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'connect' ? '#818cf8' : 'var(--text-secondary)',
              borderBottom: activeTab === 'connect' ? '2px solid #818cf8' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Supabase Connection
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            style={{
              padding: '12px 14px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'schema' ? '#818cf8' : 'var(--text-secondary)',
              borderBottom: activeTab === 'schema' ? '2px solid #818cf8' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Schema & Trigger Explorer
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'connect' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '0.825rem',
                color: '#cbd5e1',
                lineHeight: 1.5
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontWeight: 700, marginBottom: '4px' }}>
                  <Zap size={16} /> Dual-Engine Architecture
                </div>
                The app comes pre-configured with a zero-friction in-memory PostgreSQL emulator so you can test all features (login, multi-user switching, triggers, comments, likes, follower counts) instantly. You can also connect directly to your live Supabase database below!
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Supabase Project URL
                </label>
                <input 
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Supabase Anon Public API Key
                </label>
                <input 
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox"
                  id="enable-supabase"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="enable-supabase" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Enable Supabase Client Mode (Fallback to Local Engine if offline)
                </label>
              </div>

              {testResult && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: testResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                  color: testResult.success ? '#6ee7b7' : '#fca5a5'
                }}>
                  {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset local database back to default seed users and sample posts?')) {
                      resetAllData();
                      alert('Database restored to default demo seed state!');
                    }
                  }}
                  className="btn-ghost"
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                >
                  Reset Local Demo Data
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1. Relational Schema Tables
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>11 Tables</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tables.map(t => (
                    <div key={t.name} style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem'
                    }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{t.name}</span>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '0.75rem' }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    2. Triggers & Stored Procedures
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {triggersAndRpcs.map(trg => (
                    <div key={trg.name} style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{trg.name}</span>
                        <span className="glow-pill green" style={{ fontSize: '0.65rem' }}>{trg.type}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '0.75rem' }}>{trg.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10, 13, 20, 0.4)'
        }}>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
