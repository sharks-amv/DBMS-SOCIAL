import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService, getSupabaseConfig, saveSupabaseConfig, resetLocalStorage } from '../services/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supabaseConfig, setSupabaseConfigState] = useState(getSupabaseConfig());
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const refreshData = async () => {
    try {
      const allUsers = await dbService.getAllUsers();
      setUsers(allUsers);
      const active = dbService.getCurrentUser();
      setCurrentUser(active);
      if (active) {
        const notifs = await dbService.getNotifications(active.user_id);
        const unread = notifs.filter(n => n.is_read === 'N').length;
        setUnreadNotificationsCount(unread);
      }
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const login = async (email, password) => {
    const user = await dbService.login(email, password);
    setCurrentUser(user);
    await refreshData();
    return user;
  };

  const register = async (userData) => {
    const user = await dbService.register(userData);
    setCurrentUser(user);
    await refreshData();
    return user;
  };

  const logout = () => {
    dbService.logout();
    setCurrentUser(null);
  };

  const switchUser = (userId) => {
    const user = dbService.switchUser(userId);
    if (user) {
      setCurrentUser(user);
      dbService.getNotifications(user.user_id).then(notifs => {
        setUnreadNotificationsCount(notifs.filter(n => n.is_read === 'N').length);
      });
    }
    return user;
  };

  const updateProfile = async (profileData) => {
    if (!currentUser) return;
    const updated = await dbService.updateProfile(currentUser.user_id, profileData);
    setCurrentUser(updated);
    await refreshData();
    return updated;
  };

  const updateConfig = (config) => {
    saveSupabaseConfig(config);
    setSupabaseConfigState(config);
    refreshData();
  };

  const resetAllData = () => {
    resetLocalStorage();
    refreshData();
  };

  const refreshNotifications = async () => {
    if (currentUser) {
      const notifs = await dbService.getNotifications(currentUser.user_id);
      setUnreadNotificationsCount(notifs.filter(n => n.is_read === 'N').length);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loading,
        supabaseConfig,
        unreadNotificationsCount,
        login,
        register,
        logout,
        switchUser,
        updateProfile,
        updateConfig,
        resetAllData,
        refreshData,
        refreshNotifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
