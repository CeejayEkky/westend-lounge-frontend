import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiCalendar, FiClock, FiUsers, FiMapPin, FiPhone, FiXCircle, FiClock as FiPending, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '../config/supabaseClient';
import toast from 'react-hot-toast';

const ReservationConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  // Load reservation from state or fetch from DB
  useEffect(() => {
    const loadReservation = async () => {
      const reservationData = location.state?.reservation;
      
      if (!reservationData) {
        toast.error('No reservation data found');
        navigate('/reservation');
        return;
      }
      
      setReservation(reservationData);
      
      // ✅ Fetch the ACTUAL status from database (not the passed state)
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', reservationData.id)
          .single();
        
        if (data && !error) {
          setReservation(data);
          setCurrentStatus(data.status);
        } else {
          setCurrentStatus(reservationData.status);
        }
      } catch (err) {
        setCurrentStatus(reservationData.status);
      }
      
      setLoading(false);
    };

    loadReservation();
  }, [location, navigate]);

  // ✅ Subscribe to real-time status updates
  useEffect(() => {
    if (!reservation?.id) return;

    const channel = supabase
      .channel(`reservation-status-${reservation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
          filter: `id=eq.${reservation.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          setCurrentStatus(newStatus);
          setReservation(prev => ({ ...prev, ...payload.new }));
          
          // Show toast for status changes
          if (newStatus === 'cancelled') {
            toast.error('❌ Your reservation has been cancelled');
          } else if (newStatus === 'confirmed') {
            toast.success('✅ Your reservation has been confirmed!');
          } else if (newStatus === 'completed') {
            toast.success('🎉 Thank you for dining with us!');
          }
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  }, [reservation?.id]);

  const getStatusConfig = (status) => {
    switch(status) {
      case 'confirmed':
        return { 
          icon: FiCheckCircle, 
          color: 'text-green-500', 
          bg: 'bg-green-500/20', 
          title: 'Reservation Confirmed! ✅',
          message: 'Your table has been confirmed. We look forward to serving you!'
        };
      case 'completed':
        return { 
          icon: FiCheckCircle, 
          color: 'text-blue-500', 
          bg: 'bg-blue-500/20', 
          title: 'Reservation Completed 🎉',
          message: 'Thank you for dining with us! We hope you enjoyed your experience.'
        };
      case 'cancelled':
        return { 
          icon: FiXCircle, 
          color: 'text-red-500', 
          bg: 'bg-red-500/20', 
          title: 'Reservation Cancelled ❌',
          message: 'This reservation has been cancelled. If this was a mistake, please contact us.'
        };
      default: // pending
        return { 
          icon: FiPending, 
          color: 'text-yellow-500', 
          bg: 'bg-yellow-500/20', 
          title: 'Reservation Pending ⏳',
          message: 'Your reservation request has been received. You will receive a confirmation email once approved.'
        };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);
  const StatusIcon = statusConfig.icon;

  if (loading) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-westend-gold" />
      </div>
    );
  }

  if (!reservation) return null;

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="container mx-auto max-w-2xl">
        {/* Status Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${statusConfig.bg} mb-4`}>
            <StatusIcon className={`text-5xl ${statusConfig.color}`} />
          </div>
          <h1 className="text-3xl font-bold mb-2">{statusConfig.title}</h1>
          <p className="text-gray-400">{statusConfig.message}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-westend-gold">Reservation Details</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
              {currentStatus === 'pending' ? 'Pending Approval' : currentStatus}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <FiCalendar className="text-westend-gold text-xl" />
              <div>
                <p className="text-sm text-gray-400">Date</p>
                <p className="font-semibold">
                  {new Date(reservation.reservation_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <FiClock className="text-westend-gold text-xl" />
              <div>
                <p className="text-sm text-gray-400">Time</p>
                <p className="font-semibold">
                  {new Date(reservation.reservation_date).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <FiUsers className="text-westend-gold text-xl" />
              <div>
                <p className="text-sm text-gray-400">Number of Guests</p>
                <p className="font-semibold">{reservation.guests} {reservation.guests === 1 ? 'Guest' : 'Guests'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <FiMapPin className="text-westend-gold text-xl" />
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="font-semibold">139 Akowonjo Road, Alimosho, Lagos</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <FiPhone className="text-westend-gold text-xl" />
              <div>
                <p className="text-sm text-gray-400">Contact</p>
                <p className="font-semibold">+234 803 722 7263</p>
              </div>
            </div>
          </div>

          {reservation.special_requests && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-400">Special Requests</p>
              <p className="text-white mt-1">{reservation.special_requests}</p>
            </div>
          )}

          {currentStatus === 'pending' && (
            <div className="mt-8 p-4 bg-yellow-500/10 rounded-xl text-center">
              <p className="text-sm text-yellow-500">⏳ Pending Confirmation</p>
              <p className="text-xs text-gray-300 mt-1">
                Your reservation is awaiting admin approval. You will receive a confirmation soon.
              </p>
            </div>
          )}

          {currentStatus === 'confirmed' && (
            <div className="mt-8 p-4 bg-green-500/10 rounded-xl text-center">
              <p className="text-sm text-green-500">📌 Important</p>
              <p className="text-xs text-gray-300 mt-1">
                Please arrive 10 minutes before your reservation time. We'll hold your table for 15 minutes.
              </p>
            </div>
          )}

          {currentStatus === 'cancelled' && (
            <div className="mt-8 p-4 bg-red-500/10 rounded-xl text-center">
              <p className="text-sm text-red-500">❌ Reservation Cancelled</p>
              <p className="text-xs text-gray-300 mt-1">
                If you believe this is a mistake, please contact us at +234 803 722 7263.
              </p>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => navigate('/menu')}
              className="flex-1 bg-westend-gold text-westend-dark py-3 rounded-full font-semibold"
            >
              Browse Menu
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-white/10 text-white py-3 rounded-full font-semibold hover:bg-white/20"
            >
              Print/Save
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReservationConfirmation;