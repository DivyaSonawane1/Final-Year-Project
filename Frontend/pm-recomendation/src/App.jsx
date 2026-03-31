import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

// ===================== AUTH PAGE =====================
function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
    const body = isLogin
      ? { email: formData.email, password: formData.password }
      : { name: formData.name, email: formData.email, password: formData.password };
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user, data.token);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Cannot connect to server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #1a56a0 0%, #0d3b6e 100%)' }}>
      <div className="card shadow-lg border-0 rounded-4 p-4" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="text-center mb-4">
          <div style={{ fontSize: '3rem' }}>🎓</div>
          <h3 className="fw-bold text-primary">PM Internship Portal</h3>
          <p className="text-muted small">Find your perfect internship & job</p>
        </div>

        <div className="d-flex mb-4 bg-light rounded-3 p-1">
          <button className={`btn btn-sm w-50 ${isLogin ? 'btn-primary' : 'btn-light'}`} onClick={() => { setIsLogin(true); setError(''); }}>Login</button>
          <button className={`btn btn-sm w-50 ${!isLogin ? 'btn-primary' : 'btn-light'}`} onClick={() => { setIsLogin(false); setError(''); }}>Sign Up</button>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-3">
              <label className="form-label small fw-semibold">Full Name</label>
              <input type="text" name="name" className="form-control" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required={!isLogin} />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email Address</label>
            <input type="email" name="email" className="form-control" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Password</label>
            <input type="password" name="password" className="form-control" placeholder="Enter your password" value={formData.password} onChange={handleChange} required minLength={6} />
            {!isLogin && <small className="text-muted">Minimum 6 characters</small>}
          </div>
          <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Please wait...</> : isLogin ? 'Login →' : 'Create Account →'}
          </button>
        </form>

        <p className="text-center text-muted small mt-3">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="text-primary fw-semibold" style={{ cursor: 'pointer' }} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}

// ===================== PROFILE PAGE =====================
function ProfilePage({ token, user, onProfileSaved }) {
  const [profile, setProfile] = useState({
    skills: [],
    education_level: '',
    field_of_study: '',
    location: '',
    job_type: 'internship',
    remote_preference: false
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch { }
    finally { setFetching(false); }
  };

  const handleSkillAdd = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const skill = skillInput.trim().toLowerCase();
      if (skill && !profile.skills.includes(skill)) {
        setProfile(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        setSkillInput('');
      }
    }
  };

  const removeSkill = (s) => setProfile(prev => ({ ...prev, skills: prev.skills.filter(sk => sk !== s) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Profile saved! Fetching your job suggestions...');
        setTimeout(() => onProfileSaved(), 1000);
      } else {
        setError(data.error || 'Failed to save profile');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="text-center my-5">
      <div className="spinner-border text-primary"></div>
      <p className="mt-3 text-muted">Loading your profile...</p>
    </div>
  );

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-lg border-0 rounded-4 p-4">
          <div className="text-center mb-4">
            <div style={{ fontSize: '2.5rem' }}>👤</div>
            <h4 className="fw-bold">Your Profile</h4>
            <p className="text-muted small">Fill this once — we'll find jobs that match you automatically!</p>
          </div>

          {success && <div className="alert alert-success py-2 small">{success}</div>}
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Skills */}
            <div className="mb-3">
              <label className="form-label fw-semibold">💼 Your Skills</label>
              <input
                type="text"
                className="form-control"
                placeholder="Type a skill and press Enter (e.g. Java, Python)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={handleSkillAdd}
                onBlur={handleSkillAdd}
              />
              <div className="mt-2 d-flex flex-wrap gap-1">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="badge bg-primary px-2 py-1">
                    {skill}
                    <button type="button" className="btn-close btn-close-white btn-sm ms-1" onClick={() => removeSkill(skill)}></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="mb-3">
              <label className="form-label fw-semibold">📚 Education Level</label>
              <select className="form-select" value={profile.education_level} onChange={(e) => setProfile(prev => ({ ...prev, education_level: e.target.value }))} required>
                <option value="">Select</option>
                <option value="10th Pass">10th Pass</option>
                <option value="12th Pass">12th Pass</option>
                <option value="Graduate">Graduate / Final Year</option>
                <option value="Post Graduate">Post Graduate</option>
              </select>
            </div>

            {/* Field of Study */}
            <div className="mb-3">
              <label className="form-label fw-semibold">🎓 Field of Study</label>
              <select className="form-select" value={profile.field_of_study} onChange={(e) => setProfile(prev => ({ ...prev, field_of_study: e.target.value }))} required>
                <option value="">Select</option>
                <option value="Computer Science">Computer Science / IT</option>
                <option value="Engineering">Engineering</option>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
                <option value="Medicine">Medicine</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Location */}
            <div className="mb-3">
              <label className="form-label fw-semibold">📍 Preferred Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Pune, Mumbai, Bangalore"
                value={profile.location}
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>

            {/* Job Type */}
            <div className="mb-3">
              <label className="form-label fw-semibold">🏢 Looking For</label>
              <select className="form-select" value={profile.job_type} onChange={(e) => setProfile(prev => ({ ...prev, job_type: e.target.value }))}>
                <option value="internship">Internship</option>
                <option value="full time">Full Time Job</option>
                <option value="part time">Part Time</option>
                <option value="fresher">Fresher Jobs</option>
              </select>
            </div>

            {/* Remote */}
            <div className="mb-4 form-check">
              <input type="checkbox" className="form-check-input" id="remote" checked={profile.remote_preference} onChange={(e) => setProfile(prev => ({ ...prev, remote_preference: e.target.checked }))} />
              <label className="form-check-label" htmlFor="remote">💻 Open to Remote Work</label>
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save & Find My Jobs →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ===================== JOB CARD =====================
function JobCard({ job }) {
  return (
    <div className="col-md-6 col-lg-4">
      <div className="card h-100 shadow-sm border-0 rounded-4">
        <div className="card-header bg-primary text-white rounded-top-4">
          <h6 className="mb-0 fw-bold text-truncate">{job.title}</h6>
          <small>🏢 {job.company}</small>
        </div>
        <div className="card-body d-flex flex-column">
          <div className="mb-2">
            {job.location && <p className="mb-1 small">📍 {job.location}</p>}
            <div>
              {job.type && <span className="badge bg-secondary me-1">{job.type}</span>}
              {job.isRemote && <span className="badge bg-success">Remote</span>}
            </div>
          </div>
          <p className="small text-muted flex-grow-1">{job.description}</p>
          <div className="mt-2">
            <p className="small mb-1">💰 <strong>{job.salary}</strong></p>
            {job.postedAt && <p className="small text-muted mb-2">📅 {new Date(job.postedAt).toLocaleDateString()}</p>}
            <a href={job.applyLink} target="_blank" rel="noopener noreferrer" className="btn btn-success w-100 btn-sm">Apply Now →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== JOBS PAGE =====================
function JobsPage({ token }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const searchJobs = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(`${API_BASE_URL}/jobs?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setJobs(data.jobs);
      else setError('Failed to fetch jobs. Please try again.');
    } catch {
      setError('Something went wrong. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card shadow border-0 rounded-4 p-4 mb-4">
        <h5 className="mb-3">🔍 Search Jobs & Internships</h5>
        <form onSubmit={searchJobs}>
          <div className="row g-3">
            <div className="col-md-5">
              <input type="text" className="form-control" placeholder="Job title or skills (e.g. Java Developer)" value={query} onChange={(e) => setQuery(e.target.value)} required />
            </div>
            <div className="col-md-5">
              <input type="text" className="form-control" placeholder="Location (e.g. Pune, Mumbai)" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? '...' : 'Search'}</button>
            </div>
          </div>
        </form>
      </div>

      {loading && <div className="text-center my-5"><div className="spinner-border text-primary"></div><p className="mt-3 text-muted">Fetching jobs...</p></div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && searched && jobs.length === 0 && !error && <div className="text-center text-muted my-5"><p>No jobs found. Try different keywords!</p></div>}
      {!loading && jobs.length > 0 && (
        <div>
          <h5 className="mb-3">✅ Found {jobs.length} Jobs</h5>
          <div className="row g-4">{jobs.map((job, i) => <JobCard key={job.id || i} job={job} />)}</div>
        </div>
      )}
      {!searched && !loading && (
        <div className="text-center text-muted my-5">
          <p style={{ fontSize: '3rem' }}>🔎</p>
          <p>Search for jobs or internships above to see real listings!</p>
        </div>
      )}
    </div>
  );
}

// ===================== SUGGESTED JOBS PAGE =====================
function SuggestedJobsPage({ token, onEditProfile }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInfo, setSearchInfo] = useState('');

  useEffect(() => {
    fetchSuggestedJobs();
  }, []);

  const fetchSuggestedJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/suggested`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
        setSearchInfo(`Results for "${data.query}" in ${data.location}`);
      } else {
        setError(data.error || 'Failed to fetch suggestions');
      }
    } catch {
      setError('Something went wrong. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="text-center my-5">
      <div style={{ fontSize: '3rem' }}>🤖</div>
      <div className="spinner-border text-primary mt-3"></div>
      <p className="mt-3 text-muted">Finding jobs that match your profile...</p>
    </div>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h5 className="mb-0">✨ Jobs Matched For You</h5>
          {searchInfo && <small className="text-muted">{searchInfo}</small>}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={fetchSuggestedJobs}>🔄 Refresh</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={onEditProfile}>✏️ Edit Profile</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning">
          {error}
          {error.includes('profile') && (
            <div className="mt-2">
              <button className="btn btn-sm btn-primary" onClick={onEditProfile}>Complete Your Profile</button>
            </div>
          )}
        </div>
      )}

      {!error && jobs.length === 0 && (
        <div className="text-center text-muted my-5">
          <p>No jobs found for your profile. Try updating your skills or location!</p>
          <button className="btn btn-primary" onClick={onEditProfile}>Update Profile</button>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="row g-4">
          {jobs.map((job, i) => <JobCard key={job.id || i} job={job} />)}
        </div>
      )}
    </div>
  );
}

// ===================== MAIN APP =====================
function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activePage, setActivePage] = useState('suggested'); // suggested, browse, profile
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else {
      setCheckingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (token) checkProfile();
  }, [token]);

  const checkProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.profile && data.profile.skills?.length > 0) {
        setHasProfile(true);
        setActivePage('suggested');
      } else {
        setHasProfile(false);
        setActivePage('profile');
      }
    } catch { }
    finally { setCheckingProfile(false); }
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setCheckingProfile(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setHasProfile(false);
    setCheckingProfile(false);
  };

  const handleProfileSaved = () => {
    setHasProfile(true);
    setActivePage('suggested');
  };

  if (!user) return <AuthPage onLogin={handleLogin} />;

  if (checkingProfile) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div className="spinner-border text-primary"></div>
        <p className="mt-3 text-muted">Setting up your experience...</p>
      </div>
    </div>
  );

  return (
    <div className="app bg-light min-vh-100">

      {/* NAVBAR */}
      <nav className="navbar navbar-dark bg-primary px-4 mb-4">
        <span className="navbar-brand fw-bold">🎓 PM Internship Portal</span>
        <div className="ms-auto d-flex align-items-center gap-2 flex-wrap">
          <button className={`btn btn-sm ${activePage === 'suggested' ? 'btn-light text-primary fw-bold' : 'btn-outline-light'}`} onClick={() => setActivePage('suggested')}>
            ✨ For You
          </button>
          <button className={`btn btn-sm ${activePage === 'browse' ? 'btn-light text-primary fw-bold' : 'btn-outline-light'}`} onClick={() => setActivePage('browse')}>
            🔍 Browse Jobs
          </button>
          <button className={`btn btn-sm ${activePage === 'profile' ? 'btn-light text-primary fw-bold' : 'btn-outline-light'}`} onClick={() => setActivePage('profile')}>
            👤 Profile
          </button>
          <div className="ms-2 d-flex align-items-center gap-2">
            <span className="text-white small d-none d-md-inline">Hi, {user.name}!</span>
            <button className="btn btn-sm btn-outline-light" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="container pb-5">
        {activePage === 'suggested' && <SuggestedJobsPage token={token} onEditProfile={() => setActivePage('profile')} />}
        {activePage === 'browse' && <JobsPage token={token} />}
        {activePage === 'profile' && <ProfilePage token={token} user={user} onProfileSaved={handleProfileSaved} />}
      </div>
    </div>
  );
}

export default App;
