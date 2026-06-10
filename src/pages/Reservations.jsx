import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format, addMinutes, isBefore, setHours, setMinutes } from "date-fns";
import {
  FiMapPin,
  FiPhone,
  FiClock,
  FiMail,
  FiCalendar,
  FiUsers,
  FiMessageCircle,
  FiUser,
} from "react-icons/fi";
import api from "../utils/api";
import toast from "react-hot-toast";

const Reservation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "",
    guests: 2,
    specialRequests: "",
  });
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get day of week (0=Sunday, 1=Monday...)
  const getDayType = (date) => {
    const day = new Date(date).getDay();
    if (day >= 1 && day <= 5) return "weekday";
    return "weekend";
  };

  // Get opening and closing hours
  const getOpeningHours = (date) => {
    const dayType = getDayType(date);
    if (dayType === "weekday") {
      return { openHour: 12, openMinute: 0, closeHour: 0, closeMinute: 0 };
    } else {
      return { openHour: 12, openMinute: 0, closeHour: 3, closeMinute: 0 };
    }
  };

  // Convert time from 12hr to 24hr format
  const convertTo24Hour = (time12h) => {
    if (!time12h) return "00:00";
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");
    
    let hourNum = parseInt(hours, 10);
    
    if (modifier === "PM" && hourNum !== 12) {
      hourNum += 12;
    }
    if (modifier === "AM" && hourNum === 12) {
      hourNum = 0;
    }
    
    return `${hourNum.toString().padStart(2, "0")}:${minutes}`;
  };

  // Generate available times
  const generateTimeSlots = (selectedDate) => {
    const now = new Date();
    const selected = new Date(selectedDate);
    const isToday = selected.toDateString() === now.toDateString();

    const { openHour, openMinute, closeHour, closeMinute } =
      getOpeningHours(selectedDate);

    let openTime = setHours(setMinutes(selected, openMinute), openHour);
    let closeTime = setHours(setMinutes(selected, closeMinute), closeHour);

    if (closeHour === 0) closeTime = addMinutes(closeTime, 24 * 60);
    if (closeHour === 3) closeTime = addMinutes(closeTime, 24 * 60);

    const slots = [];
    let currentSlot = openTime;

    while (isBefore(currentSlot, closeTime)) {
      if (isToday && isBefore(currentSlot, now)) {
        currentSlot = addMinutes(currentSlot, 30);
        continue;
      }
      slots.push(format(currentSlot, "hh:mm a"));
      currentSlot = addMinutes(currentSlot, 30);
    }

    return slots;
  };

  // Update available times when date changes
  useEffect(() => {
    if (formData.date) {
      const slots = generateTimeSlots(formData.date);
      setAvailableTimes(slots);
      if (!slots.includes(formData.time)) {
        setFormData((prev) => ({ ...prev, time: slots[0] || "" }));
      }
    }
  }, [formData.date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.time) {
      toast.error("Please select a reservation time");
      return;
    }
    
    setLoading(true);
    
    try {
      const time24h = convertTo24Hour(formData.time);
      const payload = {
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        reservation_date: `${formData.date}T${time24h}:00`,
        guests: parseInt(formData.guests),
        special_requests: formData.specialRequests,
      };

      console.log("📅 Sending reservation:", payload);

      const response = await api.post("/reservations", payload);
      
      if (response.data.success) {
        toast.success("🎉 Reservation submitted!", { duration: 5000 });
        toast.success("📧 Waiting for admin approval", { duration: 9000 });
        
        // Navigate to confirmation page
        navigate("/reservation-confirmation", {
          state: { reservation: response.data.data },
        });
      } else {
        toast.error(response.data.message || "Reservation failed");
        setLoading(false);
      }
    } catch (error) {
      console.error("Reservation error:", error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.code === "ECONNABORTED") {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Make a <span className="text-gradient">Reservation</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Book your table in advance and enjoy an unforgettable dining experience.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-effect rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Reservation Details</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg focus:border-westend-gold focus:outline-none"
                  required
                />
              </div>

              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg focus:border-westend-gold focus:outline-none"
                  required
                />
              </div>

              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg focus:border-westend-gold focus:outline-none"
                  required
                />
              </div>

              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg focus:border-westend-gold focus:outline-none"
                  min={format(new Date(), "yyyy-MM-dd")}
                  required
                />
              </div>

              <div className="relative">
                <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg focus:border-westend-gold focus:outline-none"
                  required
                >
                  <option value="">Select Time</option>
                  {availableTimes.map((time) => (
                    <option key={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg focus:border-westend-gold focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num}>
                      {num} {num === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <FiMessageCircle className="absolute left-3 top-5 text-gray-400" />
                <textarea
                  placeholder="Special Requests (allergies, celebrations, seating preferences...)"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg focus:border-westend-gold focus:outline-none"
                  rows="3"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-westend-gold text-westend-dark py-3 rounded-full font-semibold text-lg disabled:opacity-70 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-westend-dark"></div>
                    <span>Reserving...</span>
                  </>
                ) : (
                  "Reserve Table →"
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Right Side - Info & Contact */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="glass-effect rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-westend-gold/20 flex items-center justify-center">
                    <FiMapPin className="text-westend-gold text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold">Address</p>
                    <p className="text-gray-400">139 Akowonjo Road, Alimosho, Lagos</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-westend-gold/20 flex items-center justify-center">
                    <FiPhone className="text-westend-gold text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-gray-400">+234 803 722 7263</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-westend-gold/20 flex items-center justify-center">
                    <FiMail className="text-westend-gold text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-gray-400">reservations@westendlounge.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Opening Hours</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Monday - Friday</span>
                  <span className="text-westend-gold">12:00 PM - 12:00 AM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Saturday - Sunday</span>
                  <span className="text-westend-gold">12:00 PM - 3:00 AM</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400">⏰ Last seating 30 minutes before closing</p>
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4">Reservation Policies</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Reservations are held for 15 minutes past the scheduled time</li>
                <li>• For groups of 6+, please call us directly</li>
                <li>• Live band starts at 8 PM on Fridays & Saturdays</li>
                <li>• Free parking available for customers</li>
              </ul>
            </div>

            <div className="glass-effect rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4">Find Us</h2>
              <div className="bg-gray-800 rounded-xl h-48 flex items-center justify-center">
                <p className="text-gray-400">📍 139 Akowonjo Road, Alimosho, Lagos</p>
              </div>
              <button
                onClick={() => window.open("https://maps.app.goo.gl/dqiWD3r3C7jDqk3g8", "_blank")}
                className="mt-4 text-westend-gold hover:underline text-sm w-full text-center"
              >
                Get Directions →
              </button>
            </div>
          </motion.div>
        </div>

        {/* Happy Hour Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 p-6 glass-effect rounded-2xl text-center"
        >
          <p className="text-gray-300">
            ⚡ <span className="text-westend-gold font-semibold">Happy Hour:</span>{" "}
            Buy 1 Get 1 Free on all drinks, Monday-Friday, 5 PM – 8 PM
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Reservation;