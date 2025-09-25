import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const Notification = ({ notification, onClose }) => {
  const variants = {
    success: 'bg-success-light border-success text-success',
    error: 'bg-danger-light border-danger text-danger',
    warning: 'bg-warning-light border-warning text-warning',
    info: 'bg-brand-light border-brand text-brand'
  };

  const icons = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`notification ${variants[notification.type]} border rounded-lg p-4 mb-3`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{icons[notification.type]}</span>
        <div className="flex-1">
          {notification.title && (
            <div className="font-semibold mb-1">{notification.title}</div>
          )}
          <div>{notification.message}</div>
        </div>
        <button
          onClick={() => onClose(notification.id)}
          className="text-current opacity-75 hover:opacity-100 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = { 
      id, 
      type: 'info', 
      ...notification 
    };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message, title) => addNotification({ type: 'success', message, title });
  const showError = (message, title) => addNotification({ type: 'error', message, title });
  const showWarning = (message, title) => addNotification({ type: 'warning', message, title });
  const showInfo = (message, title) => addNotification({ type: 'info', message, title });

  return (
    <NotificationContext.Provider value={{ 
      addNotification, 
      removeNotification, 
      showSuccess, 
      showError, 
      showWarning, 
      showInfo 
    }}>
      {children}
      
      {/* Notification Container */}
      <div className="notification-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};