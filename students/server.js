const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs'); // Added File System module

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const StudentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNo: { type: String, required: true },
    course: { type: String, required: true },
    enrollmentDate: { type: Date, default: Date.now }
});
const Student = mongoose.model('Student', StudentSchema);

// THE HACK: This writes the DB to a physical file on the VM
const savePhysicalBackup = async () => {
    const students = await Student.find();
    fs.writeFileSync(path.join(__dirname, 'vm_database.json'), JSON.stringify(students, null, 4));
};

app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ enrollmentDate: -1 });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch records" });
    }
});

app.post('/api/students', async (req, res) => {
    try {
        const newStudent = new Student(req.body);
        await newStudent.save();
        await savePhysicalBackup(); // Trigger physical save
        res.status(201).json(newStudent);
    } catch (error) {
        res.status(400).json({ message: "Error adding student" });
    }
});

app.put('/api/students/:id', async (req, res) => {
    try {
        const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        await savePhysicalBackup(); // Trigger physical save
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: "Error updating student" });
    }
});

app.delete('/api/students/:id', async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id);
        await savePhysicalBackup(); // Trigger physical save
        res.status(200).json({ message: "Student removed" });
    } catch (error) {
        res.status(400).json({ message: "Error deleting student" });
    }
});

async function startServer() {
    try {
        const mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
        console.log('✅ Database Connected');
        
        app.listen(5000, '0.0.0.0', () => {
            console.log('🚀 Server running on port 5000');
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error);
    }
}
startServer();
