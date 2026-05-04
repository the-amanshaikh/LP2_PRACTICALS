const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');

const app = express();
app.use(express.json());

// Serve the React frontend file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Database Schema
const StudentSchema = new mongoose.Schema({
    name: String, rollNo: String, course: String
});
const Student = mongoose.model('Student', StudentSchema);

// API Routes
app.get('/api/students', async (req, res) => {
    const students = await Student.find();
    res.json(students);
});

app.post('/api/students', async (req, res) => {
    const newStudent = new Student(req.body);
    await newStudent.save();
    res.json(newStudent);
});

// Start Database and Server
async function startServer() {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log('Local Database Connected');
    
    app.listen(5000, '0.0.0.0', () => console.log('Server running on port 5000'));
}
startServer();
