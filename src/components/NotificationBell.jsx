import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { supabase } from "../config/supabaseClient";
import toast from "react-hot-toast";

const NotificationBell = ({ userId, userEmail }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load saved notifications
  useEffect(() => {
    if (!userEmail) return;
    const saved = localStorage.getItem(`notifications_${userEmail}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n) => !n.read).length);
      } catch (e) {}
    }
  }, [userEmail]);

  // Save notifications
  const saveNotifications = (newNotifications) => {
    localStorage.setItem(
      `notifications_${userEmail}`,
      JSON.stringify(newNotifications),
    );
    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter((n) => !n.read).length);
  };

  // Add notification
  const addNotification = (title, message, type) => {
    const newNotification = {
      id: Date.now(),
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveNotifications([newNotification, ...notifications]);
    if (type === "success") toast.success(title);
    else if (type === "error") toast.error(title);
    else toast(title);
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userEmail) return;

    const channel = supabase
      .channel("reservations-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reservations",
          filter: `customer_email=eq.${userEmail}`,
        },
        (payload) => {
          console.log("🔔🔔🔔 REAL-TIME EVENT RECEIVED!", payload);
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;

          if (oldStatus !== newStatus) {
            let title = "",
              message = "",
              type = "info";

            if (newStatus === "confirmed") {
              title = "✅ Reservation Confirmed!";
              message = `Your table is confirmed for ${new Date(payload.new.reservation_date).toLocaleDateString()}`;
              type = "success";
            } else if (newStatus === "completed") {
              title = "🎉 Reservation Completed";
              message = "Thank you for dining with us!";
              type = "success";
            } else if (newStatus === "cancelled") {
              title = "❌ Reservation Cancelled";
              message = "Your reservation has been cancelled.";
              type = "error";
            }

            if (title) addNotification(title, message, type);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userEmail]);

  // Add this useEffect right after your real-time subscription
  // This will check for updates every 5 seconds as a backup
  useEffect(() => {
    if (!userEmail) return;

    let lastStatus = localStorage.getItem(`reservation_status_${userEmail}`);

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("reservations")
          .select("status, reservation_date")
          .eq("customer_email", userEmail)
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data[0] && data[0].status !== lastStatus) {
          const newStatus = data[0].status;
          localStorage.setItem(`reservation_status_${userEmail}`, newStatus);

          let title = "",
            message = "",
            type = "info";
          if (newStatus === "confirmed") {
            title = "✅ Reservation Confirmed!";
            message = `Your table is confirmed for ${new Date(data[0].reservation_date).toLocaleDateString()}`;
            type = "success";
          } else if (newStatus === "completed") {
            title = "🎉 Reservation Completed";
            message = "Thank you for dining with us!";
            type = "success";
          } else if (newStatus === "cancelled") {
            title = "❌ Reservation Cancelled";
            message = "Your reservation has been cancelled.";
            type = "error";
          }

          if (title) addNotification(title, message, type);
        }
      } catch (err) {
        console.log("Polling error:", err);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [userEmail]);

  const markAsRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    saveNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    saveNotifications([]);
    setShowDropdown(false);
  };

  const getIcon = (type) => {
    if (type === "success") return <FiCheckCircle className="text-green-500" />;
    if (type === "error") return <FiXCircle className="text-red-500" />;
    if (type === "warning")
      return <FiAlertCircle className="text-yellow-500" />;
    return <FiClock className="text-blue-500" />;
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
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-westend-gold hover:underline"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
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
                    className={`p-3 border-b border-white/10 cursor-pointer hover:bg-white/5 ${!notif.read ? "bg-white/5" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{notif.title}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notif.message}
                        </p>
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
