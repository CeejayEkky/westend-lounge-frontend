import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiClock, FiUsers, FiUser, FiMail, FiPhone, FiCheckCircle, FiXCircle, FiClock as FiPending, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import { supabase } from '../../config/supabaseClient';
import toast from 'react-hot-toast';

const ReservationsPanel = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCancelled, setShowCancelled] = useState(false); // New toggle

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    confirmed: 'bg-green-500/20 text-green-500',
    completed: 'bg-blue-500/20 text-blue-500',
    cancelled: 'bg-red-500/20 text-red-500 line-through opacity-60'
  };

  const statusIcons = {
    pending: FiPending,
    confirmed: FiCheckCircle,
    completed: FiCheckCircle,
    cancelled: FiXCircle
  };

  const fetchReservations = async () => {
    try {
      const response = await api.get('/reservations/admin/all');
      if (response.data.success) {
        let data = response.data.data;
        // Filter out cancelled if showCancelled is false
        if (!showCancelled) {
          data = data.filter(r => r.status !== 'cancelled');
        }
        setReservations(data);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  // Toggle cancelled visibility
  const toggleShowCancelled = () => {
    setShowCancelled(!showCancelled);
    fetchReservations(); // Refresh with new filter
  };

  useEffect(() => {
    fetchReservations();

    const channel = supabase
      .channel('reservations-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'reservations' }, 
        (payload) => {
          console.log('📅 New reservation:', payload.new);
          setReservations(prev => [payload.new, ...prev]);
          toast.success(`🔔 New reservation from ${payload.new.customer_name}!`);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reservations' },
        (payload) => {
          setReservations(prev => 
            prev.map(res => res.id === payload.new.id ? payload.new : res)
          );
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await api.put(`/reservations/${id}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Reservation ${newStatus}`);
        fetchReservations();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Permanently delete cancelled reservation
  const deleteReservation = async (id) => {
    if (window.confirm('Permanently delete this reservation? This cannot be undone.')) {
      try {
        await api.delete(`/reservations/${id}`);
        toast.success('Reservation deleted');
        fetchReservations();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const filteredReservations = filter === 'all' 
    ? reservations 
    : reservations.filter(r => r.status === filter);

  const getStatusCount = (status) => {
    if (status === 'all') return reservations.length;
    return reservations.filter(r => r.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-westend-gold" />
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Reservations</h2>
        <div className="flex gap-2">
          <button 
            onClick={toggleShowCancelled}
            className={`text-sm px-3 py-1 rounded-full transition ${showCancelled ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400'}`}
          >
            {showCancelled ? 'Hide Cancelled' : 'Show Cancelled'}
          </button>
          <button 
            onClick={fetchReservations}
            className="text-westend-gold hover:underline text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 flex-wrap">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full capitalize transition-all ${
              filter === status
                ? 'bg-westend-gold text-westend-dark'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {status} ({getStatusCount(status)})
          </button>
        ))}
      </div>

      {/* Reservations List */}
      <div className="space-y-4 max-h-125 overflow-y-auto">
        <AnimatePresence>
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No reservations found
            </div>
          ) : (
            filteredReservations.map((res, index) => {
              const StatusIcon = statusIcons[res.status] || FiPending;
              const reservationDate = new Date(res.reservation_date);
              const isCancelled = res.status === 'cancelled';
              
              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white/5 rounded-xl p-4 hover:bg-white/10 transition ${isCancelled ? 'opacity-60' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left - Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`font-bold ${isCancelled ? 'line-through text-gray-500' : 'text-westend-gold'}`}>
                          {res.customer_name}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[res.status]}`}>
                          <StatusIcon className="inline mr-1 text-xs" />
                          {res.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <p className="text-gray-400 flex items-center gap-1">
                          <FiMail size={12} /> {res.customer_email}
                        </p>
                        <p className="text-gray-400 flex items-center gap-1">
                          <FiPhone size={12} /> {res.customer_phone}
                        </p>
                        <p className="text-gray-400 flex items-center gap-1">
                          <FiCalendar size={12} /> {reservationDate.toLocaleDateString()}
                        </p>
                        <p className="text-gray-400 flex items-center gap-1">
                          <FiClock size={12} /> {reservationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-gray-400 flex items-center gap-1">
                          <FiUsers size={12} /> {res.guests} {res.guests === 1 ? 'guest' : 'guests'}
                        </p>
                      </div>
                      {res.special_requests && (
                        <p className="text-xs text-gray-500 mt-2">
                          📝 {res.special_requests}
                        </p>
                      )}
                    </div>

                    {/* Right - Actions */}
                    <div className="flex gap-2">
                      {!isCancelled && (
                        <>
                          {res.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(res.id, 'confirmed')}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => updateStatus(res.id, 'cancelled')}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {res.status === 'confirmed' && (
                            <button
                              onClick={() => updateStatus(res.id, 'completed')}
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                            >
                              Complete
                            </button>
                          )}
                        </>
                      )}
                      {isCancelled && (
                        <button
                          onClick={() => deleteReservation(res.id)}
                          className="px-3 py-1 bg-red-500/50 text-white rounded-lg text-sm hover:bg-red-600 transition"
                        >
                          <FiTrash2 className="inline mr-1" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReservationsPanel;