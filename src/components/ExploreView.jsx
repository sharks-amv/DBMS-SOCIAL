import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { PostCard } from './PostCard';
import { 
  Hash, 
  Search, 
  TrendingUp, 
  Sparkles,
  Users
} from 'lucide-react';

export function ExploreView({ onSelectHashtag, onSelectUser, selectedTag }) {
  const [hashtags, setHashtags] = useState([]);
  const [activeTag, setActiveTag] = useState(selectedTag || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    dbService.fetchHashtags().then(tags => {
      if (tags && tags.length) setHashtags(tags);
    });
    loadPosts();
  }, [activeTag]);

  useEffect(() => {
    if (selectedTag) {
      setActiveTag(selectedTag);
    }
  }, [selectedTag]);

  const loadPosts = async () => {
    const filter = activeTag ? `hashtag:${activeTag}` : 'all';
    const all = await dbService.getPosts(null, filter);
    setPosts(all);
  };

  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    return p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.author?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div>
      {/* Search Header */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <TrendingUp size={20} color="var(--accent-cyan)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Explore & Topics
          </h1>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search keywords, topics, creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '44px', height: '42px', borderRadius: '12px' }}
          />
        </div>

        {/* Hashtags Strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => setActiveTag('')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: !activeTag ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.05)',
              border: !activeTag ? 'none' : '1px solid var(--border-subtle)',
              color: '#fff'
            }}
          >
            All Topics
          </button>
          {hashtags.map(t => {
            const isSelected = activeTag === t.hashtag_name;
            return (
              <button
                key={t.hashtag_id}
                onClick={() => setActiveTag(t.hashtag_name)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: isSelected ? '1px solid #818cf8' : '1px solid var(--border-subtle)',
                  color: isSelected ? '#a5b4fc' : 'var(--text-secondary)'
                }}
              >
                <Hash size={13} />
                <span>{t.hashtag_name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts matched */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filteredPosts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No posts found for "{activeTag || searchQuery}". Try another tag!
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard
              key={post.post_id}
              post={post}
              onSelectUser={onSelectUser}
              onSelectHashtag={(tag) => setActiveTag(tag)}
              onUpdate={loadPosts}
            />
          ))
        )}
      </div>
    </div>
  );
}
