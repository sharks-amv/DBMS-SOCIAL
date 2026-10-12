import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { 
  Send, 
  MessageSquare, 
  Search, 
  Circle, 
  Sparkles,
  CheckCheck
} from 'lucide-react';

export function MessagesView({ initialRecipientId, onSelectUser }) {
  const { currentUser, users } = useAuth();
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const loadChatList = async () => {
    if (!currentUser) return;
    const list = await dbService.getRecentChatUsers(currentUser.user_id);
    setChatUsers(list);

    if (initialRecipientId) {
      const match = list.find(u => Number(u.user_id) === Number(initialRecipientId));
      if (match) {
        setSelectedUser(match);
      }
    } else if (!selectedUser && list.length > 0) {
      setSelectedUser(list[0]);
    }
  };

  const loadMessages = async () => {
    if (!currentUser || !selectedUser) return;
    const msgs = await dbService.getMessages(currentUser.user_id, selectedUser.user_id);
    setMessages(msgs);
  };

  useEffect(() => {
    loadChatList();
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
    }
  }, [selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !selectedUser) return;

    await dbService.sendMessage(currentUser.user_id, selectedUser.user_id, inputText.trim());
    setInputText('');
    await loadMessages();
    await loadChatList();
  };

  const filteredUsers = chatUsers.filter(u => 
    u.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="glass-panel" style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      minHeight: '620px',
      overflow: 'hidden',
      border: '1px solid var(--border-subtle)'
    }}>
      {/* Left Chat Contacts Pane */}
      <div style={{
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(10, 13, 20, 0.4)'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Messages
          </h2>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Filter chats..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Contacts list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No contacts found
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUser && Number(selectedUser.user_id) === Number(u.user_id);
              return (
                <div
                  key={u.user_id}
                  onClick={() => setSelectedUser(u)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                    marginBottom: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={u.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                      alt={u.name}
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <Circle size={10} color="#10b981" fill="#10b981" style={{ position: 'absolute', bottom: 0, right: 0 }} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#a5b4fc' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </span>
                      {u.unreadCount > 0 && (
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '999px',
                          background: 'var(--accent-rose)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}>
                          {u.unreadCount}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {u.lastMessage ? u.lastMessage.message_text : 'No messages yet'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Conversation View */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {selectedUser ? (
          <>
            {/* Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 20, 34, 0.4)'
            }}>
              <div 
                onClick={() => onSelectUser && onSelectUser(selectedUser.user_id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <img 
                  src={selectedUser.profile?.profile_picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                  alt={selectedUser.name}
                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedUser.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Circle size={6} fill="#10b981" color="#10b981" /> Active now
                  </div>
                </div>
              </div>

              {/* Trigger Notification Hint */}
              <div className="glow-pill green" style={{ fontSize: '0.68rem' }}>
                <Sparkles size={11} />
                <span>Triggers fn_notify_message</span>
              </div>
            </div>

            {/* Messages list */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                  <div>Start a conversation with {selectedUser.name}!</div>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = Number(m.sender_id) === Number(currentUser.user_id);
                  const time = new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={m.message_id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '10px 14px',
                          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMine 
                            ? 'var(--accent-gradient)' 
                            : 'rgba(255, 255, 255, 0.07)',
                          border: isMine ? 'none' : '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.875rem',
                          lineHeight: 1.45,
                          boxShadow: isMine ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none'
                        }}
                      >
                        {m.message_text}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        marginTop: '4px',
                        padding: '0 4px'
                      }}>
                        <span>{time}</span>
                        {isMine && <CheckCheck size={12} color="#818cf8" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '10px',
              background: 'rgba(10, 13, 20, 0.6)'
            }}>
              <input
                type="text"
                placeholder={`Type a message to ${selectedUser.name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="form-input"
                style={{ height: '42px', borderRadius: '999px', paddingLeft: '18px' }}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="btn-primary"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  padding: 0,
                  opacity: !inputText.trim() ? 0.5 : 1
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
            Select a contact to begin messaging
          </div>
        )}
      </div>
    </div>
  );
}
