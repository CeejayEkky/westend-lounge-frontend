import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiTrash2,
  FiPlus,
  FiMinus,
  FiCreditCard,
  FiPhone,
} from "react-icons/fi";
import { MdAccountBalance } from "react-icons/md";
import { clearCart, updateQuantity, removeFromCart } from "../store/cartSlice";
import { parsePrice } from "../store/cartSlice";
import toast from "react-hot-toast";
import api from "../utils/api";

const Checkout = () => {
  const { items, totalAmount } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Track if payment was successful to prevent onclose from showing cancel message
  const paymentCompletedRef = useRef(false);

  const loggedInUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const [customerInfo, setCustomerInfo] = useState({
    name: loggedInUser?.name || "",
    email: loggedInUser?.email || "",
    phone: loggedInUser?.phone || "",
    address: "Pickup at Lounge",
  });

  const updateQuantityHandler = (item, newQuantity) => {
    if (newQuantity < 1) return;
    toast.success("Price updated! 🎉");
    dispatch(updateQuantity({ id: item.id, quantity: newQuantity }));
  };

  const removeItemHandler = (item) => {
    dispatch(removeFromCart(item));
    toast.success(`${item.name} removed from cart`);
  };

  const handlePayment = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Please fill in your contact information");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);
    paymentCompletedRef.current = false;

    try {
      const numericTotal = Number(totalAmount);

      const orderPayload = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        delivery_address: customerInfo.address || "Pickup at Lounge",
        order_items: items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(parsePrice(item.price)),
        })),
        total_amount: numericTotal,
        payment_method: paymentMethod,
        pickup_type:
          customerInfo.address === "Pickup at Lounge" ? "pickup" : "delivery",
      };

      const orderResponse = await api.post("/orders", orderPayload);

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Failed to create order");
      }

      const { order_id, tx_ref } = orderResponse.data.data;
      const currentOrderId = order_id;
      const currentTxRef = tx_ref;

      if (typeof window.FlutterwaveCheckout === "undefined") {
        throw new Error("Flutterwave checkout script not loaded");
      }

      // ✅ Store order info globally for fallback
      window.pendingOrder = {
        order_id: currentOrderId,
        tx_ref: currentTxRef,
        amount: numericTotal,
      };

      window.FlutterwaveCheckout({
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: currentTxRef,
        amount: numericTotal,
        currency: "NGN",
        payment_options:
          paymentMethod === "card"
            ? "card"
            : paymentMethod === "ussd"
              ? "ussd"
              : "banktransfer",
        // ✅ ADD THIS REDIRECT URL
        redirect_url: `${window.location.origin}/payment-callback`,
        customer: {
          email: customerInfo.email,
          phone_number: customerInfo.phone,
          name: customerInfo.name,
        },
        customizations: {
          title: "Westend Lounge",
          description: `Order #${currentOrderId} - ${items.length} item(s)`,
          logo: "https://your-domain.com/logo.png",
        },
        callback: async (response) => {
          // This will still work, but redirect_url is the primary method
          console.log("Callback response:", response);
        },
        onclose: () => {
          console.log("Modal closed");
          // Don't show "Payment cancelled" immediately - let them return from redirect
          setTimeout(() => {
            if (!paymentCompletedRef.current) {
              toast.info("Payment window closed", { icon: "ℹ️" });
              setIsProcessing(false);
            }
          }, 1000);
        },
      });

      // ✅ Add a manual check after 30 seconds (in case modal gets stuck)
      setTimeout(() => {
        if (paymentCompletedRef.current === false && window.pendingOrder) {
          console.log("Manual payment check...");
          checkPaymentStatus(currentOrderId, currentTxRef);
        }
      }, 30000);
    } catch (error) {
      console.error("Checkout error:", error);
      if (error.response) {
        toast.error(
          error.response.data.message ||
            `Server error: ${error.response.status}`,
        );
      } else {
        toast.error(error.message || "Something went wrong. Please try again.");
      }
      setIsProcessing(false);
    }
  };

  // ✅ Helper function to handle successful payment
  const handleSuccessfulPayment = async (orderId, txRef, transactionId) => {
    toast.loading("Verifying payment...", { id: "payment-verify" });

    try {
      const verifyResponse = await api.post("/payments/verify", {
        transaction_id: transactionId,
        tx_ref: txRef,
        order_id: orderId,
      });

      toast.dismiss("payment-verify");

      if (verifyResponse.data.success) {
        dispatch(clearCart());
        toast.success("Payment successful! 🎉", { duration: 5000 });
        window.pendingOrder = null;
        navigate(`/track-order/${orderId}`);
      } else {
        toast.error("Payment verification failed. Contact support.");
        setIsProcessing(false);
      }
    } catch (verifyError) {
      toast.dismiss("payment-verify");
      console.error("Verification error:", verifyError);
      toast.error("Payment verification failed. Please contact us.");
      setIsProcessing(false);
    }
  };

  // ✅ Helper function to check payment status
  const checkPaymentStatus = async (orderId, txRef) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      if (
        response.data.success &&
        response.data.data.payment_status === "success"
      ) {
        paymentCompletedRef.current = true;
        dispatch(clearCart());
        toast.success("Payment confirmed! 🎉", { duration: 5000 });
        window.pendingOrder = null;
        navigate(`/track-order/${orderId}`);
      } else {
        toast.error(
          "Payment not completed. Please try again or contact support.",
        );
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Status check error:", error);
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Your cart is empty 🛒</h2>
          <p className="text-gray-400 mb-6">
            Add some delicious items from our menu!
          </p>
          <button
            onClick={() => navigate("/menu")}
            className="bg-westend-gold text-westend-dark px-6 py-2 rounded-full font-semibold"
          >
            Browse Menu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
          Checkout <span className="text-gradient">📍</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-4">
                {items.map((item) => {
                  const numericPrice = parsePrice(item.price);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between border-b border-white/10 pb-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-400">
                          {item.description?.substring(0, 50)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ₦{numericPrice.toLocaleString()} each
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantityHandler(item, item.quantity - 1)
                            }
                            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            <FiMinus className="text-sm" />
                          </button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantityHandler(item, item.quantity + 1)
                            }
                            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            <FiPlus className="text-sm" />
                          </button>
                        </div>
                        <span className="font-bold text-westend-gold w-24 text-right">
                          ₦{(numericPrice * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeItemHandler(item)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-westend-gold">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={customerInfo.name}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 rounded-lg border border-white/20 focus:border-westend-gold focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={customerInfo.email}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 rounded-lg border border-white/20 focus:border-westend-gold focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 rounded-lg border border-white/20 focus:border-westend-gold focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Delivery address (or leave as Pickup)"
                  value={customerInfo.address}
                  onChange={(e) =>
                    setCustomerInfo({
                      ...customerInfo,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white/10 rounded-lg border border-white/20 focus:border-westend-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            <div className="glass-effect rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Payment Method</h2>

              <div className="space-y-3 mb-6">
                {[
                  {
                    id: "card",
                    label: "Card Payment",
                    icon: <FiCreditCard className="text-xl" />,
                  },
                  {
                    id: "ussd",
                    label: "USSD Transfer",
                    icon: <FiPhone className="text-xl" />,
                  },
                  {
                    id: "bank",
                    label: "Bank Transfer",
                    icon: <MdAccountBalance className="text-xl" />,
                  },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all border ${
                      paymentMethod === method.id
                        ? "bg-westend-gold/20 border-westend-gold"
                        : "bg-white/5 border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {method.icon}
                    <span>{method.label}</span>
                  </button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-westend-gold text-westend-dark py-3 rounded-full font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isProcessing
                  ? "Processing..."
                  : `Pay ₦${totalAmount.toLocaleString()} →`}
              </motion.button>

              <p className="text-xs text-gray-400 text-center mt-4">
                🔒 Secure payment powered by Flutterwave
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 text-center">
              <h3 className="font-bold mb-2">Pickup / Delivery</h3>
              <p className="text-sm text-gray-300">
                Free pickup at Westend Lounge
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Or call for delivery: ₦1,500 within Akowonjo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
