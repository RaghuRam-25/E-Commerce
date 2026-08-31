import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [submitted, setSubmitted] = useState<boolean>(false)

  const validate = () => {
    const errors: { [key: string]: string } = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Valid email is required'
    }
    if (!formData.subject.trim()) errors.subject = 'Subject is required'
    if (!formData.message.trim()) errors.message = 'Message is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    }, 4000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          Contact Us
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          We'd Love to Hear From You
        </h1>
        <p className="text-gray-600 text-sm">
          Have questions about your order, products, or corporate partnerships? Send us a message and our support team will respond within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Send a Direct Message</h2>

          {submitted && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Thank you! Your message has been sent successfully. We will get back to you shortly.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                placeholder="e.g. Ayesha Rahman"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
              />

              <Input
                label="Email Address *"
                type="email"
                placeholder="e.g. ayesha@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={formErrors.email}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="e.g. +880 1700 000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Input
                label="Subject *"
                placeholder="e.g. Order Inquiry, Product Question..."
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                error={formErrors.subject}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Message *</label>
              <textarea
                rows={5}
                placeholder="Type your message details here..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {formErrors.message && <p className="text-xs text-rose-600">{formErrors.message}</p>}
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full font-bold py-3">
              Send Message →
            </Button>
          </form>
        </div>

        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Contact Details</h3>

            <div className="space-y-4 text-xs text-gray-600">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  📍
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Headquarters</h4>
                  <p>House 42, Road 11, Banani, Dhaka-1213, Bangladesh</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  📞
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Phone Support</h4>
                  <p>+880 1234 567890 (9 AM - 9 PM)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  ✉️
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Email Address</h4>
                  <p>support@bangladeshcommerce.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-700 text-white rounded-2xl p-6 shadow-md space-y-2">
            <h4 className="font-bold text-sm">Need Instant Assistance?</h4>
            <p className="text-xs text-emerald-100 leading-relaxed">
              For urgent order updates or delivery status, please call our hotline or message us directly on WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage