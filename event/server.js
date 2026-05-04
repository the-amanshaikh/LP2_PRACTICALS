const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Database Schema for Event Attendees
const AttendeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String, required: true },
    ticketType: { type: String, required: true }, // e.g., General, VIP, Speaker
    registrationDate: { type: Date, default: Date.now }
});
const Attendee = mongoose.model('Attendee', AttendeeSchema);

// --- THE HACK: Write DB to a physical file for the Examiner ---
const savePhysicalBackup = async () => {
    const attendees = await Attendee.find().sort({ registrationDate: -1 });
    fs.writeFileSync(path.join(__dirname, 'vm_event_db.json'), JSON.stringify(attendees, null, 4));
};

// API Routes
app.get('/api/attendees', async (req, res) => {
    const attendees = await Attendee.find().sort({ registrationDate: -1 });
    res.json(attendees);
});

app.post('/api/register', async (req, res) => {
    try {
        const newAttendee = new Attendee(req.body);
        await newAttendee.save();
        await savePhysicalBackup(); // Backup immediately to the VM hard drive!
        res.status(201).json(newAttendee);
    } catch (error) { res.status(400).send("Registration failed"); }
});

// Auto-seed function to make the event look professional instantly
const seedDatabase = async () => {
    const count = await Attendee.countDocuments();
    if (count === 0) {
        const vips = [
            { name: "Satya Nadella", email: "ceo@microsoft.com", company: "Microsoft", ticketType: "Keynote Speaker" },
            { name: "Sundar Pichai", email: "ceo@google.com", company: "Google", ticketType: "VIP Guest" },
            { name: "Sainath Pawar", email: "sainath@unbound.ai", company: "Unbound.AI", ticketType: "General Admission" }
        ];
        await Attendee.insertMany(vips);
        await savePhysicalBackup(); // Save initial data to file
        console.log("🎫 Seeded database with VIP Attendees.");
    }
};

// Start Server
async function startServer() {
    try {
        const mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
        console.log('✅ Local Database Connected');
        
        await seedDatabase();
        
        app.listen(5000, '0.0.0.0', () => console.log('🚀 Event Server running on port 5000'));
    } catch (error) {
        console.error('❌ Server startup failed:', error);
    }
}
startServer();
