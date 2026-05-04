const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs'); // Added for the physical file hack

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- DATABASE SCHEMAS ---
const ProductSchema = new mongoose.Schema({
    name: String, price: Number, category: String, image: String, description: String
});
const Product = mongoose.model('Product', ProductSchema);

const OrderSchema = new mongoose.Schema({
    cartItems: Array, cartTotal: Number, orderDate: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

// --- THE HACK: Write DB to a physical file ---
const savePhysicalBackup = async () => {
    const products = await Product.find();
    const orders = await Order.find();
    const fullDatabase = { products, orders };
    fs.writeFileSync(path.join(__dirname, 'vm_ecommerce_db.json'), JSON.stringify(fullDatabase, null, 4));
};

// --- API ROUTES ---
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// New route: Save an order to the database
app.post('/api/checkout', async (req, res) => {
    const newOrder = new Order({ cartItems: req.body.cart, cartTotal: req.body.total });
    await newOrder.save();
    await savePhysicalBackup(); // Update the physical file immediately!
    res.json({ message: "Order placed securely in database." });
});

// --- BOOTSTRAP ---
const seedDatabase = async () => {
    const count = await Product.countDocuments();
    if (count === 0) {
        const products = [
            { name: "MacBook Pro M3", price: 1999, category: "Laptops", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80", description: "The ultimate pro laptop with mind-blowing performance." },
            { name: "Sony WH-1000XM5", price: 349, category: "Audio", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80", description: "Industry-leading noise canceling headphones." },
            { name: "iPhone 15 Pro Max", price: 1199, category: "Smartphones", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80", description: "Titanium design with the ultimate camera system." },
            { name: "Logitech MX Master 3S", price: 99, category: "Accessories", image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80", description: "Advanced wireless mouse for ultimate productivity." }
        ];
        await Product.insertMany(products);
        await savePhysicalBackup(); // Save initial products to the physical file
        console.log("📦 Seeded database with premium products.");
    }
};

async function startServer() {
    try {
        const mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
        console.log('✅ Local Database Connected');
        
        await seedDatabase();
        
        app.listen(5000, '0.0.0.0', () => console.log('🚀 Server running on port 5000'));
    } catch (error) {
        console.error('❌ Server startup failed:', error);
    }
}
startServer();
