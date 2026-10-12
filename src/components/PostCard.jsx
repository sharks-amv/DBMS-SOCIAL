import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Globe, 
  Users, 
  Flame, 
  Check,
  MoreHorizontal
} from 'lucide-react';

export function PostCard({ post, onSelectUser, onSelectHashtag, onUpdate }) {
  const { currentUser } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [hasLiked, setHasLiked] = useState(post.has_liked);
  const [heartAnim, setHeartAnim] = useState(false);

  useEffect(() => {
    setLikeCount(post.like_count);
    setHasLiked(post.has_liked);
  }, [post.like_count, post.has_liked]);

  const loadComments = async () => {
    const data = await dbService.getComments(post.post_id);
    setComments(data);
  };

  const handleToggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleToggleLike = async () => {
    if (!currentUser || isLiking) return;
    setIsLiking(true);

    if (hasLiked) {
      setHasLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
      await dbService.unlikePost(post.post_id, currentUser.user_id);
    } else {
      setHasLiked(true);
      setLikeCount(prev => prev + 1);
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 400);
      await dbService.likePost(post.post_id, currentUser.user_id);
    }

    setIsLiking(false);
    if (onUpdate) onUpdate();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    await dbService.addComment(post.post_id, currentUser.user_id, commentText.trim());
    setCommentText('');
    await loadComments();
    if (onUpdate) onUpdate();
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.origin + `#post-${post.post_id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render text with clickable hashtags
  const renderFormattedContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectHashtag) onSelectHashtag(tag);
            }}
            style={{
              color: '#818cf8',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const formatTime = (dateStr) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch (e) {
      return '';
    }
  };

  return (
    <article className="glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div 
          onClick={() => onSelectUser && onSelectUser(post.author.user_id || post.user_id)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <img 
            src={post.author.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
            alt={post.author.name}
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255, 255, 255, 0.1)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {post.author.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                • {formatTime(post.created_at)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {post.author.profile?.location || 'Member'}
              </span>
              {post.visibility === 'followers' && (
                <span className="glow-pill amber" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                  <Users size={10} /> Followers
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Engagement Pill */}
        <div 
          className="glow-pill" 
          title="Computed function count_engagement() = likes + comments"
          style={{ fontSize: '0.7rem' }}
        >
          <Flame size={12} color="#ec4899" />
          <span>{post.engagement_count || (likeCount + (post.comment_count || 0))} Engaged</span>
        </div>
      </div>

      {/* Post Text */}
      <div style={{
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: '#e2e8f0',
        whiteSpace: 'pre-wrap',
        marginBottom: post.media_url ? '14px' : '18px'
      }}>
        {renderFormattedContent(post.content)}
      </div>

      {/* Media Attachment */}
      {post.media_url && (
        <div style={{
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '16px',
          maxHeight: '440px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)'
        }}>
          <img 
            src={post.media_url} 
            alt="Post attachment" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Post Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Like Button */}
          <button
            onClick={handleToggleLike}
            className="btn-ghost"
            style={{
              padding: '6px 10px',
              borderRadius: '999px',
              color: hasLiked ? 'var(--accent-rose)' : 'var(--text-secondary)',
              background: hasLiked ? 'rgba(244, 63, 94, 0.12)' : 'transparent',
              gap: '6px'
            }}
          >
            <Heart 
              size={18} 
              fill={hasLiked ? 'currentColor' : 'none'} 
              className={heartAnim ? 'heart-pop' : ''} 
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{likeCount}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleToggleComments}
            className="btn-ghost"
            style={{
              padding: '6px 10px',
              borderRadius: '999px',
              color: showComments ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: showComments ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              gap: '6px'
            }}
          >
            <MessageCircle size={18} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {comments.length > 0 ? comments.length : post.comment_count || 0}
            </span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleCopy}
          className="btn-ghost"
          style={{ padding: '6px 10px', borderRadius: '999px', fontSize: '0.8rem' }}
          title="Share Post"
        >
          {copied ? (
            <>
              <Check size={16} color="#10b981" />
              <span style={{ color: '#10b981', fontWeight: 600 }}>Link Copied</span>
            </>
          ) : (
            <>
              <Share2 size={16} />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* Expanded Comments Thread */}
      {showComments && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {/* Add Comment Input */}
          {currentUser && (
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <img 
                src={currentUser.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                alt={currentUser.name}
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="form-input"
                  style={{ height: '36px', fontSize: '0.85rem', borderRadius: '999px', paddingLeft: '14px' }}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="btn-primary"
                  style={{
                    padding: '0 14px',
                    height: '36px',
                    borderRadius: '999px',
                    opacity: !commentText.trim() ? 0.5 : 1
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No comments yet. Be the first to join the conversation!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.comment_id} style={{
                  display: 'flex',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <img 
                    src={comment.author.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                    alt={comment.author.name}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', marginTop: '2px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {comment.author.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                      {comment.comment_text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}
