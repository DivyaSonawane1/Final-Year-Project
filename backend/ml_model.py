# simple_ml_model.py - Works without scikit-learn
import sys
import json
import pandas as pd
import numpy as np
from collections import Counter
import re

class SimpleInternshipRecommendationEngine:
    def __init__(self):
        # Sample internships database
        self.internships_data = [
            {
                "id": "INT001",
                "title": "Digital Marketing Assistant",
                "sector": "Technology",
                "location": "Mumbai",
                "skills_required": ["social media", "content writing", "basic computer"],
                "education_level": "12th Pass",
                "remote_friendly": True,
                "stipend": 8000
            },
            {
                "id": "INT002",
                "title": "Data Entry Specialist",
                "sector": "Government",
                "location": "Delhi",
                "skills_required": ["typing", "ms office", "attention to detail"],
                "education_level": "10th Pass",
                "remote_friendly": False,
                "stipend": 6000
            },
            {
                "id": "INT003",
                "title": "Rural Development Assistant",
                "sector": "Social Work",
                "location": "Rajasthan",
                "skills_required": ["communication", "field work", "hindi"],
                "education_level": "Graduate",
                "remote_friendly": False,
                "stipend": 7000
            },
            {
                "id": "INT004",
                "title": "Teaching Assistant",
                "sector": "Education",
                "location": "Kerala",
                "skills_required": ["teaching", "patience", "subject knowledge"],
                "education_level": "Graduate",
                "remote_friendly": False,
                "stipend": 9000
            },
            {
                "id": "INT005",
                "title": "App Development Trainee",
                "sector": "Technology",
                "location": "Bangalore",
                "skills_required": ["programming", "problem solving", "mobile apps"],
                "education_level": "Graduate",
                "remote_friendly": True,
                "stipend": 12000
            }
        ]
        
        self.df = pd.DataFrame(self.internships_data)
        self.prepare_features()
    
    def prepare_features(self):
        """Prepare features for similarity calculation"""
        # Convert skills to text format
        self.df['skills_text'] = self.df['skills_required'].apply(lambda x: ' '.join(x).lower())
        
        # Education level encoding
        self.education_hierarchy = {
            "10th Pass": 1,
            "12th Pass": 2,
            "Graduate": 3,
            "Post Graduate": 4
        }
        
        self.df['education_score'] = self.df['education_level'].map(self.education_hierarchy)
    
    def simple_text_similarity(self, text1, text2):
        """Calculate simple text similarity without sklearn"""
        if not text1 or not text2:
            return 0.0
        
        # Convert to lowercase and split into words
        words1 = set(re.findall(r'\w+', text1.lower()))
        words2 = set(re.findall(r'\w+', text2.lower()))
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        if union == 0:
            return 0.0
        
        return intersection / union
    
    def calculate_similarity_score(self, user_profile, internship_row):
        """Calculate similarity between user profile and internship"""
        score = 0
        
        # Skills similarity (40% weight)
        user_skills_text = ' '.join(user_profile.get('skills', [])).lower()
        if user_skills_text:
            skills_sim = self.simple_text_similarity(user_skills_text, internship_row['skills_text'])
            score += skills_sim * 0.4
        
        # Sector match (25% weight)
        user_interests = [sector.lower() for sector in user_profile.get('sector_interests', [])]
        if internship_row['sector'].lower() in user_interests:
            score += 0.25
        
        # Education level compatibility (20% weight)
        user_education = user_profile.get('education_level', '')
        user_edu_score = self.education_hierarchy.get(user_education, 0)
        internship_edu_score = internship_row['education_score']
        
        if user_edu_score >= internship_edu_score:
            score += 0.20
        elif user_edu_score == internship_edu_score - 1:
            score += 0.10
        
        # Location preference (10% weight)
        user_location = user_profile.get('location', '').lower()
        if user_location in internship_row['location'].lower():
            score += 0.10
        elif internship_row['remote_friendly']:
            score += 0.05
        
        # Remote preference bonus (5% weight)
        if user_profile.get('remote_preference', False) and internship_row['remote_friendly']:
            score += 0.05
        
        return score
    
    def get_recommendations(self, user_profile, top_k=5):
        """Get top recommendations for user"""
        scores = []
        
        for idx, row in self.df.iterrows():
            similarity_score = self.calculate_similarity_score(user_profile, row)
            scores.append({
                'id': row['id'],
                'score': similarity_score
            })
        
        # Sort by score and return top K
        scores.sort(key=lambda x: x['score'], reverse=True)
        recommended_ids = [item['id'] for item in scores[:top_k]]
        
        return recommended_ids

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Invalid arguments"}))
        sys.exit(1)
    
    try:
        user_profile = json.loads(sys.argv[1])
        
        # Initialize recommendation engine
        engine = SimpleInternshipRecommendationEngine()
        
        # Get recommendations
        recommendations = engine.get_recommendations(user_profile, top_k=5)
        
        # Output recommendations as JSON
        print(json.dumps(recommendations))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()