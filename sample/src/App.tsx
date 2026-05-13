import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Star, MapPin, Menu, X, ChevronRight, Quote } from 'lucide-react';

// --- DATA ---
const topRestaurants = [
  { 
    id: 1, 
    name: "L'Atelier de Truffe", 
    cuisine: "French Fusion", 
    rating: 4.9, 
    reviews: 342, 
    price: "$$$$",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&q=80&w=1000", 
    location: "Downtown" 
  },
  { 
    id: 2, 
    name: "Komorebi", 
    cuisine: "Omakase", 
    rating: 5.0, 
    reviews: 189, 
    price: "$$$$",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=1000", 
    location: "West End" 
  },
  { 
    id: 3, 
    name: "Ember & Ash", 
    cuisine: "Wood-fired Steak", 
    rating: 4.8, 
    reviews: 521, 
    price: "$$$",
    image: "https://images.unsplash.com/photo-1546833999-b1ec90e4fbdb?auto=format&fit=crop&q=80&w=1000", 
    location: "The Pearl" 
  },
  { 
    id: 4, 
    name: "Saffron", 
    cuisine: "Modern Indian", 
    rating: 4.7, 
    reviews: 276, 
    price: "$$",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93cb0?auto=format&fit=crop&q=80&w=1000", 
    location: "Arts District" 
  }
];

const testimonials = [
  { 
    id: 1, 
    name: "Sarah Jenkins", 
    role: "Food Critic", 
    text: "BiteScout completely changed how I discover hidden culinary gems. The curation is unmatched and the reviews are profoundly reliable.", 
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200" 
  },
  { 
    id: 2, 
    name: "Marcus Chen", 
    role: "Local Guide", 
    text: "Finally, a platform that values quality over quantity. Every recommendation I've followed has been a solid 5-star experience.", 
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" 
  },
  { 
    id: 3, 
    name: "Elena Rodriguez", 
    role: "Culinary Enthusiast", 
    text: "The aesthetic alone drew me in, but the incredibly accurate and detailed reviews keep me coming back. BiteScout is my go-to.", 
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200" 
  }
];

// --- COMPONENTS ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-charcoal-900/95 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        <a href="#" className="flex items-center gap-2 text-white group">
          <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-charcoal-950 font-serif font-bold text-lg group-hover:scale-105 transition-transform">
            B
          </div>
          <span className="font-serif font-bold text-2xl tracking-wide">BiteScout</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-white/80 hover:text-gold-500 transition-colors text-sm uppercase tracking-widest">Destinations</a>
          <a href="#" className="text-white/80 hover:text-gold-500 transition-colors text-sm uppercase tracking-widest">Collections</a>
          <a href="#" className="text-white/80 hover:text-gold-500 transition-colors text-sm uppercase tracking-widest">Journal</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button className="text-white hover:text-gold-500 font-medium transition-colors px-4 py-2">
            Sign In
          </button>
          <button className="bg-gold-500 hover:bg-gold-400 text-charcoal-950 px-6 py-2 rounded-sm font-medium transition-colors">
            Join Now
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white p-2" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 bg-charcoal-900 border-t border-white/10 p-6 flex flex-col gap-4 shadow-xl"
          >
            <a href="#" className="text-white/80 hover:text-gold-500 py-2">Destinations</a>
            <a href="#" className="text-white/80 hover:text-gold-500 py-2">Collections</a>
            <a href="#" className="text-white/80 hover:text-gold-500 py-2">Journal</a>
            <div className="h-px bg-white/10 my-2"></div>
            <button className="text-white text-left py-2 hover:text-gold-500 font-medium">Sign In</button>
            <button className="bg-gold-500 text-charcoal-950 px-6 py-3 mt-2 rounded-sm font-medium text-center">Join Now</button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-24 overflow-hidden">
      {/* Background Image with elegant overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1544025162-831e5f8f553a?auto=format&fit=crop&q=80&w=2560)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-950/80 via-charcoal-900/60 to-charcoal-950/95"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 flex flex-col items-center text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6 max-w-4xl"
        >
          <span className="text-gold-500 uppercase tracking-[0.3em] text-sm font-medium">
            Elevate Your Dining Experience
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-white font-bold leading-tight">
            Curating the World's <br className="hidden md:block"/> Most <span className="italic text-gold-400 font-light">Extraordinary</span> Tastes
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light">
            Discover peer-reviewed, critically acclaimed culinary destinations near you. Exquisite gastronomy is just a search away.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mt-12 w-full max-w-3xl bg-white p-2 md:p-3 rounded-lg md:rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2 focus-within:ring-4 focus-within:ring-gold-500/30 transition-all"
        >
          <div className="flex-1 flex items-center px-4 py-2 w-full">
            <Search className="text-charcoal-800/50 mr-3" size={24} />
            <input 
              type="text" 
              placeholder="Find your next favorite bite... e.g. Omakase, Truffle"
              className="w-full bg-transparent text-charcoal-900 placeholder:text-charcoal-800/40 focus:outline-none text-lg py-2"
            />
          </div>
          <div className="hidden md:block w-px h-10 bg-charcoal-800/10"></div>
          <div className="flex-1 flex items-center px-4 py-2 w-full">
            <MapPin className="text-charcoal-800/50 mr-3" size={24} />
            <input 
              type="text" 
              placeholder="Current location"
              className="w-full bg-transparent text-charcoal-900 placeholder:text-charcoal-800/40 focus:outline-none text-lg py-2"
            />
          </div>
          <button className="w-full md:w-auto bg-gold-500 hover:bg-gold-600 text-white md:px-8 py-4 md:py-3 rounded-md md:rounded-full font-medium transition-colors flex items-center justify-center whitespace-nowrap text-lg shadow-lg shadow-gold-500/20">
            Discover <ChevronRight size={20} className="ml-1" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const TopRated = () => {
  return (
    <section className="py-24 bg-charcoal-950 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-2"
          >
            <span className="text-gold-500 uppercase tracking-widest text-xs font-semibold">Curated Selection</span>
            <h2 className="text-3xl md:text-5xl font-serif text-white">Top Rated Near You</h2>
          </motion.div>
          <motion.a 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            href="#" 
            className="text-white/70 hover:text-gold-500 flex items-center uppercase tracking-widest text-sm transition-colors group"
          >
            View all destinations 
            <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {topRestaurants.map((restaurant, index) => (
            <motion.div 
              key={restaurant.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer flex flex-col h-full bg-charcoal-900 border border-white/5 rounded-xl overflow-hidden hover:border-gold-500/30 transition-colors"
            >
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-charcoal-950/20 group-hover:bg-transparent transition-colors z-10"></div>
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute top-4 right-4 z-20 bg-charcoal-950/80 backdrop-blur-sm text-gold-500 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border border-white/10">
                  <Star size={14} className="fill-gold-500" />
                  {restaurant.rating}
                </div>
              </div>
              
              <div className="p-6 flex flex-col grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-xl text-white group-hover:text-gold-400 transition-colors">{restaurant.name}</h3>
                </div>
                <div className="flex items-center text-charcoal-100/60 text-sm mb-4">
                  <span>{restaurant.cuisine}</span>
                  <span className="mx-2">•</span>
                  <span>{restaurant.price}</span>
                </div>
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                  <div className="flex items-center text-white/50">
                    <MapPin size={14} className="mr-1" /> {restaurant.location}
                  </div>
                  <span className="text-white/30 text-xs uppercase tracking-wider">{restaurant.reviews} reviews</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  return (
    <section className="py-24 bg-charcoal-900 border-y border-white/5 relative overflow-hidden">
      {/* Decorative large quotes */}
      <Quote size={400} className="absolute -top-20 -left-20 text-white/[0.02] -rotate-12" />
      <Quote size={400} className="absolute -bottom-20 -right-20 text-white/[0.02] rotate-12" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif text-white mb-4">Tasted & Trusted</h2>
          <p className="text-white/60 max-w-2xl mx-auto">Hear from our community of connoisseurs and passionate food enthusiasts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-charcoal-950 p-8 rounded-2xl relative group"
            >
              <Quote size={32} className="text-gold-500/20 absolute top-8 right-8" />
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="fill-gold-500 text-gold-500" />
                ))}
              </div>
              <p className="text-white/80 font-serif italic text-lg leading-relaxed mb-8">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gold-500/20 group-hover:ring-gold-500/50 transition-all"
                />
                <div>
                  <h4 className="text-white font-medium">{testimonial.name}</h4>
                  <p className="text-gold-500/70 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-charcoal-950 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <a href="#" className="flex items-center gap-2 text-white mb-6">
              <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-charcoal-950 font-serif font-bold text-lg">
                B
              </div>
              <span className="font-serif font-bold text-2xl tracking-wide">BiteScout</span>
            </a>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              The premier destination for discovering the world's most acclaimed dining experiences, verified by a community of passionate connoisseurs.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-medium uppercase tracking-widest text-sm mb-6">Explore</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/50 hover:text-gold-500 transition-colors text-sm">Top Rated Near You</a></li>
              <li><a href="#" className="text-white/50 hover:text-gold-500 transition-colors text-sm">Michelin Starred</a></li>
              <li><a href="#" className="text-white/50 hover:text-gold-500 transition-colors text-sm">Hidden Gems</a></li>
              <li><a href="#" className="text-white/50 hover:text-gold-500 transition-colors text-sm">New Openings</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium uppercase tracking-widest text-sm mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/50 hover:text-gold-500 transition-colors text-sm">About Us</a></li>
              <li><a href="#" className="text-white/50 hover:text-gold-500 transition-colors text-sm">How it Works</a></li>
              <li><a href="#" className="text-white/50 hover:text-gold-500 transition-colors text-sm">For Restaurateurs</a></li>
              <li><a href="#" className="text-white/50 hover:text-gold-500 transition-colors text-sm">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium uppercase tracking-widest text-sm mb-6">Newsletter</h4>
            <p className="text-white/50 text-sm mb-4">Insider culinary knowledge delivered to your inbox.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="bg-charcoal-900 border border-white/10 text-white px-4 py-2 rounded-sm w-full focus:outline-none focus:border-gold-500 text-sm"
              />
              <button className="bg-gold-500 hover:bg-gold-400 text-charcoal-950 px-4 py-2 rounded-sm text-sm font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">© {new Date().getFullYear()} BiteScout. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-white/30 hover:text-gold-500 transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-white/30 hover:text-gold-500 transition-colors text-sm">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-charcoal-950 font-sans selection:bg-gold-500/30 selection:text-gold-400">
      <Navbar />
      <main>
        <Hero />
        <TopRated />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}

