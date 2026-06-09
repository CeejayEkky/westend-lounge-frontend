import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiFacebook, FiInstagram, FiTwitter, FiMapPin, FiPhone, FiMail } from 'react-icons/fi'

const Footer = () => {
  return (
    <footer className="bg-black/50 backdrop-blur-sm border-t border-white/10 py-12 px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gradient mb-4">WESTEND</h3>
            <p className="text-gray-400 text-sm">Akowonjo's premier nightlife destination since 2015.</p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-westend-gold transition">Home</Link></li>
              <li><Link to="/menu" className="hover:text-westend-gold transition">Menu</Link></li>
              <li><Link to="/reservation" className="hover:text-westend-gold transition">Reservations</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-center gap-2"><FiMapPin /> 139 Akowonjo Road, Lagos</li>
              <li className="flex items-center gap-2"><FiPhone /> +234 803 722 7263</li>
              <li className="flex items-center gap-2"><FiMail /> info@westendlounge.com</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/westendakowonjo_/" className="text-2xl hover:text-westend-gold transition"><FiInstagram /></a>
              <a href="https://twitter.com/WestEndAkowonjo" className="text-2xl hover:text-westend-gold transition"><FiTwitter /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; 2026 Westend Lounge Bar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer