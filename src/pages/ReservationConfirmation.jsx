import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiCalendar, FiClock, FiUsers, FiMapPin, FiPhone, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '../config/supabaseClient';
import toast from 'react-hot-toast';

const ReservationConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reservationData = location.state?.reservation;
    if (!reservationData) {
      toast.error('No reservation data found');
      navigate('/reservation');
      return;
    }
    setReservation(reservationData);
    setCurrentStatus(reservationData.status);
    setLoading(false);
  }, [location, navigate]);

  // ✅ Subscribe to real-time status updates for this reservation
  useEffect(() => {
    if (!reservation?.id) return;

    console.log('📡 Subscribing to status updates for reservation:', reservation.id);

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
          console.log('🔔 Reservation status updated:', payload.new);
          const newStatus = payload.new.status;
          setCurrentStatus(newStatus);
          
          if (newStatus === 'cancelled') {
            toast.error('❌ Your reservation has been cancelled');
          } else if (newStatus === 'confirmed') {
            toast.success('✅ Your reservation has been confirmed!');
          } else if (newStatus === 'completed') {
            toast.success('🎉 Reservation completed! Thank you for dining with us!');
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [reservation?.id]);

  // ✅ Also fetch latest status on page load
  useEffect(() => {
    if (!reservation?.id) return;

    const fetchLatestStatus = async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('status')
        .eq('id', reservation.id)
        .single();
      
      if (data && !error) {
        setCurrentStatus(data.status);
      }
    };

    fetchLatestStatus();
  }, [reservation?.id]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-westend-gold" />
      </div>
    );
  }

  if (!reservation) return null;

  // Status display configuration
  const statusConfig = {
    pending: { icon: FiClock, color: 'text-yellow-500', bg: 'bg-yellow-500/20', text: 'Pending Confirmation' },
    confirmed: { icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-500/20', text: 'Confirmed' },
    completed: { icon: FiCheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/20', text: 'Completed' },
    cancelled: { icon: FiXCircle, color: 'text-red-500', bg: 'bg-red-500/20', text: 'Cancelled' }
  };

  const StatusIcon = statusConfig[currentStatus]?.icon || FiClock;
  const statusColor = statusConfig[currentStatus]?.color || 'text-yellow-500';
  const statusBg = statusConfig[currentStatus]?.bg || 'bg-yellow-500/20';
  const statusText = statusConfig[currentStatus]?.text || 'Pending';

  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="container mx-auto max-w-2xl">
        {/* Status Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${statusBg} mb-4`}>
            <StatusIcon className={`text-5xl ${statusColor}`} />
          </div>
          
          {!isCancelled ? (
            <>
              <h1 className="text-3xl font-bold mb-2">Reservation {statusText}! 🎉</h1>
              <p className="text-gray-400">Your table has been successfully reserved.</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-2 text-red-500">Reservation Cancelled ❌</h1>
              <p className="text-gray-400">This reservation has been cancelled.</p>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-westend-gold">Reservation Details</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBg} ${statusColor}`}>
              {statusText}
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

          {!isCancelled && (
            <div className="mt-8 p-4 bg-westend-gold/10 rounded-xl text-center">
              <p className="text-sm text-westend-gold">📌 Important</p>
              <p className="text-xs text-gray-300 mt-1">
                Please arrive 10 minutes before your reservation time. We'll hold your table for 15 minutes.
              </p>
            </div>
          )}

          {isCancelled && (
            <div className="mt-8 p-4 bg-red-500/10 rounded-xl text-center">
              <p className="text-sm text-red-400">❌ Reservation Cancelled</p>
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