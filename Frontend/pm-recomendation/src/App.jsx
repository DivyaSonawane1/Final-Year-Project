import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

const translations = {
  en: {
    title: "PM Internship Recommendation",
    subtitle: "Find the perfect internship for you",
    education: "Education Level",
    field: "Field of Study",
    skills: "Your Skills",
    sectors: "Interested Sectors",
    location: "Your Location",
    remote: "Open to Remote Work",
    language: "Preferred Language",
    submit: "Get Recommendations",
    loading: "🤖 Thinking... Finding best matches for you!",
    recommendations: "Recommended Internships",
    company: "Company",
    duration: "Duration",
    stipend: "Stipend",
    apply: "Apply Now",
    skillsPlaceholder: "e.g., typing, communication, computer",
    locationPlaceholder: "Enter your city"
  },
  hi: {
    title: "पीएम इंटर्नशिप सिफारिश",
    subtitle: "आपके लिए सही इंटर्नशिप खोजें",
    education: "शिक्षा स्तर",
    field: "अध्ययन क्षेत्र",
    skills: "आपके कौशल",
    sectors: "रुचि के क्षेत्र",
    location: "आपका स्थान",
    remote: "रिमोट वर्क के लिए तैयार",
    language: "पसंदीदा भाषा",
    submit: "सिफारिशें प्राप्त करें",
    loading: "🤖 सोच रहा हूँ... आपके लिए सबसे अच्छी इंटर्नशिप ढूंढ रहा हूँ!",
    recommendations: "सुझाई गई इंटर्नशिप",
    company: "कंपनी",
    duration: "अवधि",
    stipend: "वेतन",
    apply: "अभी आवेदन करें",
    skillsPlaceholder: "जैसे: टाइपिंग, संचार, कंप्यूटर",
    locationPlaceholder: "अपना शहर दर्ज करें"
  }
};

function App() {
  const [language, setLanguage] = useState('en');
  const [formData, setFormData] = useState({
    education_level: '',
    field_of_study: '',
    skills: [],
    sector_interests: [],
    location: '',
    remote_preference: false,
    preferred_language: 'en'
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  const t = translations[language];

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sectors`);
      const data = await response.json();
      setSectors(data);
    } catch (error) {
      console.error('Error fetching sectors:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillAdd = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const skill = skillInput.trim().toLowerCase();
      if (skill && !formData.skills.includes(skill)) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, skill]
        }));
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSectorChange = (sector) => {
    setFormData(prev => ({
      ...prev,
      sector_interests: prev.sector_interests.includes(sector)
        ? prev.sector_interests.filter(s => s !== sector)
        : [...prev.sector_interests, sector]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app bg-light min-vh-100">
      <div className="container-fluid px-0">
        
        {/* Language Selector */}
        <div className="d-flex justify-content-end mb-3">
          <button 
            className={`btn btn-sm me-2 ${language === 'en' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setLanguage('en')}
          >
            English
          </button>
          <button 
            className={`btn btn-sm ${language === 'hi' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setLanguage('hi')}
          >
            हिंदी
          </button>
        </div>

        {/* Header */}
        <header className="text-center mb-4">
          <h1 className="fw-bold display-5">{t.title}</h1>
          <p className="text-muted fs-5">{t.subtitle}</p>
        </header>

        {/* Form */}
        <form className="card shadow-lg border-0 rounded-4 p-4 mb-4" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">📚 {t.education}</label>
              <select 
                name="education_level" 
                className="form-select"
                value={formData.education_level}
                onChange={handleInputChange}
                required
              >
                <option value="">Select</option>
                <option value="10th Pass">10th Pass</option>
                <option value="12th Pass">12th Pass</option>
                <option value="Graduate">Graduate</option>
                <option value="Post Graduate">Post Graduate</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">🎓 {t.field}</label>
              <select 
                name="field_of_study" 
                className="form-select"
                value={formData.field_of_study}
                onChange={handleInputChange}
                required
              >
                <option value="">Select</option>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
                <option value="Engineering">Engineering</option>
                <option value="Medicine">Medicine</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="form-label">💼 {t.skills}</label>
            <input
              type="text"
              className="form-control"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={handleSkillAdd}
              onBlur={handleSkillAdd}
              placeholder={t.skillsPlaceholder}
            />
            <div className="mt-2">
              {formData.skills.map((skill, index) => (
                <span key={index} className="badge bg-primary me-2">
                  {skill} <button type="button" className="btn-close btn-close-white btn-sm ms-1" onClick={() => removeSkill(skill)}></button>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label className="form-label">🏢 {t.sectors}</label>
            <div className="d-flex flex-wrap gap-2">
              {sectors.map(sector => (
                <div key={sector} className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.sector_interests.includes(sector)}
                    onChange={() => handleSectorChange(sector)}
                    id={sector}
                  />
                  <label htmlFor={sector} className="form-check-label">{sector}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="row mt-3 g-3">
            <div className="col-md-6">
              <label className="form-label">📍 {t.location}</label>
              <input
                type="text"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleInputChange}
                placeholder={t.locationPlaceholder}
                required
              />
            </div>

            <div className="col-md-6 d-flex align-items-center">
              <div className="form-check mt-4">
                <input
                  type="checkbox"
                  name="remote_preference"
                  className="form-check-input"
                  checked={formData.remote_preference}
                  onChange={handleInputChange}
                  id="remoteCheck"
                />
                <label className="form-check-label" htmlFor="remoteCheck">
                  💻 {t.remote}
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
            {loading ? t.loading : t.submit}
          </button>
        </form>

        {/* Loader */}
        {loading && (
          <div className="text-center my-4">
            <div className="bot-face mb-2 fs-1">🤖</div>
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">{t.loading}</p>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && !loading && (
          <div className="recommendations">
            <h2 className="mb-4">✨ {t.recommendations}</h2>
            <div className="row g-4">
              {recommendations.map((internship, index) => (
                <div key={internship.id} className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow border-0 rounded-4 hover-card">
                    <div className="card-header bg-primary text-white rounded-top-4">
                      <h5 className="mb-0">{internship.title}</h5>
                      <small>{internship.company}</small>
                    </div>
                    <div className="card-body">
                      {/* Short preview */}
                      <p className="card-text small text-truncate">{internship.description}</p>
                      <button
                        className="btn btn-sm btn-outline-primary mb-2"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#details${index}`}
                        aria-expanded="false"
                        aria-controls={`details${index}`}
                      >
                        View Details
                      </button>

                      {/* Collapsible details */}
                      <div className="collapse" id={`details${index}`}>
                        <p className="mt-2">{internship.description}</p>
                        <p className="mb-1">📍 {internship.location}</p>
                        <p className="mb-1">⏱️ {t.duration}: {internship.duration}</p>
                        <p className="mb-2">💰 {t.stipend}: ₹{internship.stipend}</p>
                        <div className="mb-2">
                          {internship.skills_required.map((skill, idx) => (
                            <span key={idx} className="badge bg-secondary me-1">{skill}</span>
                          ))}
                        </div>
                        <button className="btn btn-success w-100">{t.apply}</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>  
  );
}

export default App;
