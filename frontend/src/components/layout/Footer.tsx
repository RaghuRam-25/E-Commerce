import React from 'react'
import { Link } from 'react-router-dom'
import { useSocial, RenderSocialIcon } from '@/contexts/SocialContext'

export const Footer: React.FC = () => {
  const { activeSocialLinks } = useSocial()

  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand & About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow">
                BD
              </div>
              <span className="text-lg font-extrabold text-white">Bangladesh Commerce</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Your premier destination for authentic, high-quality products across Bangladesh with fast delivery and Cash on Delivery support.
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>📍 House 42, Road 11, Banani, Dhaka</p>
              <p>📞 Hotline: +880 1234 567890</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-emerald-400 transition-colors">All Products</Link></li>
              <li><Link to="/reviews" className="hover:text-emerald-400 transition-colors">Customer Reviews</Link></li>
              <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Our Business</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Customer Support</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/cart" className="hover:text-emerald-400 transition-colors">Shopping Cart</Link></li>
              <li><Link to="/checkout" className="hover:text-emerald-400 transition-colors">Checkout</Link></li>
              <li><span className="text-gray-500">Fast 2-3 Business Days Delivery</span></li>
              <li><span className="text-gray-500">100% Cash on Delivery</span></li>
            </ul>
          </div>

          {/* Follow Us / Dynamic Social Media Column */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Follow Us</h4>
            <p className="text-xs text-gray-400 mb-3">
              Stay connected with us across our active social media channels:
            </p>
            
            {activeSocialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeSocialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.label || `Follow us on ${link.platform}`}
                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-emerald-600 text-gray-300 hover:text-white flex items-center justify-center transition-all shadow-sm group"
                  >
                    <RenderSocialIcon iconName={link.iconName} className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No active social links currently.</p>
            )}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Bangladesh Commerce. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-emerald-400 transition-colors">Portal Login</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
