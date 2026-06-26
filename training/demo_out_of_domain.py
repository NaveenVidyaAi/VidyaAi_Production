#!/usr/bin/env python3
"""
Demonstration: What happens when asking in-domain vs out-of-domain questions
This is educational - shows expected behavior patterns
"""

class TrainingDomainAnalysis:
    """Analyze question domains vs training data"""
    
    # Training Data Coverage
    TRAINING_DATA = {
        "हिंदी": [
            "जयशंकर प्रसाद - धुवस्वामिनी",
            "कबीर - दोहे",
            "सूरदास - भक्ति",
            "कहानी - तत्व"
        ],
        "विज्ञान": [
            "अम्ल क्षार लवण",
            "धातु अधातु",
            "संक्षारण",
            "प्रकाश परावर्तन",
            "विद्युत प्रतिरोध",
            "वंशागति",
            "जीवन प्रक्रियाएं",
            "रक्त परिसंचरण"
        ],
        "गणित": [
            "द्विघात समीकरण",
            "त्रिभुज"
        ],
        "सामाजिक_विज्ञान": [
            "चंपारण सत्याग्रह",
            "राष्ट्रपति",
            "मौर्य काल",
            "भारतीय संस्कृति"
        ]
    }
    
    def classify_question(self, question: str) -> dict:
        """Classify question as in-domain or out-of-domain"""
        
        test_cases = {
            # ✅ IN-DOMAIN QUESTIONS (Trained on these)
            "✅ IN-DOMAIN (Will Work Well)": [
                ("अम्ल और क्षार में क्या अंतर है?", "Science Q1 - Exact"),
                ("द्विघात समीकरण का सूत्र क्या है?", "Math Q1 - Exact"),
                ("कबीर के दोहों का विषय क्या है?", "Hindi Q2 - Exact"),
                ("राष्ट्रपति की भूमिका समझाइए।", "Social Studies Q2 - Exact"),
            ],
            
            # ⚠️ PARTIALLY OUT-OF-DOMAIN (Risky)
            "⚠️ PARTIALLY OUT (Risky - May Hallucinate)": [
                ("अधातु के गुण क्या होते हैं?", "Not trained, but similar to धातु"),
                ("अम्ल के उदाहरण दीजिए।", "Related to अम्ल, but different"),
                ("त्रिभुज के अन्य प्रकार?", "Related to training, but untrained parts"),
                ("मौर्य काल के बाद क्या आया?", "Related but extended beyond training"),
                ("अन्य भक्त कवि कौन थे?", "Related to सूरदास/कबीर but different poets"),
            ],
            
            # ❌ COMPLETELY OUT-OF-DOMAIN (Will Likely Fail)
            "❌ OUT-OF-DOMAIN (High Risk)": [
                ("मृच्छकटिकम् नाटक के बारे में बताइए।", "Class 12 Hindi - NOT trained"),
                ("कक्षा 11 की भौतिकी समझाइए।", "Class 11 - NOT trained"),
                ("कवि तुलसीदास की रचनाएं?", "Not in CGBSE Class 10"),
                ("क्वांटम मैकेनिक्स क्या है?", "Engineering - NOT trained"),
                ("COVID-19 के बारे में बताइए।", "Current events - NOT trained"),
                ("Einstein के सापेक्षता सिद्धांत?", "Advanced physics - NOT trained"),
            ]
        }
        
        return test_cases

def demonstrate_responses():
    """Show what model might output for different question types"""
    
    print("=" * 80)
    print("DEMONSTRATION: Expected Model Behavior")
    print("=" * 80)
    
    scenarios = [
        {
            "category": "✅ IN-DOMAIN Question",
            "question": "अम्ल और क्षार में क्या अंतर है?",
            "expected": "Model has exact answer from training",
            "accuracy": "95-98%",
            "output": """
            अम्ल और क्षार में अंतर:
            
            अम्ल:
            - pH < 7 (7 से कम)
            - स्वाद: खट्टा
            - H+ आयन देते हैं
            - नीले लिटमस को लाल करते हैं
            - उदाहरण: HCl, H2SO4, सिरका
            
            क्षार:
            - pH > 7 (7 से अधिक)
            - स्वाद: कड़वा
            - OH- आयन देते हैं
            - लाल लिटमस को नीला करते हैं
            - उदाहरण: NaOH, KOH, Ca(OH)2
            """
        },
        {
            "category": "⚠️ PARTIAL OUT-OF-DOMAIN Question",
            "question": "अधातु के गुण क्या होते हैं?",
            "expected": "Model saw 'धातु' in training, not 'अधातु'",
            "accuracy": "60-75%",
            "output": """
            अधातु के गुण:
            [Model applies opposite logic from धातु training]
            
            Good answer would be:
            - मंद/चमकदार नहीं
            - विद्युत कुचालक
            - नाजुक/भंगुर
            - विभिन्न रंग
            - कम घनत्व
            
            But model might also mix in training patterns:
            - "अधातु संक्षारण से बचाव करते हैं" ❌ (वास्तव में गलत)
            """
        },
        {
            "category": "❌ OUT-OF-DOMAIN Question",
            "question": "मृच्छकटिकम् नाटक के बारे में विस्तार से बताइए।",
            "expected": "Not in training data (Class 12). Model will HALLUCINATE",
            "accuracy": "20-40%",
            "output": """
            ❌ POTENTIAL HALLUCINATED RESPONSE:
            
            "मृच्छकटिकम् एक नाटक है जिसे कालिदास ने लिखा।
             यह धुवस्वामिनी की तरह ऐतिहासिक नाटक है।
             इसमें राजा और दासी की कहानी है।
             यह 5 अंकों का प्रश्न हो सकता है।"
             
            ❌ ERRORS:
            - लेखक गलत: कालिदास नहीं, Shudraka ने लिखा ✗
            - विषय गलत: ऐतिहासिक नहीं है ✗
            - विषयवस्तु मिश्रित: सही जानकारी नहीं ✗
            - परीक्षा प्रारूप गलत: Class 10 format दिया, Class 12 के लिए ✗
            
            ✓ सही उत्तर होना चाहिए:
            - कालचक्र: 200 CE
            - लेखक: शूद्रक
            - विषय: सामाजिक नाटक (प्रेम कहानी)
            - भाषा: संस्कृत
            - अंक: सात
            """
        },
        {
            "category": "❌ COMPLETELY UNRELATED Question",
            "question": "क्वांटम मेकेनिक्स क्या है?",
            "expected": "Engineering topic - not in CGBSE curriculum at all",
            "accuracy": "10-30%",
            "output": """
            ❌ HALLUCINATED/GENERIC RESPONSE:
            
            Model tries to fit into known patterns:
            "क्वांटम मेकेनिक्स भौतिकी की एक शाखा है। 
             जैसे अम्ल और क्षार हैं, वैसे ही...
             [tries to relate to training data]
             
             यह 2 अंकों के प्रश्न में आ सकता है।"
             
            ✗ COMPLETELY WRONG
            ✗ No relevant knowledge base
            ✗ Forced into training domain
            """
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{'─' * 80}")
        print(f"\nSCENARIO {i}: {scenario['category']}")
        print(f"Question: {scenario['question']}")
        print(f"Status: {scenario['expected']}")
        print(f"Expected Accuracy: {scenario['accuracy']}")
        print(f"\nModel Output:\n{scenario['output']}")
    
    print(f"\n{'═' * 80}")
    print("\nKEY INSIGHTS:")
    print("─" * 80)
    print("""
1. ✅ IN-DOMAIN (Trained on exact content)
   → Accuracy: 95%+
   → Risk: Low
   → When to use: Final exam preparation, board exams
   
2. ⚠️  PARTIAL OUT-OF-DOMAIN (Related but not trained)
   → Accuracy: 60-70%
   → Risk: Medium (might generalize, might hallucinate)
   → When to use: Carefully, with verification
   
3. ❌ OUT-OF-DOMAIN (Not in training)
   → Accuracy: 20-40%
   → Risk: HIGH (likely hallucination)
   → When to use: Never without verification
   
4. ❌ COMPLETELY UNRELATED (Different curriculum)
   → Accuracy: <20%
   → Risk: VERY HIGH
   → When to use: Not at all

───────────────────────────────────────────────────────────────────────────

SOLUTION FOR RELIABILITY:

Option A: Expand Training Data
  - Current: 25 Q&A (Class 10 only)
  - Phase 2: 100+ Q&A (Class 10 + 11)
  - Phase 3: 300+ Q&A (Class 10 + 11 + 12)
  
Option B: Add Retrieval Augmented Generation (RAG)
  - If question not in training → Search knowledge base
  - If not found → Fetch from textbooks/web
  - Then generate answer from retrieved context
  
Option C: Confidence Scoring
  - If confidence < 0.6 → Say "Not trained"
  - If confidence > 0.8 → Provide answer
  - Medium range → Mark as "Low confidence"
    """)

if __name__ == "__main__":
    demonstrate_responses()
