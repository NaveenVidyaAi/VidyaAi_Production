"""
Hybrid Adaptive LLM System
- Fine-tuned model for trained topics (fast, accurate)
- Fallback to Groq for out-of-domain (reliable)
- Confidence scoring to decide which to use
- Feedback collection for continuous improvement
"""

import json
import os
from datetime import datetime
from typing import Dict, Tuple, Optional
import numpy as np


class HybridAnswerGenerator:
    """
    Hybrid system: Fine-tuned model + Groq fallback + Feedback loop
    
    Architecture:
    1. User asks question
    2. Confidence check: Is it in training domain?
    3. If YES (conf > 0.7) → Use fine-tuned model (FAST ⚡)
    4. If NO (conf < 0.7) → Use Groq API (RELIABLE ✅)
    5. Collect user feedback
    6. Update knowledge base for future training
    """
    
    def __init__(self, 
                 finetuned_model_path: Optional[str] = None,
                 groq_api_key: Optional[str] = None,
                 feedback_db_path: str = "./feedback_logs"):
        """
        Initialize hybrid system
        
        Args:
            finetuned_model_path: Path to fine-tuned model (if available)
            groq_api_key: Groq API key for fallback
            feedback_db_path: Where to store user feedback
        """
        self.finetuned_model = None
        self.groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        self.feedback_db_path = feedback_db_path
        self.training_domain_keywords = self._load_training_keywords()
        
        # Create feedback directory
        os.makedirs(feedback_db_path, exist_ok=True)
        
        # Initialize fine-tuned model if available
        if finetuned_model_path and os.path.exists(finetuned_model_path):
            self._load_finetuned_model(finetuned_model_path)
    
    def _load_training_keywords(self) -> Dict[str, list]:
        """Load keywords from training data to detect in-domain questions"""
        return {
            "हिंदी": ["प्रसाद", "कबीर", "सूरदास", "दोहे", "भक्ति", "धुवस्वामिनी"],
            "विज्ञान": ["अम्ल", "क्षार", "धातु", "प्रकाश", "परावर्तन", "संक्षारण", "वंशागति", "विद्युत"],
            "गणित": ["द्विघात", "समीकरण", "त्रिभुज"],
            "सामाजिक_विज्ञान": ["चंपारण", "राष्ट्रपति", "मौर्य", "संविधान"],
        }
    
    def _load_finetuned_model(self, model_path: str):
        """Load fine-tuned model"""
        try:
            from inference import FinetunedModelInference
            self.finetuned_model = FinetunedModelInference()
            self.finetuned_model.load(adapter_path=model_path)
            print("✅ Fine-tuned model loaded")
        except Exception as e:
            print(f"⚠️ Could not load fine-tuned model: {e}")
            self.finetuned_model = None
    
    def calculate_confidence(self, question: str) -> float:
        """
        Calculate confidence: Is this question in training domain?
        
        Returns: float (0.0 to 1.0)
            1.0 = Definitely in training domain
            0.0 = Definitely out of domain
        """
        question_lower = question.lower()
        
        # Check for training keywords
        keyword_hits = 0
        for subject, keywords in self.training_domain_keywords.items():
            for keyword in keywords:
                if keyword.lower() in question_lower:
                    keyword_hits += 1
        
        # Check for class indicators
        class_indicators = ["कक्षा 10", "class 10", "10वीं", "दसवीं", "board exam"]
        class_match = any(ind.lower() in question_lower for ind in class_indicators)
        
        # Calculate confidence
        confidence = 0.0
        confidence += min(keyword_hits * 0.2, 0.6)  # Max 60% from keywords
        confidence += (0.3 if class_match else 0.1)  # 30% if class specified, 10% otherwise
        confidence += 0.1  # Base confidence
        
        return min(confidence, 1.0)
    
    def generate_answer(self, 
                       question: str,
                       use_feedback: bool = True) -> Dict:
        """
        Generate answer using hybrid approach
        
        Args:
            question: User question
            use_feedback: Whether to collect feedback
            
        Returns:
            {
                'answer': str,
                'source': 'fine-tuned' or 'groq',
                'confidence': float,
                'feedback_id': str (for collecting user feedback)
            }
        """
        
        # Step 1: Calculate confidence
        confidence = self.calculate_confidence(question)
        
        # Step 2: Decide which model to use
        if confidence > 0.7 and self.finetuned_model:
            print(f"🔵 Using FINE-TUNED model (confidence: {confidence:.2%})")
            answer = self.finetuned_model.generate(question)
            source = "fine-tuned"
        else:
            print(f"🟠 Using GROQ fallback (confidence: {confidence:.2%})")
            answer = self._generate_from_groq(question)
            source = "groq"
        
        # Step 3: Log for feedback
        feedback_id = self._create_feedback_entry(question, answer, source, confidence)
        
        return {
            'answer': answer,
            'source': source,
            'confidence': confidence,
            'feedback_id': feedback_id,
        }
    
    def _generate_from_groq(self, question: str) -> str:
        """Generate answer using Groq API"""
        try:
            from groq import Groq
            
            client = Groq(api_key=self.groq_api_key)
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": "आप एक CGBSE शिक्षा सहायक हैं। सरल, सटीक और परीक्षा-केंद्रित उत्तर दें।"
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ],
                temperature=0.7,
                max_tokens=1024,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"⚠️ उत्तर प्राप्त नहीं हो सका: {str(e)}"
    
    def _create_feedback_entry(self, question: str, answer: str, 
                               source: str, confidence: float) -> str:
        """Create feedback entry for later training"""
        feedback_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        
        entry = {
            'timestamp': datetime.now().isoformat(),
            'question': question,
            'answer': answer,
            'source': source,
            'confidence': confidence,
            'feedback': None,  # Will be filled by user
            'useful': None,    # Will be filled by user
        }
        
        # Save to file
        feedback_file = os.path.join(self.feedback_db_path, f"{feedback_id}.json")
        with open(feedback_file, 'w', encoding='utf-8') as f:
            json.dump(entry, f, ensure_ascii=False, indent=2)
        
        return feedback_id
    
    def collect_feedback(self, feedback_id: str, 
                        feedback_text: str = "", 
                        useful: bool = True) -> bool:
        """
        Collect user feedback on answer
        
        Args:
            feedback_id: ID from generate_answer()
            feedback_text: User's written feedback (optional)
            useful: Whether answer was useful
            
        Returns: bool - Success
        """
        feedback_file = os.path.join(self.feedback_db_path, f"{feedback_id}.json")
        
        try:
            with open(feedback_file, 'r', encoding='utf-8') as f:
                entry = json.load(f)
            
            entry['feedback'] = feedback_text
            entry['useful'] = useful
            entry['feedback_timestamp'] = datetime.now().isoformat()
            
            with open(feedback_file, 'w', encoding='utf-8') as f:
                json.dump(entry, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Feedback recorded for {feedback_id}")
            return True
        except Exception as e:
            print(f"❌ Error recording feedback: {e}")
            return False
    
    def get_feedback_for_retraining(self) -> Dict:
        """
        Get collected feedback to prepare for next round of fine-tuning
        
        Returns:
            {
                'total_queries': int,
                'useful_answers': int,
                'useful_rate': float,
                'groq_fallback_count': int,
                'potential_new_training_data': list
            }
        """
        stats = {
            'total_queries': 0,
            'useful_answers': 0,
            'groq_fallback_count': 0,
            'potential_new_training_data': [],
        }
        
        for filename in os.listdir(self.feedback_db_path):
            if filename.endswith('.json'):
                with open(os.path.join(self.feedback_db_path, filename), 'r') as f:
                    entry = json.load(f)
                
                stats['total_queries'] += 1
                
                if entry.get('useful'):
                    stats['useful_answers'] += 1
                
                if entry['source'] == 'groq':
                    stats['groq_fallback_count'] += 1
                    # This is a good candidate for next training round
                    stats['potential_new_training_data'].append({
                        'question': entry['question'],
                        'answer': entry['answer'],
                        'from_feedback': True,
                    })
        
        stats['useful_rate'] = (stats['useful_answers'] / stats['total_queries'] 
                               if stats['total_queries'] > 0 else 0)
        
        return stats


class AdaptiveLearningPipeline:
    """
    Continuous learning pipeline:
    1. Collect queries + feedback from users
    2. Identify patterns (what's most asked)
    3. Prepare new training data
    4. Schedule retraining when ready
    """
    
    def __init__(self, hybrid_system: HybridAnswerGenerator):
        self.hybrid = hybrid_system
    
    def prepare_next_training_batch(self, 
                                   min_confidence_threshold: float = 0.5) -> Dict:
        """
        Prepare data for next fine-tuning round
        
        Returns:
            {
                'new_qa_pairs': list,
                'high_confidence_misses': list,
                'ready_to_train': bool
            }
        """
        feedback_stats = self.hybrid.get_feedback_for_retraining()
        
        # Collect new Q&A from Groq answers
        new_qa_pairs = []
        
        for qa in feedback_stats['potential_new_training_data']:
            if qa.get('from_feedback'):
                new_qa_pairs.append({
                    'question': qa['question'],
                    'answer': qa['answer'],
                    'source': 'user_feedback',
                    'verified': False,  # Should be verified by teacher
                })
        
        # Ready to train if we have enough new data
        ready = len(new_qa_pairs) >= 10
        
        return {
            'new_qa_pairs': new_qa_pairs,
            'total_collected': len(new_qa_pairs),
            'ready_to_train': ready,
            'recommendation': f"Collected {len(new_qa_pairs)} new Q&A pairs. "
                            f"Ready to train!" if ready else f"Need {10 - len(new_qa_pairs)} more pairs."
        }


# ============================================================================
# INTEGRATION WITH BACKEND
# ============================================================================

def create_hybrid_system():
    """Factory function to create hybrid system"""
    return HybridAnswerGenerator(
        finetuned_model_path="./fine_tuned_models/latest/final",
        groq_api_key=os.getenv("GROQ_API_KEY"),
        feedback_db_path="./feedback_logs"
    )


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("HYBRID ADAPTIVE LLM SYSTEM DEMO")
    print("=" * 80)
    
    # Initialize
    system = HybridAnswerGenerator(
        groq_api_key=os.getenv("GROQ_API_KEY"),
    )
    
    # Test queries
    test_questions = [
        "अम्ल और क्षार में अंतर लिखो।",  # In-domain ✅
        "द्विघात समीकरण क्या है?",         # In-domain ✅
        "Class 12 में कौन से नए विषय हैं?",  # Out-of-domain ❌
        "Quantum mechanics क्या है?",       # Out-of-domain ❌
    ]
    
    feedback_ids = []
    
    for question in test_questions:
        print(f"\n📝 Question: {question}")
        
        # Generate answer
        result = system.generate_answer(question)
        
        print(f"   Source: {result['source']}")
        print(f"   Confidence: {result['confidence']:.1%}")
        print(f"   Answer: {result['answer'][:100]}...")
        
        feedback_ids.append(result['feedback_id'])
    
    # Simulate user feedback
    print("\n" + "=" * 80)
    print("COLLECTING USER FEEDBACK")
    print("=" * 80)
    
    for i, fid in enumerate(feedback_ids[:2]):  # Mark first 2 as useful
        system.collect_feedback(fid, useful=True)
    
    for fid in feedback_ids[2:]:  # Mark rest as not useful
        system.collect_feedback(fid, useful=False)
    
    # Get retraining preparation
    print("\n" + "=" * 80)
    print("PREPARING FOR NEXT TRAINING ROUND")
    print("=" * 80)
    
    stats = system.get_feedback_for_retraining()
    print(f"Total queries: {stats['total_queries']}")
    print(f"Useful answers: {stats['useful_answers']}")
    print(f"Useful rate: {stats['useful_rate']:.1%}")
    print(f"Groq fallback count: {stats['groq_fallback_count']}")
    
    # Prepare for retraining
    pipeline = AdaptiveLearningPipeline(system)
    prep = pipeline.prepare_next_training_batch()
    
    print(f"\nNext training batch ready:")
    print(f"  New Q&A pairs: {prep['total_collected']}")
    print(f"  Ready to train: {prep['ready_to_train']}")
    print(f"  Recommendation: {prep['recommendation']}")
