import React from "react";
import { motion } from "framer-motion";
import { FiShoppingCart, FiStar } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/cartSlice.js";
import toast from "react-hot-toast";

const MenuCard = ({ item, index }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(addToCart(item));
    toast.success(`${item.name} added to cart!`, {
      style: { background: "#FFD700", color: "#0A0A0A" },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="glass-effect rounded-2xl overflow-hidden card-hover"
    >
      <div className="relative h-48 overflow-hidden">
        <motion.img
          whileHover={{ scale: 1.1 }}
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // ✅ Fallback if image fails to load
            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />
        {item.popular && (
          <div className="absolute top-2 right-2 bg-westend-gold text-westend-dark px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <FiStar className="fill-current" /> Popular
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{item.name}</h3>
        <p className="text-gray-400 text-sm mb-4">{item.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-westend-gold">
            {typeof item.price === "string"
              ? item.price
              : `₦${Number(item.price).toLocaleString()}`}
          </span>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className="bg-westend-gold/20 text-westend-gold p-2 rounded-full hover:bg-westend-gold hover:text-westend-dark transition-all"
          >
            <FiShoppingCart className="text-xl" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MenuCard;
