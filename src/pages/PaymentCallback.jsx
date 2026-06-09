import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../utils/api.js';
import { clearCart } from '../store/cartSlice.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const verifyPayment = async () => {
      const transaction_id = searchParams.get('transaction_id');
      const tx_ref = searchParams.get('tx_ref');
      const status_param = searchParams.get('status');
      
      console.log('Payment callback params:', { transaction_id, tx_ref, status_param });
      
      // Check if payment was cancelled
      if (status_param === 'cancelled') {
        toast.error('Payment was cancelled');
        setStatus('cancelled');
        setTimeout(() => navigate('/checkout'), 2000);
        return;
      }
      
      if (!transaction_id || !tx_ref) {
        toast.error('Invalid payment response');
        setStatus('error');
        setTimeout(() => navigate('/checkout'), 2000);
        return;
      }
      
      try {
        // Verify payment with backend
        const response = await api.post('/payments/verify', {
          transaction_id,
          tx_ref,
        });
        
        if (response.data.success) {
          // ✅ Clear the cart on successful payment
          dispatch(clearCart());
          
          toast.success('Payment successful! 🎉', {
            duration: 5000,
            icon: '✅'
          });
          
          setStatus('success');
          
          // Redirect to order tracking after 2 seconds
          setTimeout(() => {
            navigate(`/track-order/${response.data.data.order_id}`);
          }, 2000);
        } else {
          toast.error('Payment verification failed');
          setStatus('error');
          setTimeout(() => navigate('/checkout'), 2000);
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Payment verification failed. Please contact support.');
        setStatus('error');
        setTimeout(() => navigate('/checkout'), 3000);
      }
    };
    
    verifyPayment();
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center glass-effect rounded-2xl p-8 max-w-md"
      >
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-westend-gold mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
            <p className="text-gray-400">Please wait while we confirm your transaction.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-gray-400">Your order has been confirmed.</p>
            <p className="text-gray-400 mt-2">Redirecting to tracking page...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
            <p className="text-gray-400">Please contact support with your order details.</p>
            <p className="text-gray-400 mt-2">Redirecting to checkout...</p>
          </>
        )}
        
        {status === 'cancelled' && (
          <>
            <div className="text-yellow-500 text-6xl mb-4">⚠</div>
            <h2 className="text-2xl font-bold mb-2">Payment Cancelled</h2>
            <p className="text-gray-400">You can try again whenever you're ready.</p>
            <p className="text-gray-400 mt-2">Redirecting to checkout...</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

// ✅ Make sure to export default
export default PaymentCallback;