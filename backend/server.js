// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/pm_internship_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Internship Schema
const internshipSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  sector: { type: String, required: true },
  location: { type: String, required: true },
  duration: { type: String, required: true },
  stipend: { type: Number, default: 0 },
  skills_required: [String],
  education_level: { type: String, required: true },
  description: { type: String, required: true },
  application_deadline: { type: Date, required: true },
  remote_friendly: { type: Boolean, default: false },
  language_support: [String]
});

const Internship = mongoose.model('Internship', internshipSchema);

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  education_level: { type: String, required: true },
  field_of_study: { type: String, required: true },
  skills: [String],
  sector_interests: [String],
  location: { type: String, required: true },
  preferred_language: { type: String, default: 'en' },
  remote_preference: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Sample internships data seeding
const sampleInternships = [
  {
    id: "INT001",
    title: "Digital Marketing Assistant",
    company: "StartupHub India",
    sector: "Technology",
    location: "Mumbai",
    duration: "3 months",
    stipend: 8000,
    skills_required: ["social media", "content writing", "basic computer"],
    education_level: "12th Pass",
    description: "Learn digital marketing fundamentals and social media management",
    application_deadline: new Date('2025-10-15'),
    remote_friendly: true,
    language_support: ["hindi", "english", "marathi"]
  },
  {
    id: "INT002",
    title: "Data Entry Specialist",
    company: "GovTech Solutions",
    sector: "Government",
    location: "Delhi",
    duration: "2 months",
    stipend: 6000,
    skills_required: ["typing", "ms office", "attention to detail"],
    education_level: "10th Pass",
    description: "Handle government data entry and document management tasks",
    application_deadline: new Date('2025-09-30'),
    remote_friendly: false,
    language_support: ["hindi", "english"]
  },
  {
    id: "INT003",
    title: "Rural Development Assistant",
    company: "NGO Connect",
    sector: "Social Work",
    location: "Rajasthan",
    duration: "4 months",
    stipend: 7000,
    skills_required: ["communication", "field work", "hindi"],
    education_level: "Graduate",
    description: "Work with rural communities on development projects",
    application_deadline: new Date('2025-11-01'),
    remote_friendly: false,
    language_support: ["hindi", "rajasthani"]
  },
  {
    id: "INT004",
    title: "Teaching Assistant",
    company: "Education First",
    sector: "Education",
    location: "Kerala",
    duration: "6 months",
    stipend: 9000,
    skills_required: ["teaching", "patience", "subject knowledge"],
    education_level: "Graduate",
    description: "Assist in teaching underprivileged children",
    application_deadline: new Date('2025-10-20'),
    remote_friendly: false,
    language_support: ["malayalam", "english"]
  },
  {
    id: "INT005",
    title: "App Development Trainee",
    company: "TechnoIndia",
    sector: "Technology",
    location: "Bangalore",
    duration: "3 months",
    stipend: 12000,
    skills_required: ["programming", "problem solving", "mobile apps"],
    education_level: "Graduate",
    description: "Learn mobile app development with mentorship",
    application_deadline: new Date('2025-11-15'),
    remote_friendly: true,
    language_support: ["english", "kannada"]
  }
];

// Initialize database with sample data
async function initializeDatabase() {
  try {
    const count = await Internship.countDocuments();
    if (count === 0) {
      await Internship.insertMany(sampleInternships);
      console.log('Sample internships added to database');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Routes
app.get('/api/internships', async (req, res) => {
  try {
    const internships = await Internship.find();
    res.json(internships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recommend', async (req, res) => {
  try {
    const userProfile = req.body;
    
    // Save user profile
    const profile = new UserProfile(userProfile);
    await profile.save();
    
    // Call Python ML model
    const pythonScript = path.join(__dirname, 'ml_model.py');
    const python = spawn('python', [pythonScript, JSON.stringify(userProfile)]);
    
    let recommendations = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      recommendations += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    python.on('close', async (code) => {
      if (code === 0) {
        try {
          const recommendedIds = JSON.parse(recommendations.trim());
          const recommendedInternships = await Internship.find({
            id: { $in: recommendedIds }
          });
          res.json(recommendedInternships);
        } catch (parseError) {
          console.error('Error parsing Python output:', parseError);
          res.status(500).json({ error: 'Error processing recommendations' });
        }
      } else {
        console.error('Python script error:', errorOutput);
        res.status(500).json({ error: 'ML model error' });
      }
    });
    
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sectors', async (req, res) => {
  try {
    const sectors = await Internship.distinct('sector');
    res.json(sectors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Internship.distinct('location');
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to MongoDB and start server
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  initializeDatabase();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});