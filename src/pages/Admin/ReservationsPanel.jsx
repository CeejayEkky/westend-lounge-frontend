import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiUsers, FiUser, FiMail, FiPhone, FiCheckCircle, FiXCircle, FiClock as FiPending } from 'react-icons/fi';
import api from '../../utils/api';
import { supabase } from '../../config/supabaseClient';
import toast from 'react-hot-toast';

const ReservationsPanel = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    confirmed: 'bg-green-500/20 text-green-500',
    completed: 'bg-blue-500/20 text-blue-500',
    cancelled: 'bg-red-500/20 text-red-500'
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
        setReservations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Set up subscription correctly - add callbacks BEFORE subscribe()
  useEffect(() => {
    fetchReservations();

    // Create channel and add callbacks BEFORE subscribing
    const channel = supabase
      .channel('reservations-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'reservations' }, 
        (payload) => {
          console.log('📅 New reservation:', payload.new);
          setReservations(prev => [payload.new, ...prev]);
          toast.success(`🔔 New reservation from ${payload.new.customer_name}!`, {
            duration: 5000,
            icon: '📅'
          });
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
      .subscribe(); // ✅ Now subscribe AFTER adding all callbacks

    // Cleanup function
    return () => {
      channel.unsubscribe();
    };
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reservations</h2>
        <button 
          onClick={fetchReservations}
          className="text-westend-gold hover:underline text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No reservations found
          </div>
        ) : (
          filteredReservations.map((res, index) => {
            const StatusIcon = statusIcons[res.status] || FiPending;
            const reservationDate = new Date(res.reservation_date);
            
            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left - Customer Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-westend-gold">
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
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReservationsPanel;