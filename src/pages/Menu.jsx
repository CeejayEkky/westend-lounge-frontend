import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX } from "react-icons/fi";
import MenuCard from "../components/MenuCard";
import {
  FaUtensils,
  FaFire,
  FaBeer,
  FaBirthdayCake,
  FaCocktail,
} from "react-icons/fa";
import { GiChickenLeg } from "react-icons/gi";
import { MdFastfood } from "react-icons/md";
import api from "../utils/api";

import Meal1 from "../assets/pic1.jpg"

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    { id: "all", name: "All", icon: <FaUtensils /> },
    { id: "grills", name: "Grills", icon: <FaFire /> },
    { id: "appetizers", name: "Appetizers", icon: <GiChickenLeg /> },
    { id: "main", name: "Main Course", icon: <MdFastfood /> },
    { id: "drinks", name: "Drinks", icon: <FaBeer /> },
    { id: "cocktails", name: "Cocktails", icon: <FaCocktail /> },
    { id: "desserts", name: "Desserts", icon: <FaBirthdayCake /> },
  ];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await api.get("/menu");

      // ✅ FIXED: Use the image_url directly from database, not the local map
      const itemsWithImages = response.data.data.map((item) => ({
        ...item,
        image: item.image_url || Meal1, // Use Cloudinary URL if exists, fallback to Meal1
        price: Number(item.price),
      }));

      console.log("📦 Menu items loaded:", itemsWithImages); // Debug: check image URLs

      setMenuItems(itemsWithImages);
      setError(null);
    } catch (err) {
      console.error("Error fetching menu:", err);
      setError("Failed to load menu. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-westend-gold mx-auto mb-4"></div>
          <p className="text-gray-400">Loading our delicious menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchMenuItems}
            className="bg-westend-gold text-westend-dark px-6 py-2 rounded-full font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Our <span className="text-gradient">Menu</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Crafted with love, served with passion. Explore our signature dishes
            and drinks.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-md mx-auto mb-8"
        >
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 rounded-full border border-white/20 focus:border-westend-gold focus:outline-none text-white placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                <FiX className="text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex overflow-x-auto gap-3 mb-12 pb-4 scrollbar-hide justify-center flex-wrap"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-2 rounded-2xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeCategory === category.id
                  ? "bg-westend-gold text-westend-dark shadow-lg shadow-westend-gold/50"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </motion.div>

        {/* Menu Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + searchTerm}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <MenuCard key={item.id} item={item} index={index} />
              ))
            ) : (
              <div className="col-span-3 text-center py-20">
                <p className="text-gray-400 text-xl">
                  No items found. Try a different search!
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Happy Hour Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-16 p-6 glass-effect rounded-2xl text-center"
        >
          <p className="text-gray-300">
            ⚡{" "}
            <span className="text-westend-gold font-semibold">Happy Hour:</span>{" "}
            Buy 1 Get 1 Free on all drinks, Monday-Friday, 5 PM – 8 PM
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Menu;
