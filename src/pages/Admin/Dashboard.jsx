import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiShoppingCart,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiSettings,
  FiTrendingUp,
  FiClock,
} from "react-icons/fi";
import { supabase } from "../../config/supabaseClient";
import api from "../../utils/api";
import toast from "react-hot-toast";
import OrdersPanel from "./OrdersPan";
import MenuEditor from "./MenuEdit";
import UsersPanel from "./UsersPanel"; // Create this
import ReservationsPanel from "./ReservationsPanel";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    todayReservations: 0,
    totalUsers: 0,
  });

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("admin-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchStats();
        },
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: FiShoppingCart,
      change: "+12%",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Revenue",
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      change: "+23%",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: FiClock,
      change: "",
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: FiUsers,
      change: "",
      color: "from-purple-500 to-pink-500",
    },
  ];

  const tabs = [
    { id: "overview", name: "Overview", icon: FiPackage },
    { id: "orders", name: "Orders", icon: FiShoppingCart },
    { id: "menu", name: "Menu Editor", icon: FiSettings },
    { id: "users", name: "Users", icon: FiUsers },
{ id: 'reservations', name: 'Reservations', icon: FiCalendar },

  ];

  // Inside AdminDashboard component, add this useEffect
  useEffect(() => {
    const reservationSubscription = supabase
      .channel("reservations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations" },
        (payload) => {
          toast.success(
            `🔔 New reservation from ${payload.new.customer_name} for ${payload.new.guests} guests!`,
            {
              duration: 8000,
              icon: "📅",
            },
          );
        },
      )
      .subscribe();

    return () => reservationSubscription.unsubscribe();
  }, []);

  return (
    <div className="pt-28 pb-20 px-6 min-h-screen">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your restaurant in real-time</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-effect rounded-2xl p-6 card-hover"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-xl bg-linear-to-r ${stat.color}`}
                  >
                    <Icon className="text-2xl text-white" />
                  </div>
                  {stat.change && (
                    <span className="text-green-500 text-sm font-semibold flex items-center gap-1">
                      <FiTrendingUp /> {stat.change}
                    </span>
                  )}
                </div>
                <h3 className="text-gray-400 text-sm">{stat.title}</h3>
                <p className="text-2xl font-bold">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? "text-westend-gold border-b-2 border-westend-gold" : "text-gray-400 hover:text-white"}`}
              >
                <Icon /> {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && (
            <div className="glass-effect rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4">
                Welcome back, Admin! 👋
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Today's Summary</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>🔥 Peak hours: 8 PM – 11 PM</li>
                    <li>🍽️ Most popular item: Grilled Catfish</li>
                    <li>📦 Pending orders: {stats.pendingOrders}</li>
                  </ul>
                </div>
                <div className="bg-westend-gold/10 rounded-xl p-4">
                  <p className="text-sm text-westend-gold">💡 Tip</p>
                  <p className="text-sm">
                    Enable live order notifications — new orders will ring and
                    flash in real time.
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === "orders" && <OrdersPanel />}
          {activeTab === "menu" && <MenuEditor />}
          {activeTab === "users" && <UsersPanel />}
          {activeTab === 'reservations' && <ReservationsPanel />}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
