import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useSocial, RenderSocialIcon } from '@/contexts/SocialContext'

const companyStatistics = [
  { id: '1', number: '10,000+', label: 'Happy Customers', color: 'text-emerald-600' },
  { id: '2', number: '500+', label: 'Verified Products', color: 'text-gray-900' },
  { id: '3', number: '99%', label: 'On-Time Deliveries', color: 'text-emerald-600' },
  { id: '4', number: '24/7', label: 'Customer Support', color: 'text-gray-900' },
]

const coreValues = [
  {
    id: '1',
    title: 'Customer Satisfaction',
    description: 'We prioritize our customers by providing authentic products and responsive post-purchase support.',
  },
  {
    id: '2',
    title: 'Quality Guarantee',
    description: 'Every product in our store undergoes strict quality checks before shipping.',
  },
  {
    id: '3',
    title: 'Trust & Integrity',
    description: 'We operate with full transparency in pricing, delivery terms, and customer privacy.',
  },
  {
    id: '4',
    title: 'Fast Logistics',
    description: 'Partnering with Bangladesh\'s top courier networks for quick 2-3 business day doorstep delivery.',
  },
]

const teamMembers = [
  {
    id: '1',
    name: 'Rahim Ahmed',
    role: 'Founder & CEO',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'Leads strategic growth and operations with 10+ years of e-commerce experience.',
  },
  {
    id: '2',
    name: 'Karim Hossain',
    role: 'Head of Logistics',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Oversees inventory management and nationwide courier fulfillment operations.',
  },
  {
    id: '3',
    name: 'Fatima Begum',
    role: 'Customer Experience Lead',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    bio: 'Ensures exceptional service standard and customer care across all channels.',
  },
]

export const AboutPage: React.FC = () => {
  const { activeSocialLinks } = useSocial()

  return (
    <div className="space-y-16 py-10">
      {/* Page Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          About Our Platform
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
          Empowering Online Shopping in Bangladesh
        </h1>
        <p className="text-gray-600 text-base max-w-2xl mx-auto">
          We are committed to delivering high-quality products directly to your doorstep with guaranteed authenticity and reliable customer support.
        </p>
      </section>

      {/* Stats Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {companyStatistics.map((stat) => (
            <div
              key={stat.id}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center space-y-1"
            >
              <div className={`text-3xl sm:text-4xl font-black ${stat.color}`}>{stat.number}</div>
              <div className="text-gray-500 text-xs sm:text-sm font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-gray-200 shadow-sm grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Our Journey</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Built on Quality, Convenience, and Trust
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Bangladesh Commerce was established with a clear goal: to make premium lifestyle products accessible to everyone across Bangladesh. From our initial launch, we prioritized customer satisfaction, transparent pricing, and fast courier dispatch above all else.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Today, we serve thousands of satisfied shoppers nationwide, supporting local artisans as well as curated global brands.
            </p>
            <div className="pt-2">
              <Link to="/products">
                <Button variant="primary" size="md">
                  Explore Products
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <img
              src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80"
              alt="Team at work"
              className="w-full h-80 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Our Core Principles</h2>
          <p className="text-gray-500 text-sm">What guides us every single day</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((val) => (
            <div key={val.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <h3 className="font-bold text-gray-900 text-base">{val.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{val.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Meet Our Leadership</h2>
          <p className="text-gray-500 text-sm">Dedicated leaders passionate about customer success</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center space-y-4">
              <img
                src={member.image}
                alt={member.name}
                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-emerald-50 shadow-md"
              />
              <div>
                <h3 className="font-bold text-gray-900 text-base">{member.name}</h3>
                <p className="text-xs font-semibold text-emerald-600">{member.role}</p>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SOCIAL MEDIA SECTION — "CONNECT WITH US"                                   */}
      {/* ========================================================================= */}
      {activeSocialLinks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-gray-200 shadow-sm space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Stay Social</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Connect With Us</h2>
              <p className="text-gray-500 text-sm">
                Follow our official social media handles for exclusive announcements, product showcases, and instant support.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSocialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-gray-50 hover:bg-emerald-50/60 rounded-xl p-5 border border-gray-200 hover:border-emerald-500 transition-all flex items-start gap-4 shadow-sm hover:shadow"
                >
                  <div className="p-3 bg-white group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white rounded-xl shadow-sm transition-colors flex-shrink-0">
                    <RenderSocialIcon iconName={social.iconName} className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">
                        {social.platform}
                      </h3>
                      <span className="text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        Visit ↗
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                      {social.description || social.label}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default AboutPage