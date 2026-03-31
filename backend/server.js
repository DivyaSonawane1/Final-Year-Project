// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'pm_internship_secret_key_2026';

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/pm_internship_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ===================== SCHEMAS =====================

// User Auth Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// User Profile Schema
const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: [String],
  education_level: { type: String, default: '' },
  field_of_study: { type: String, default: '' },
  location: { type: String, default: '' },
  job_type: { type: String, default: 'internship' }, // internship, fulltime, parttime
  remote_preference: { type: Boolean, default: false },
  updated_at: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', profileSchema);

// ===================== AUTH MIDDLEWARE =====================

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ===================== AUTH ROUTES =====================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== PROFILE ROUTES =====================

// Get profile
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    res.json({ success: true, profile: profile || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save / Update profile
app.post('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { skills, education_level, field_of_study, location, job_type, remote_preference } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { userId: req.user.id, skills, education_level, field_of_study, location, job_type, remote_preference, updated_at: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== JOBS ROUTES =====================

// Get jobs based on profile (auto suggestions)
app.get('/api/jobs/suggested', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ error: 'No profile found. Please complete your profile first.' });

    // Build query from profile
    const skillsQuery = profile.skills?.slice(0, 2).join(' ') || '';
    const query = `${skillsQuery} ${profile.job_type === 'internship' ? 'internship' : 'developer'}`.trim();
    const location = profile.location || 'India';

    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: { query, location, num_pages: '1', date_posted: 'month' },
      headers: {
        'X-RapidAPI-Key': '4726b43329msh3fc86cb6f8d53bdp19ed9ajsnde8aaf5c65be',
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    const jobs = response.data.data.map(job => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city || job.job_country,
      type: job.job_employment_type,
      description: job.job_description?.slice(0, 250) + '...',
      applyLink: job.job_apply_link,
      postedAt: job.job_posted_at_datetime_utc,
      isRemote: job.job_is_remote,
      salary: job.job_min_salary ? `${job.job_min_salary} - ${job.job_max_salary}` : 'Not disclosed'
    }));

    res.json({ success: true, count: jobs.length, jobs, query, location });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search jobs manually
app.get('/api/jobs', authMiddleware, async (req, res) => {
  const { query, location } = req.query;
  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: { query: query || 'software engineer internship', location: location || 'India', num_pages: '1', date_posted: 'month' },
      headers: {
        'X-RapidAPI-Key': '4726b43329msh3fc86cb6f8d53bdp19ed9ajsnde8aaf5c65be',
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    const jobs = response.data.data.map(job => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city || job.job_country,
      type: job.job_employment_type,
      description: job.job_description?.slice(0, 250) + '...',
      applyLink: job.job_apply_link,
      postedAt: job.job_posted_at_datetime_utc,
      isRemote: job.job_is_remote,
      salary: job.job_min_salary ? `${job.job_min_salary} - ${job.job_max_salary}` : 'Not disclosed'
    }));

    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================== START =====================

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
