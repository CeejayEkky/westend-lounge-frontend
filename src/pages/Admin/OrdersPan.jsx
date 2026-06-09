import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiPackage,
  FiBell,
  FiTrash2,
} from "react-icons/fi";
import { supabase } from "../../config/supabaseClient";
import api from "../../utils/api";
import toast from "react-hot-toast";

const OrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-500",
    paid: "bg-blue-500/20 text-blue-500",
    preparing: "bg-purple-500/20 text-purple-500",
    ready: "bg-green-500/20 text-green-500",
    completed: "bg-gray-500/20 text-gray-500",
    cancelled: "bg-red-500/20 text-red-500 line-through",
  };

  const statusIcons = {
    pending: FiClock,
    paid: FiPackage,
    preparing: FiPackage,
    ready: FiCheckCircle,
    completed: FiCheckCircle,
    cancelled: FiXCircle,
  };

  // Fetch initial orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders/admin/all");
      setOrders(response.data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 REAL-TIME SUBSCRIPTION FOR ORDERS
  useEffect(() => {
    fetchOrders();

    // Subscribe to INSERT events (new orders)
    const insertSubscription = supabase
      .channel("orders-insert")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("🆕 New order received!", payload.new);
          setOrders((prev) => [payload.new, ...prev]);
          setNewOrderAlert(payload.new);
          
          toast.success(`🛎️ New order #${payload.new.order_id}!`, {
            duration: 10000,
            icon: "🛎️",
          });

          const audio = new Audio(
            "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
          );
          audio.play().catch((e) => console.log("Audio play failed:", e));
          setTimeout(() => setNewOrderAlert(null), 5000);
        },
      )
      .subscribe();

    // Subscribe to UPDATE events (status changes)
    const updateSubscription = supabase
      .channel("orders-update")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("📝 Order updated:", payload.new);
          setOrders((prev) =>
            prev.map((order) =>
              order.id === payload.new.id ? payload.new : order,
            ),
          );

          if (payload.old.status !== payload.new.status) {
            if (payload.new.status === "cancelled") {
              toast.error(`Order #${payload.new.order_id} was cancelled`);
            } else {
              toast.success(`Order #${payload.new.order_id} status: ${payload.new.status}`);
            }
          }
        },
      )
      .subscribe();

    return () => {
      insertSubscription.unsubscribe();
      updateSubscription.unsubscribe();
    };
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    // Confirm cancellation
    if (newStatus === "cancelled") {
      const confirm = window.confirm("Are you sure you want to cancel this order? This cannot be undone.");
      if (!confirm) return;
    }
    
    try {
      const response = await api.put(`/orders/${orderId}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order,
          ),
        );

        if (newStatus === "cancelled") {
          toast.error(`Order cancelled successfully`);
        } else {
          toast.success(`Order status updated to ${newStatus}`);
        }
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    }
  };

  // ✅ Delete order permanently (optional - for completed/cancelled orders)
  const deleteOrder = async (orderId, orderNumber) => {
    const confirm = window.confirm(`Delete order #${orderNumber}? This action cannot be undone.`);
    if (!confirm) return;
    
    try {
      // You need to add a DELETE endpoint in your backend for this
      const response = await api.delete(`/orders/${orderId}`);
      if (response.data.success) {
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
        toast.success(`Order #${orderNumber} deleted`);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-westend-gold"></div>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-2xl p-6">
      {/* New Order Alert Banner */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="mb-4 p-4 bg-westend-gold/20 border border-westend-gold rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="animate-pulse">
                <FiBell className="text-2xl text-westend-gold" />
              </div>
              <div>
                <p className="font-bold">New Order!</p>
                <p className="text-sm">
                  Order #{newOrderAlert.order_id} from{" "}
                  {newOrderAlert.customer_name}
                </p>
              </div>
            </div>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="text-gray-400 hover:text-white"
            >
              <FiXCircle />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Orders</h2>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs animate-pulse">
              {pendingCount} new
            </span>
          )}
        </div>
        <button
          onClick={fetchOrders}
          className="text-westend-gold hover:underline text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "pending", "paid", "preparing", "ready", "completed", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full capitalize transition-all ${
              filter === status
                ? "bg-westend-gold text-westend-dark"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {status}
            {status !== "all" && (
              <span className="ml-2 text-xs opacity-70">
                ({orders.filter((o) => o.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4 max-h-150 overflow-y-auto">
        <AnimatePresence>
          {filteredOrders.map((order, index) => {
            const StatusIcon = statusIcons[order.status] || FiPackage;
            const isCancelled = order.status === "cancelled";
            const isCompleted = order.status === "completed";
            const isNew =
              order.status === "pending" &&
              new Date(order.created_at) > new Date(Date.now() - 5 * 60 * 1000);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-white/5 rounded-xl p-4 hover:bg-white/10 transition relative ${
                  isCancelled ? "opacity-60" : ""
                } ${isNew ? "border-l-4 border-westend-gold" : ""}`}
              >
                {isNew && !isCancelled && (
                  <div className="absolute -top-2 -right-2 bg-westend-gold text-westend-dark text-xs px-2 py-1 rounded-full animate-pulse">
                    NEW!
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`font-bold ${isCancelled ? "text-red-500 line-through" : "text-westend-gold"}`}>
                        {order.order_id}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}
                      >
                        <StatusIcon className="inline mr-1 text-xs" />
                        {order.status}
                      </span>
                    </div>
                    <p className={`font-semibold ${isCancelled ? "line-through" : ""}`}>
                      {order.customer_name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {order.customer_phone}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-westend-gold">
                      ₦{order.total_amount?.toLocaleString()}
                    </p>

                    {/* ✅ Show buttons only if not completed or cancelled */}
                    {!isCompleted && !isCancelled && (
                      <div className="flex gap-2 mt-2 flex-wrap justify-end">
                        {order.status === "pending" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "paid")}
                            className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition"
                          >
                            Confirm Payment
                          </button>
                        )}
                        {order.status === "paid" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "preparing")}
                            className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full hover:bg-purple-600 transition"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === "preparing" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "ready")}
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.status === "ready" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "completed")}
                            className="text-xs bg-gray-500 text-white px-3 py-1 rounded-full hover:bg-gray-600 transition"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}

                    {/* ✅ Show delete button for cancelled/completed orders */}
                    {(isCancelled || isCompleted) && (
                      <button
                        onClick={() => deleteOrder(order.id, order.order_id)}
                        className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full hover:bg-red-500 hover:text-white transition mt-2"
                      >
                        <FiTrash2 className="inline mr-1" size={12} />
                        Delete Order
                      </button>
                    )}
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-400">
                    Items:{" "}
                    {order.order_items
                      ?.map((i) => `${i.name} x${i.quantity}`)
                      .join(", ") || "Loading..."}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPanel;