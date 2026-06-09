import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiMusic, FiGift, FiCoffee, FiArrowRight } from 'react-icons/fi'
import Hero from '../components/Hero'
import MenuCard from '../components/MenuCard'
import api from '../utils/api'

const Home = () => {
  const [featuredItems, setFeaturedItems] = useState([])
  const [loading, setLoading] = useState(true)

  const features = [
    { icon: <FiMusic className="text-4xl" />, title: 'Live Band', desc: 'Experience the best live music every weekend' },
    { icon: <FiGift className="text-4xl" />, title: 'Happy Hour', desc: 'Buy 1 Get 1 Free on drinks, 5-8 PM daily' },
    { icon: <FiCoffee className="text-4xl" />, title: 'Grilled Catfish', desc: 'Our signature dish - Lagos best!' },
  ]

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        setLoading(true)
        const response = await api.get('/menu')
        console.log('📦 API Response:', response.data)
        
        if (response.data.success) {
          const allItems = response.data.data
          console.log('📦 All menu items:', allItems)
          
          // ✅ FIX: Map to match MenuCard expected format
          const items = allItems.slice(0, 3).map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            image: item.image_url,  // MenuCard expects 'image', not 'image_url'
            price: `₦${Number(item.price).toLocaleString()}`, // Add currency symbol
            popular: item.popular,
            category: item.category
          }))
          
          console.log('📦 Featured items to show:', items)
          setFeaturedItems(items)
        }
      } catch (error) {
        console.error('Error fetching featured items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedItems()
  }, [])

  // If no items and not loading, show fallback
  if (!loading && featuredItems.length === 0) {
    return (
      <div>
        <Hero />
        <section className="py-20 px-6">
          <div className="container mx-auto text-center">
            <p className="text-gray-400">No menu items yet. Check back soon!</p>
            <Link to="/menu">
              <button className="mt-4 bg-westend-gold text-westend-dark px-6 py-2 rounded-full">
                Browse Menu
              </button>
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      <Hero />
      
      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The <span className="text-gradient">Ultimate</span> Experience
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Where great food meets incredible vibes in the heart of Akowonjo
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="glass-effect rounded-2xl p-8 text-center card-hover"
              >
                <div className="text-westend-gold mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section className="py-20 px-6 bg-linear-to-r from-purple-900/20 to-pink-900/20">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Signature <span className="text-gradient">Dishes</span>
            </h2>
            <p className="text-gray-400">Our customers keep coming back for these</p>
          </motion.div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-westend-gold"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredItems.map((item, index) => (
                <MenuCard key={item.id || index} item={item} index={index} />
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/menu">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="bg-westend-gold text-westend-dark px-8 py-3 rounded-full font-semibold text-lg inline-flex items-center gap-2 hover:bg-westend-amber transition-all"
              >
                View Full Menu <FiArrowRight />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="glass-effect rounded-3xl p-12 text-center neon-border"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Experience <span className="text-gradient">The Vibe?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">Book your table now and skip the queue</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link to="/reservation">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  className="bg-westend-gold text-westend-dark px-8 py-3 rounded-full font-semibold text-lg"
                >
                  Reserve a Table
                </motion.button>
              </Link>
              <a href="tel:+2348037227263">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  className="border-2 border-westend-gold text-westend-gold px-8 py-3 rounded-full font-semibold text-lg hover:bg-westend-gold hover:text-westend-dark transition-all"
                >
                  Call for Enquiries
                </motion.button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home