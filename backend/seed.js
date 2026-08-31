require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')
const Category = require('./models/Category')
const Product = require('./models/Product')
const SocialLink = require('./models/SocialLink')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bangladesh_commerce'

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB.')

    // 1. Seed Users
    console.log('Seeding Users...')
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@bangladeshcommerce.com' })
    if (!existingSuperAdmin) {
      await User.create({
        name: 'Master Super Admin',
        email: 'superadmin@bangladeshcommerce.com',
        phone: '+880 1700 000000',
        password: 'superadmin123',
        role: 'super_admin',
        status: 'active',
      })
      console.log('  ➜ Created Super Admin: superadmin@bangladeshcommerce.com / superadmin123')
    }

    const existingAdmin = await User.findOne({ email: 'admin@bangladeshcommerce.com' })
    if (!existingAdmin) {
      await User.create({
        name: 'Store Manager Admin',
        email: 'admin@bangladeshcommerce.com',
        phone: '+880 1711 111111',
        password: 'admin123',
        role: 'admin',
        status: 'active',
      })
      console.log('  ➜ Created Admin: admin@bangladeshcommerce.com / admin123')
    }

    const existingCustomer = await User.findOne({ email: 'ayesha@email.com' })
    if (!existingCustomer) {
      await User.create({
        name: 'Ayesha Khan',
        email: 'ayesha@email.com',
        phone: '+880 1712 345678',
        password: 'customer123',
        role: 'customer',
        status: 'active',
      })
      console.log('  ➜ Created Customer: ayesha@email.com / customer123')
    }

    // 2. Seed Categories
    console.log('Seeding Categories...')
    const categoriesData = [
      { name: 'Clothing & Fashion', slug: 'clothing-fashion', description: 'Traditional & modern apparel', order: 1 },
      { name: 'Electronics', slug: 'electronics', description: 'Gadgets, phones and accessories', order: 2 },
      { name: 'Home & Living', slug: 'home-living', description: 'Decor, furniture and crafts', order: 3 },
      { name: 'Beauty & Care', slug: 'beauty-care', description: 'Skincare and personal care', order: 4 },
    ]

    for (const cat of categoriesData) {
      await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true })
    }
    console.log('  ➜ Categories seeded.')

    // 3. Seed Products
    console.log('Seeding Products...')
    const productsData = [
      {
        name: 'Premium Jamdani Saree - Royal Blue',
        slug: 'jamdani-saree-royal-blue',
        description: 'Authentic handwoven Dhakai Jamdani Saree crafted with premium cotton thread by master weavers.',
        category: 'Clothing & Fashion',
        price: 8500,
        discount: 10,
        stock: 15,
        sku: 'BD-JAM-001',
        images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80'],
        rating: 4.8,
        reviewCount: 24,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Handcrafted Brass Tea Set',
        slug: 'handcrafted-brass-tea-set',
        description: 'Traditional handcrafted brass tea set including teapot, 4 cups and serving tray.',
        category: 'Home & Living',
        price: 4200,
        discount: 5,
        stock: 25,
        sku: 'BD-BRS-002',
        images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80'],
        rating: 4.6,
        reviewCount: 18,
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Organic Sundarban Honey (500g)',
        slug: 'organic-sundarban-honey-500g',
        description: '100% natural, raw wildflower honey collected directly from Sundarban mangroves.',
        category: 'Beauty & Care',
        price: 950,
        discount: 0,
        stock: 100,
        sku: 'BD-HNY-003',
        images: ['https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=600&q=80'],
        rating: 4.9,
        reviewCount: 42,
        isFeatured: true,
        isActive: true,
      },
    ]

    for (const prod of productsData) {
      await Product.findOneAndUpdate({ sku: prod.sku }, prod, { upsert: true, new: true })
    }
    console.log('  ➜ Sample products seeded.')

    // 4. Seed Social Links
    console.log('Seeding Social Links...')
    const socialData = [
      { platform: 'Facebook', url: 'https://facebook.com/bangladeshcommerce', label: 'Facebook Page', iconName: 'facebook', order: 1 },
      { platform: 'Instagram', url: 'https://instagram.com/bangladeshcommerce', label: 'Instagram Profile', iconName: 'instagram', order: 2 },
      { platform: 'LinkedIn', url: 'https://linkedin.com/company/bangladeshcommerce', label: 'LinkedIn Page', iconName: 'linkedin', order: 3 },
      { platform: 'YouTube', url: 'https://youtube.com/@bangladeshcommerce', label: 'YouTube Channel', iconName: 'youtube', order: 4 },
      { platform: 'WhatsApp', url: 'https://wa.me/8801700000000', label: 'Customer Support WhatsApp', iconName: 'whatsapp', order: 5 },
    ]

    for (const soc of socialData) {
      await SocialLink.findOneAndUpdate({ platform: soc.platform }, soc, { upsert: true, new: true })
    }
    console.log('  ➜ Social links seeded.')

    console.log('\n🎉 Database seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  }
}

seedData()
