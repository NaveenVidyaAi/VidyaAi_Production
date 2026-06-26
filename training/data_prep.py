"""
Data preparation pipeline: Convert PDFs/content to training format
Converts raw data → standardized Q&A pairs → training dataset
"""

import json
import os
from pathlib import Path
from typing import List, Dict

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None


class DataPreparationPipeline:
    """Convert raw data sources to training format"""
    
    def __init__(self, output_dir: str = "./training_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.training_data = []
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract all text from a PDF file"""
        if PyPDF2 is None:
            print(f"PyPDF2 not installed. Install with: pip install PyPDF2")
            return ""
        
        text = ""
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            print(f"Error extracting from {pdf_path}: {e}")
        return text
    
    def create_qa_pair(
        self,
        question: str,
        answer: str,
        chapter: str = "General",
        subject: str = "General",
        marks: int = 2,
        difficulty: str = "medium"
    ) -> Dict:
        """Create a single training example"""
        return {
            "instruction": f"{question}\n(Subject: {subject}, Chapter: {chapter}, {marks} marks)",
            "output": answer,
            "metadata": {
                "chapter": chapter,
                "subject": subject,
                "marks": marks,
                "difficulty": difficulty
            }
        }
    
    def add_qa_pair(self, **kwargs):
        """Add a Q&A pair to training data"""
        pair = self.create_qa_pair(**kwargs)
        self.training_data.append(pair)
    
    def add_from_json(self, json_file: str):
        """Load Q&A pairs from JSON file
        Expected format:
        [
            {
                "question": "...",
                "answer": "...",
                "chapter": "...",
                "subject": "...",
                "marks": 2
            },
            ...
        ]
        """
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for item in data:
                    self.add_qa_pair(
                        question=item.get('question', ''),
                        answer=item.get('answer', ''),
                        chapter=item.get('chapter', 'General'),
                        subject=item.get('subject', 'General'),
                        marks=item.get('marks', 2),
                        difficulty=item.get('difficulty', 'medium')
                    )
        except Exception as e:
            print(f"Error loading JSON: {e}")
    
    def add_from_pdf(self, pdf_path: str, chapter: str, subject: str):
        """Extract text from PDF and prepare for manual annotation"""
        text = self.extract_text_from_pdf(pdf_path)
        # This is a placeholder - in practice, you'd need to:
        # 1. Parse the PDF structure
        # 2. Identify Q&A sections
        # 3. Create training pairs
        print(f"Extracted {len(text)} characters from {pdf_path}")
        return text
    
    def add_sample_data(self):
        """Add sample CGBSE training data for demonstration"""
        samples = [
            {
                "question": "जयशंकर प्रसाद की 'धुवस्वामिनी' कहानी का सारांश लिखिए।",
                "answer": "जयशंकर प्रसाद द्वारा लिखी गई कहानी 'धुवस्वामिनी' एक ऐतिहासिक नाटक है जो चंद्रगुप्त के शासनकाल में देवदासी प्रथा और नारी-शक्ति की कहानी बयां करता है। मुख्य पात्र धुवस्वामिनी एक विदुषी नारी हैं जो अपनी प्रतिभा और साहस से समाज में परिवर्तन लाती हैं।",
                "chapter": "अध्याय 3",
                "subject": "हिंदी",
                "marks": 5,
                "difficulty": "medium"
            },
            {
                "question": "अम्ल और क्षार में क्या अंतर है?",
                "answer": "अम्ल और क्षार में मुख्य अंतर:\n1. pH मान: अम्ल का pH 7 से कम, क्षार का pH 7 से अधिक\n2. स्वाद: अम्ल खट्टा, क्षार कड़वा\n3. प्रकृति: अम्ल H+ आयन देता है, क्षार OH- आयन देता है\n4. सूचक: नीले लिटमस को अम्ल लाल करता है, लाल लिटमस को क्षार नीला करता है",
                "chapter": "अम्ल, क्षार और लवण",
                "subject": "विज्ञान",
                "marks": 3,
                "difficulty": "easy"
            },
            {
                "question": "भारत की राजनीतिक व्यवस्था में राष्ट्रपति की भूमिका क्या है?",
                "answer": "भारत के राष्ट्रपति की भूमिका:\n1. राज्य के प्रमुख: संवैधानिक प्रमुख के रूप में कार्य करते हैं\n2. कार्यकारी शक्तियां: कानूनों पर हस्ताक्षर करते हैं, मंत्रिपरिषद की सिफारिशों को मंजूरी देते हैं\n3. विधायी शक्तियां: संसद के सदनों को संबोधित करते हैं\n4. न्यायिक शक्तियां: महामहिम को माफी देने की शक्ति है",
                "chapter": "भारतीय संविधान",
                "subject": "सामाजिक विज्ञान",
                "marks": 5,
                "difficulty": "medium"
            }
        ]
        for sample in samples:
            self.add_qa_pair(**sample)
    
    def save_to_jsonl(self, filename: str = "training_data.jsonl"):
        """Save training data in JSONL format (one JSON per line)"""
        filepath = self.output_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            for item in self.training_data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        print(f"Saved {len(self.training_data)} training examples to {filepath}")
        return filepath
    
    def save_to_json(self, filename: str = "training_data.json"):
        """Save training data in JSON format"""
        filepath = self.output_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.training_data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(self.training_data)} training examples to {filepath}")
        return filepath
    
    def split_train_test(self, test_ratio: float = 0.2):
        """Split data into train and test sets"""
        split_idx = int(len(self.training_data) * (1 - test_ratio))
        
        train_data = self.training_data[:split_idx]
        test_data = self.training_data[split_idx:]
        
        # Save split data
        train_file = self.output_dir / "train.jsonl"
        test_file = self.output_dir / "test.jsonl"
        
        with open(train_file, 'w', encoding='utf-8') as f:
            for item in train_data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        
        with open(test_file, 'w', encoding='utf-8') as f:
            for item in test_data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        
        print(f"Train: {len(train_data)} | Test: {len(test_data)}")
        return train_file, test_file
    
    def get_stats(self):
        """Print statistics about the dataset"""
        print("\n=== Dataset Statistics ===")
        print(f"Total Q&A pairs: {len(self.training_data)}")
        
        if self.training_data:
            subjects = {}
            marks_dist = {}
            for item in self.training_data:
                meta = item.get('metadata', {})
                subject = meta.get('subject', 'Unknown')
                marks = meta.get('marks', 0)
                
                subjects[subject] = subjects.get(subject, 0) + 1
                marks_dist[marks] = marks_dist.get(marks, 0) + 1
            
            print(f"\nBy Subject:")
            for subject, count in subjects.items():
                print(f"  {subject}: {count}")
            
            print(f"\nBy Marks:")
            for marks in sorted(marks_dist.keys()):
                print(f"  {marks} marks: {marks_dist[marks]}")


def main():
    """Example usage"""
    pipeline = DataPreparationPipeline("./training_data")
    
    # Add sample CGBSE data
    print("Adding sample CGBSE training data...")
    pipeline.add_sample_data()
    
    # Print statistics
    pipeline.get_stats()
    
    # Save in different formats
    pipeline.save_to_jsonl("training_data.jsonl")
    pipeline.save_to_json("training_data.json")
    
    # Split into train/test
    train_file, test_file = pipeline.split_train_test(test_ratio=0.2)
    print(f"\nTrain file: {train_file}")
    print(f"Test file: {test_file}")


if __name__ == "__main__":
    main()
