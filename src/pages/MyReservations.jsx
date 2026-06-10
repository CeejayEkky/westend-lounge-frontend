import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiUsers, FiCheckCircle, FiXCircle, FiClock as FiPending } from 'react-icons/fi';
import { supabase } from '../config/supabaseClient';
import toast from 'react-hot-toast';

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user?.email) return;

    const fetchReservations = async () => {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReservations(data || []);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        toast.error('Failed to load reservations');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user?.email]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500"><FiCheckCircle className="inline mr-1" /> Confirmed</span>;
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-500"><FiCheckCircle className="inline mr-1" /> Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-500"><FiXCircle className="inline mr-1" /> Cancelled</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-500"><FiPending className="inline mr-1" /> Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-westend-gold" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8">My Reservations</h1>
        
        {reservations.length === 0 ? (
          <div className="glass-effect rounded-2xl p-8 text-center">
            <p className="text-gray-400 mb-4">No reservations yet</p>
            <Link to="/reservation">
              <button className="bg-westend-gold text-westend-dark px-6 py-2 rounded-full font-semibold">
                Make a Reservation
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-2xl p-6 hover:bg-white/5 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(res.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(res.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p className="text-gray-300 flex items-center gap-2">
                        <FiCalendar /> {new Date(res.reservation_date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-300 flex items-center gap-2">
                        <FiClock /> {new Date(res.reservation_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-gray-300 flex items-center gap-2">
                        <FiUsers /> {res.guests} {res.guests === 1 ? 'Guest' : 'Guests'}
                      </p>
                    </div>
                    {res.special_requests && (
                      <p className="text-xs text-gray-500 mt-2">📝 {res.special_requests}</p>
                    )}
                  </div>
                  
                  <Link to={`/reservation-confirmation/${res.id}`}>
                    <button className="px-4 py-2 bg-westend-gold/20 text-westend-gold rounded-lg text-sm hover:bg-westend-gold hover:text-westend-dark transition">
                      View Details →
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservations;