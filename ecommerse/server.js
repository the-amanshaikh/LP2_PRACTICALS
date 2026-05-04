const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');

const app = express();
app.use(express.json());

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Database Schema
const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    image: String,
    description: String
});
const Product = mongoose.model('Product', ProductSchema);

// API Routes
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// Auto-seed function to make the store look professional instantly
const seedDatabase = async () => {
    const count = await Product.countDocuments();
    if (count === 0) {
        const products = [
            { name: "MacBook Pro M3", price: 1999, category: "Laptops", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80", description: "The ultimate pro laptop with mind-blowing performance." },
            { name: "Sony WH-1000XM5", price: 349, category: "Audio", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80", description: "Industry-leading noise canceling headphones." },
            { name: "iPhone 15 Pro Max", price: 1199, category: "Smartphones", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80", description: "Titanium design with the ultimate camera system." },
            { name: "Logitech MX Master 3S", price: 99, category: "Accessories", image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80", description: "Advanced wireless mouse for ultimate productivity." },
            { name: "iPad Air", price: 599, category: "Tablets", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80", description: "Lightweight, powerful, and ready for anything." },
            { name: "Samsung Odyssey G9", price: 1299, category: "Monitors", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80", description: "49-inch curved gaming monitor for total immersion." }
        ];
        await Product.insertMany(products);
        console.log("📦 Seeded database with premium products.");
    }
};

// Start Server
async function startServer() {
    try {
        const mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
        console.log('✅ Local Database Connected');
        
        await seedDatabase(); // Load the products
        
        app.listen(5000, '0.0.0.0', () => {
            console.log('🚀 E-Commerce Server running on port 5000');
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error);
    }
}
startServer();
