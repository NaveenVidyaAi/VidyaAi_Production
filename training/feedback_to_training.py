#!/usr/bin/env python3
"""
Extract feedback logs into new training data
- Reviews collected Q&A from user feedback
- Formats for next training round
- Helps prepare for retraining
"""

import json
import os
from pathlib import Path
from typing import List, Dict


class FeedbackToTrainingExtractor:
    """Convert feedback logs to training format"""
    
    def __init__(self, feedback_db_path: str = "./feedback_logs"):
        self.feedback_path = feedback_db_path
        self.training_output = "training/new_training_data.json"
    
    def extract_useful_feedback(self) -> List[Dict]:
        """Extract Q&A pairs from feedback marked as useful"""
        useful_pairs = []
        
        if not os.path.exists(self.feedback_path):
            print(f"❌ Feedback path not found: {self.feedback_path}")
            return useful_pairs
        
        for filename in os.listdir(self.feedback_path):
            if not filename.endswith('.json'):
                continue
            
            filepath = os.path.join(self.feedback_path, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    entry = json.load(f)
                
                # Check if feedback was marked as useful
                if entry.get('feedback') is not None:  # Has feedback
                    if entry.get('useful'):  # Marked as useful
                        useful_pairs.append({
                            'question': entry['question'],
                            'answer': entry['answer'],
                            'source': entry['source'],
                            'confidence': entry['confidence'],
                            'user_feedback': entry.get('feedback', ''),
                            'extracted_date': entry.get('feedback_timestamp', ''),
                        })
            except Exception as e:
                print(f"⚠️  Error reading {filename}: {e}")
        
        return useful_pairs
    
    def extract_groq_responses(self) -> List[Dict]:
        """Extract Q&A pairs from Groq responses (good candidates for training)"""
        groq_responses = []
        
        if not os.path.exists(self.feedback_path):
            return groq_responses
        
        for filename in os.listdir(self.feedback_path):
            if not filename.endswith('.json'):
                continue
            
            filepath = os.path.join(self.feedback_path, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    entry = json.load(f)
                
                # If answer came from Groq and was useful
                if entry.get('source') == 'groq' and entry.get('useful'):
                    groq_responses.append({
                        'question': entry['question'],
                        'answer': entry['answer'],
                        'source': 'groq_fallback',
                        'user_feedback': entry.get('feedback', ''),
                        'confidence_was': entry['confidence'],
                    })
            except Exception as e:
                print(f"⚠️  Error reading {filename}: {e}")
        
        return groq_responses
    
    def format_for_training(self, qa_pairs: List[Dict]) -> List[Dict]:
        """Format Q&A pairs in training format"""
        training_format = []
        
        for pair in qa_pairs:
            training_format.append({
                'question': pair['question'],
                'answer': pair['answer'],
                'chapter': 'User Feedback',
                'subject': self._infer_subject(pair['question']),
                'marks': self._infer_marks(pair['question']),
                'difficulty': 'medium',
                'source': pair.get('source', 'user_feedback'),
                'verified': False,  # Requires teacher verification
                'notes': pair.get('user_feedback', '')
            })
        
        return training_format
    
    def _infer_subject(self, question: str) -> str:
        """Infer subject from question"""
        keywords = {
            'हिंदी': ['कबीर', 'प्रसाद', 'सूरदास', 'दोहे', 'कहानी', 'साहित्य'],
            'विज्ञान': ['अम्ल', 'क्षार', 'धातु', 'प्रकाश', 'विद्युत', 'संक्षारण', 'परावर्तन'],
            'गणित': ['समीकरण', 'त्रिभुज', 'द्विघात', 'भुज'],
            'सामाजिक_विज्ञान': ['राष्ट्रपति', 'चंपारण', 'मौर्य', 'संविधान', 'इतिहास'],
        }
        
        for subject, kws in keywords.items():
            for kw in kws:
                if kw.lower() in question.lower():
                    return subject
        
        return 'अन्य'
    
    def _infer_marks(self, question: str) -> int:
        """Infer marks from question"""
        if 'अंक' in question or 'marks' in question:
            for word in question.split():
                if word.isdigit():
                    marks = int(word)
                    if marks in [1, 2, 3, 5, 7]:
                        return marks
        
        # Default based on question length
        if len(question) > 60:
            return 5
        elif len(question) > 40:
            return 3
        else:
            return 2
    
    def generate_report(self) -> Dict:
        """Generate report of feedback extracted"""
        useful_feedback = self.extract_useful_feedback()
        groq_responses = self.extract_groq_responses()
        
        report = {
            'total_feedback_entries': len(os.listdir(self.feedback_path)),
            'useful_answers': len(useful_feedback),
            'groq_fallback_useful': len(groq_responses),
            'ready_to_train': (len(useful_feedback) + len(groq_responses)) >= 10,
            'total_new_pairs': len(useful_feedback) + len(groq_responses),
            'recommendations': []
        }
        
        # Generate recommendations
        if report['total_new_pairs'] < 5:
            report['recommendations'].append("Collect more feedback (need 10+ pairs)")
        
        if report['groq_fallback_useful'] > report['useful_answers']:
            report['recommendations'].append(
                "Many Groq answers marked useful - consider expanding training data"
            )
        
        if report['useful_answers'] > report['total_new_pairs'] * 0.7:
            report['recommendations'].append(
                "High quality feedback - good candidates for training"
            )
        
        return report
    
    def export_for_review(self, output_file: str = "feedback_for_review.json"):
        """Export all useful feedback for teacher review"""
        useful_feedback = self.extract_useful_feedback()
        groq_responses = self.extract_groq_responses()
        
        export_data = {
            'metadata': {
                'total_useful': len(useful_feedback),
                'total_groq': len(groq_responses),
                'ready_to_add_to_training': (len(useful_feedback) + len(groq_responses)) >= 10,
            },
            'useful_feedback': self.format_for_training(useful_feedback),
            'groq_responses': self.format_for_training(groq_responses),
            'instructions': [
                "1. Review each Q&A pair below",
                "2. Verify answers are correct",
                "3. Mark 'verified': true for good pairs",
                "4. Add to training_data/example_data.json",
                "5. Run: python3 fine_tune_qlora.py",
                "6. Deploy new model"
            ]
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Exported to {output_file}")
        return export_data


# ============================================================================
# USAGE
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("FEEDBACK TO TRAINING DATA EXTRACTOR")
    print("=" * 80)
    
    extractor = FeedbackToTrainingExtractor("./feedback_logs")
    
    # Generate report
    print("\n📊 REPORT:")
    report = extractor.generate_report()
    for key, value in report.items():
        if key != 'recommendations':
            print(f"   {key}: {value}")
    
    if report['recommendations']:
        print("\n💡 RECOMMENDATIONS:")
        for rec in report['recommendations']:
            print(f"   • {rec}")
    
    # Export for review
    print("\n📤 EXPORTING FOR TEACHER REVIEW...")
    export_data = extractor.export_for_review("feedback_for_review.json")
    
    print(f"\n✅ EXTRACTION COMPLETE")
    print(f"   Useful answers: {len(export_data['useful_feedback'])}")
    print(f"   Groq responses: {len(export_data['groq_responses'])}")
    print(f"   Ready to train: {export_data['metadata']['ready_to_add_to_training']}")
    
    print("\n📝 NEXT STEPS:")
    print("   1. Review feedback_for_review.json")
    print("   2. Verify answers with teachers")
    print("   3. Copy verified pairs to training_data/example_data.json")
    print("   4. Run: cd training && python3 fine_tune_qlora.py")
    print("   5. Deploy updated model")
