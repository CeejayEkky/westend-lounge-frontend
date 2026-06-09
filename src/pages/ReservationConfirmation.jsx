import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  FiCheckCircle,
  FiCalendar,
  FiClock,
  FiUsers,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import toast from "react-hot-toast";

const ReservationConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    const reservationData = location.state?.reservation;
    if (!reservationData) {
      toast.error("No reservation data found");
      navigate("/reservation");
      return;
    }
    setReservation(reservationData);
  }, [location, navigate]);

  if (!reservation) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-westend-gold" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
            <FiCheckCircle className="text-5xl text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Reservation Confirmed! 🎉</h1>
          <p className="text-gray-400">
            Your table has been successfully reserved.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-westend-gold">
            Reservation Details
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <FiCalendar className="text-westend-gold text-xl" />
              <div>
                <p className="text-sm text-gray-400">Date</p>
                <p className="font-semibold">
                  {new Date(reservation.reservation_date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <FiClock className="text-westend-gold text-xl" />
              <div>
                <p className="text-sm text-gray-400">Time</p>
                <p className="font-semibold">
                  {new Date(reservation.reservation_date).toLocaleTimeString(
                    "en-US",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <FiUsers className="text-westend-gold text-xl" />
              <div>
                <p className="text-sm text-gray-400">Number of Guests</p>
                <p className="font-semibold">
                  {reservation.guests || reservation.guests === 0
                    ? reservation.guests
                    : 2}{" "}
                  {reservation.guests === 1 ? "Guest" : "Guests"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <FiMapPin className="text-westend-gold text-xl" />
              <div>
                <p className="text-sm text-gray-400">Location</p>
                <p className="font-semibold">
                  139 Akowonjo Road, Alimosho, Lagos
                </p>
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

          <div className="mt-8 p-4 bg-westend-gold/10 rounded-xl text-center">
            <p className="text-sm text-westend-gold">📌 Important</p>
            <p className="text-xs text-gray-300 mt-1">
              Please arrive 10 minutes before your reservation time. We'll hold
              your table for 15 minutes.
            </p>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => navigate("/menu")}
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

        {/* Add to Calendar Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              const event = {
                title: "Westend Lounge Reservation",
                description: `Table for ${reservation.guests} ${reservation.guests === 1 ? "guest" : "guests"}${reservation.special_requests ? `\nSpecial requests: ${reservation.special_requests}` : ""}`,
                location: "139 Akowonjo Road, Alimosho, Lagos",
                start: reservation.reservation_date,
                end: new Date(
                  new Date(reservation.reservation_date).getTime() +
                    2 * 60 * 60 * 1000,
                ).toISOString(),
              };
              const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&dates=${event.start.replace(/[-:]/g, "")}/${event.end.replace(/[-:]/g, "")}`;
              window.open(calendarUrl, "_blank");
            }}
            className="text-westend-gold hover:underline text-sm"
          >
            📅 Add to Google Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationConfirmation;
