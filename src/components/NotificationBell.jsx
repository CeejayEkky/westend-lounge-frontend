import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheckCircle, FiClock, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '../config/supabaseClient';

const NotificationBell = ({ userId, userEmail }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  console.log('🔔 NotificationBell rendering for:', userEmail);

  // Load notifications from localStorage
  useEffect(() => {
    if (!userEmail) return;
    
    const saved = localStorage.getItem(`notifications_${userEmail}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    }
  }, [userEmail]);

  // Save notifications to localStorage
  const saveNotifications = (newNotifications) => {
    localStorage.setItem(`notifications_${userEmail}`, JSON.stringify(newNotifications));
    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  };

  // Add new notification
  const addNotification = (title, message, type, reservationId) => {
    const newNotification = {
      id: Date.now(),
      title,
      message,
      type,
      reservationId,
      read: false,
      createdAt: new Date().toISOString()
    };
    console.log('🔔 Adding notification:', newNotification);
    saveNotifications([newNotification, ...notifications]);
  };

  // Subscribe to reservation updates
  useEffect(() => {
    if (!userEmail) {
      console.log('⚠️ No userEmail, skipping subscription');
      return;
    }

    console.log('📡 Setting up real-time subscription for:', userEmail);

    const channel = supabase
      .channel(`reservations-${userEmail}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
          filter: `customer_email=eq.${userEmail}`
        },
        (payload) => {
          console.log('🔔 Reservation update received:', payload);
          const reservation = payload.new;
          const oldStatus = payload.old.status;
          const newStatus = reservation.status;

          if (oldStatus !== newStatus) {
            let title = '';
            let message = '';
            let type = 'info';

            switch (newStatus) {
              case 'confirmed':
                title = '✅ Reservation Confirmed!';
                message = `Your table for ${new Date(reservation.reservation_date).toLocaleDateString()} at ${new Date(reservation.reservation_date).toLocaleTimeString()} has been confirmed.`;
                type = 'success';
                break;
              case 'completed':
                title = '🎉 Reservation Completed';
                message = 'Thank you for dining with us! We hope you enjoyed your experience.';
                type = 'success';
                break;
              case 'cancelled':
                title = '❌ Reservation Cancelled';
                message = 'Your reservation has been cancelled. If this was a mistake, please contact us.';
                type = 'error';
                break;
              default:
                title = '📅 Reservation Updated';
                message = `Your reservation status is now: ${newStatus}`;
                type = 'info';
            }

            addNotification(title, message, type, reservation.id);
            
            // Also try to show toast if available
            if (typeof toast !== 'undefined') {
              toast.success(title);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from reservations');
      channel.unsubscribe();
    };
  }, [userEmail]);

  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
    setShowDropdown(false);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <FiCheckCircle className="text-green-500" />;
      case 'error': return <FiXCircle className="text-red-500" />;
      case 'warning': return <FiAlertCircle className="text-yellow-500" />;
      default: return <FiClock className="text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-white/10 transition"
      >
        <FiBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-xl shadow-xl border border-white/10 z-50"
          >
            <div className="p-3 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold">Notifications</h3>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <button onClick={markAllAsRead} className="text-xs text-westend-gold hover:underline">
                      Mark all read
                    </button>
                    <button onClick={clearAll} className="text-xs text-red-400 hover:underline">
                      Clear all
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-3 border-b border-white/10 cursor-pointer hover:bg-white/5 transition ${!notif.read ? 'bg-white/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{notif.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;