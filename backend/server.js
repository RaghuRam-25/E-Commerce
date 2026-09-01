require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

// Route imports
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const productRoutes = require('./routes/productRoutes')
const orderRoutes = require('./routes/orderRoutes')
const categoryRoutes = require('./routes/categoryRoutes')
const socialRoutes = require('./routes/socialRoutes')
const subscriberRoutes = require('./routes/subscriberRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const addressRoutes = require('./routes/addressRoutes')
const adminRoutes = require('./routes/adminRoutes')
const bkashRoutes = require('./routes/bkashRoutes')
const settingsRoutes = require('./routes/settingsRoutes')

// Connect to MongoDB
connectDB()

const app = express()

// ── Middleware ──────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Bangladesh Commerce API is running!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
})

// ── API Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/social', socialRoutes)
app.use('/api/subscribers', subscriberRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/bkash', bkashRoutes)
app.use('/api/settings', settingsRoutes)

// ── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
})

// ── Global Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  })
})

// ── Start Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n🚀 Bangladesh Commerce API Server`)
  console.log(`   ➜  http://localhost:${PORT}`)
  console.log(`   ➜  Health: http://localhost:${PORT}/api/health`)
  console.log(`   ➜  Environment: ${process.env.NODE_ENV}`)
  console.log(`   ➜  DB: ${process.env.MONGODB_URI}\n`)
})
