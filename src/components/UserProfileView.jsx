import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { PostCard } from './PostCard';
import { 
  MapPin, 
  Globe, 
  Calendar, 
  Cake, 
  UserCheck, 
  UserPlus, 
  Edit3, 
  Grid, 
  Image as ImageIcon, 
  Info,
  X,
  Check
} from 'lucide-react';

export function UserProfileView({ userId, onSelectHashtag, onSelectUser, onRefreshFeed }) {
  const { currentUser, updateProfile } = useAuth();
  const [targetUser, setTargetUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editDob, setEditDob] = useState('');

  const isOwnProfile = currentUser && targetUser && Number(currentUser.user_id) === Number(targetUser.user_id);

  const loadProfile = async () => {
    const id = userId || currentUser?.user_id;
    if (!id) return;

    const u = await dbService.getUserById(id);
    if (u) {
      setTargetUser(u);
      setEditName(u.name || '');
      setEditBio(u.bio || '');
      setEditLocation(u.profile?.location || '');
      setEditWebsite(u.profile?.website || '');
      setEditAvatar(u.profile?.profile_picture || '');
      setEditDob(u.date_of_birth || '');

      setFollowerCount(dbService.countFollowers(u.user_id));
      setFollowingCount(dbService.countFollowing(u.user_id));

      if (currentUser) {
        setIsFollowing(dbService.isFollowing(currentUser.user_id, u.user_id));
      }

      const posts = await dbService.getPosts(currentUser?.user_id || u.user_id, `user:${u.user_id}`);
      setUserPosts(posts);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId, currentUser]);

  const handleToggleFollow = async () => {
    if (!currentUser || !targetUser || isOwnProfile) return;

    if (isFollowing) {
      await dbService.unfollowUser(currentUser.user_id, targetUser.user_id);
      setIsFollowing(false);
      setFollowerCount(prev => Math.max(0, prev - 1));
    } else {
      await dbService.followUser(currentUser.user_id, targetUser.user_id);
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
    }

    if (onRefreshFeed) onRefreshFeed();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile({
      name: editName,
      bio: editBio,
      location: editLocation,
      website: editWebsite,
      profile_picture: editAvatar,
      date_of_birth: editDob
    });
    setShowEditModal(false);
    await loadProfile();
  };

  if (!targetUser) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        User profile not found.
      </div>
    );
  }

  const mediaPosts = userPosts.filter(p => p.media_url);

  return (
    <div>
      {/* Profile Header Card */}
      <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        {/* Banner with Cyber Neon Glow */}
        <div style={{
          height: '160px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #831843 100%)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            opacity: 0.5
          }} />
        </div>

        {/* Profile Info Row */}
        <div style={{ padding: '0 24px 24px 24px', position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginTop: '-50px',
            marginBottom: '16px'
          }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <img 
                src={targetUser.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                alt={targetUser.name}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--bg-card)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {isOwnProfile ? (
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="btn-secondary"
                  style={{ borderRadius: '999px', padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  <Edit3 size={16} /> Edit Profile
                </button>
              ) : currentUser ? (
                <button
                  onClick={handleToggleFollow}
                  className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                  style={{ borderRadius: '999px', padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={16} color="#818cf8" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Follow
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>

          {/* User Names & Bio */}
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {targetUser.name}
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {targetUser.email} • User #{targetUser.user_id}
            </div>
            {targetUser.bio && (
              <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.6, maxWidth: '680px' }}>
                {targetUser.bio}
              </p>
            )}
          </div>

          {/* Meta Details Row (Schema: location, website, date_joined, date_of_birth) */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '18px',
            fontSize: '0.825rem',
            color: 'var(--text-secondary)',
            marginBottom: '20px'
          }}>
            {targetUser.profile?.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="var(--accent-primary)" />
                <span>{targetUser.profile.location}</span>
              </div>
            )}
            {targetUser.profile?.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={15} color="var(--accent-cyan)" />
                <a 
                  href={targetUser.profile.website} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: '#818cf8', textDecoration: 'underline' }}
                >
                  {targetUser.profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {targetUser.date_of_birth && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cake size={15} color="var(--accent-rose)" />
                <span>Born {new Date(targetUser.date_of_birth).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            {targetUser.date_joined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="var(--accent-amber)" />
                <span>Joined {new Date(targetUser.date_joined).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Followers / Following Counts */}
          <div style={{
            display: 'flex',
            gap: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {userPosts.length}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Posts</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {followerCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Followers</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {followingCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        gap: '8px'
      }}>
        <button
          onClick={() => setActiveTab('posts')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: activeTab === 'posts' ? '#818cf8' : 'var(--text-secondary)',
            borderBottom: activeTab === 'posts' ? '2px solid #818cf8' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Grid size={16} /> Posts ({userPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('media')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: activeTab === 'media' ? '#818cf8' : 'var(--text-secondary)',
            borderBottom: activeTab === 'media' ? '2px solid #818cf8' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <ImageIcon size={16} /> Media ({mediaPosts.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'posts' && (
        <div>
          {userPosts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No posts shared yet.
            </div>
          ) : (
            userPosts.map(post => (
              <PostCard
                key={post.post_id}
                post={post}
                onSelectUser={onSelectUser}
                onSelectHashtag={onSelectHashtag}
                onUpdate={loadProfile}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'media' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '14px'
        }}>
          {mediaPosts.length === 0 ? (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No media images uploaded yet.
            </div>
          ) : (
            mediaPosts.map(post => (
              <div 
                key={post.post_id}
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  aspectRatio: '1',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(0,0,0,0.3)',
                  cursor: 'pointer'
                }}
              >
                <img 
                  src={post.media_url} 
                  alt="Post media" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Edit Profile
              </h2>
              <button onClick={() => setShowEditModal(false)} className="btn-ghost" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Display Name
                </label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Bio (max 500 chars)
                </label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="form-input"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Profile Picture URL
                </label>
                <input 
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Location
                  </label>
                  <input 
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="form-input"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Date of Birth
                  </label>
                  <input 
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Website
                </label>
                <input 
                  type="url"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
