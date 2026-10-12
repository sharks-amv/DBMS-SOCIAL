import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { 
  Send, 
  Image as ImageIcon, 
  Globe, 
  Users, 
  Sparkles, 
  Hash, 
  AlertCircle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function CreatePostBox({ onPostCreated }) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [postType, setPostType] = useState('status');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) return;

    setIsSubmitting(true);
    try {
      await dbService.addPost(
        currentUser.user_id,
        content.trim(),
        visibility,
        mediaUrl ? 'media' : postType,
        mediaUrl || null
      );
      setContent('');
      setMediaUrl('');
      setShowMediaInput(false);

      // Micro celebration
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {
        // confetti fallback silent
      }

      if (onPostCreated) onPostCreated();
    } catch (err) {
      console.error("Failed to create post", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddHashtag = (tag) => {
    setContent(prev => (prev ? `${prev} #${tag}` : `#${tag}`));
  };

  const sampleImages = [
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '14px' }}>
        <img 
          src={currentUser.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
          alt={currentUser.name}
          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--accent-primary)' }}
        />
        <div style={{ flex: 1 }}>
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}? Share an update, query, or architecture note...`}
              rows={3}
              style={{
                width: '100%',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.975rem',
                lineHeight: 1.5,
                resize: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />

            {/* Media URL Input Drawer */}
            {showMediaInput && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Attach Image URL</span>
                  <button type="button" onClick={() => { setShowMediaInput(false); setMediaUrl(''); }} className="btn-ghost" style={{ padding: '2px' }}>
                    <X size={14} />
                  </button>
                </div>
                <input 
                  type="url"
                  placeholder="Paste image link (e.g. https://images.unsplash.com/...)"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '8px 12px', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quick demo pictures:</span>
                  {sampleImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMediaUrl(img)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      Photo #{i+1}
                    </button>
                  ))}
                </div>
                {mediaUrl && (
                  <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', maxHeight: '180px' }}>
                    <img src={mediaUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => alert('Invalid image link')} />
                  </div>
                )}
              </div>
            )}

            {/* Quick Hashtag Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '10px 0' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tags:</span>
              {['database', 'supabase', 'webdev', 'fullstack', 'react'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddHashtag(tag)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    color: '#a5b4fc',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* Bottom Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Media Button */}
                <button
                  type="button"
                  onClick={() => setShowMediaInput(!showMediaInput)}
                  className="btn-ghost"
                  title="Add Image Attachment"
                  style={{ color: showMediaInput || mediaUrl ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                >
                  <ImageIcon size={18} />
                  <span style={{ fontSize: '0.8rem' }}>Media</span>
                </button>

                {/* Visibility Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 8px', borderRadius: '8px' }}>
                  {visibility === 'public' ? <Globe size={14} color="#10b981" /> : <Users size={14} color="#f59e0b" />}
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    <option value="public" style={{ background: '#0f1422', color: '#fff' }}>Public</option>
                    <option value="followers" style={{ background: '#0f1422', color: '#fff' }}>Followers Only</option>
                  </select>
                </div>
              </div>

              {/* Submit Post Button */}
              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && !mediaUrl)}
                className="btn-primary"
                style={{
                  padding: '8px 20px',
                  opacity: (!content.trim() && !mediaUrl) ? 0.5 : 1,
                  cursor: (!content.trim() && !mediaUrl) ? 'not-allowed' : 'pointer'
                }}
              >
                <Send size={15} />
                <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
