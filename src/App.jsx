import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Reservation from "./pages/Reservations";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminRoute from "./components/AdminRoute";
import Login from "./pages/Login";
import PaymentCallback from "./pages/PaymentCallback";
import { Toaster } from "react-hot-toast";
import TrackOrderEntry from "./pages/TrackOrderEntry";
import ReservationConfirmation from "./pages/ReservationConfirmation";
import MyReservations from "./pages/MyReservations";

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #FFD700",
          },
          success: {
            iconTheme: {
              primary: "#FFD700",
              secondary: "#0A0A0A",
            },
          },
        }}
      />
      <div className="min-h-screen bg-linear-to-b from-westend-dark via-gray-900 to-westend-dark">
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/my-reservations" element={<MyReservations />} />
            <Route path="/reservation" element={<Reservation />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order/:orderId" element={<OrderTracking />} />
            <Route path="/track-order" element={<TrackOrderEntry />} />
            <Route path="/payment-callback" element={<PaymentCallback />} />
            <Route path="/reservation-confirmation" element={<ReservationConfirmation />} />
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </AnimatePresence>
        <Footer />
      </div>
    </>
  );
}

export default App;
