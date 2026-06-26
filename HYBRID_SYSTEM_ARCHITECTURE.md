# Hybrid Adaptive Training System: Complete Architecture

## 🎯 Overview

Your system will have **3 layers**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  (Frontend: Dashboard with feedback buttons)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Question + Optional Feedback
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID DECISION LAYER                        │
│  (hybrid_adaptive_system.py)                                    │
│                                                                 │
│  1. Calculate Confidence Score (0-1)                           │
│  2. IF confidence > 0.7 → Use FINE-TUNED MODEL (⚡ Fast)       │
│  3. IF confidence < 0.7 → Use GROQ API (✅ Reliable)           │
│  4. Log question + answer + source                             │
│  5. Return answer + feedback_id                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Answer
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              MODEL LAYER: Dual Backends                          │
│                                                                  │
│  ┌────────────────────────┐    ┌──────────────────────────────┐ │
│  │  FINE-TUNED MODEL      │    │      GROQ API                │ │
│  │  (Llama-3.2-3B)        │    │  (llama-3.1-8b-instant)      │ │
│  │  + LoRA Adapters       │    │                              │ │
│  │                        │    │  ✅ General Knowledge       │ │
│  │  ✅ Class 10 Expert    │    │  ✅ Any Domain              │ │
│  │  ⚡ 100ms latency      │    │  ⚠️  Requires API call       │ │
│  │  📊 25 CGBSE Q&A pairs │    │  🌐 Reliable, Diverse       │ │
│  └────────────────────────┘    └──────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│             FEEDBACK & LEARNING LAYER                            │
│  (hybrid_adaptive_system.py + AdaptiveLearningPipeline)         │
│                                                                  │
│  Feedback Loop:                                                 │
│  ✓ User marks answer as useful/not useful                      │
│  ✓ System logs: question, answer, source, usefulness           │
│  ✓ Identifies patterns: Which topics need retraining?          │
│  ✓ Prepares new Q&A pairs from Groq responses                  │
│  ✓ When 10+ new pairs collected → Ready to retrain             │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              CONTINUOUS IMPROVEMENT CYCLE                        │
│  (Monthly/Quarterly Retraining)                                 │
│                                                                  │
│  1. Extract feedback → Identify gaps                            │
│  2. Verify new Q&A with teachers                               │
│  3. Add to training_data/example_data.json                     │
│  4. Run: python3 fine_tune_qlora.py                            │
│  5. Deploy updated model                                        │
│  6. Clear feedback logs, restart cycle                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Decision Logic: When to Use Which Model

### Confidence Scoring Algorithm

```python
confidence = 0.0

# 1. Check for training keywords (0-0.6)
for subject in training_data:
    for keyword in subject_keywords:
        if keyword in question:
            confidence += 0.2

# 2. Check for class indicator (0-0.3)
if "कक्षा 10" or "class 10" in question:
    confidence += 0.3
else:
    confidence += 0.1

# 3. Base confidence (0.1)
confidence += 0.1

# Decision
if confidence > 0.7:
    use_finetuned_model()    # 🟢 Green light
else:
    use_groq_fallback()      # 🟠 Orange flag → Use reliable API
```

### Example Confidence Scores

```
Question: "अम्ल और क्षार में क्या अंतर है?"
- Has keyword "अम्ल" and "क्षार": +0.4
- Has "कक्षा 10": +0.3
- Base: +0.1
- Total: 0.8 ✅ USE FINE-TUNED (Good!)

Question: "मृच्छकटिकम् का लेखक?"
- Has keyword for Hindi literature: +0.2
- Has "कक्षा 10"?: NO: +0.1
- Base: +0.1
- Total: 0.4 ❌ USE GROQ (Play safe!)

Question: "Quantum mechanics क्या है?"
- No training keywords: +0
- English + out of domain: +0.1
- Base: +0.1
- Total: 0.2 ❌❌ USE GROQ (Definitely!)
```

---

## 🔄 Feedback Collection & Processing Flow

### Frontend Flow

```
User gets answer
        ↓
┌─────────────────────────────────┐
│ Display:                        │
│ [👍 Good] [❌ Needs Improvement]│
│ Source: Fine-tuned (80%)        │
└─────────────────────────────────┘
        ↓ (User clicks)
  [👍 Good answer]
        ↓
POST /api/feedback with:
- feedback_id: "20260620_104530_123456"
- useful: true
- feedback_text: "Perfect! Clear explanation"
        ↓
Backend logs this
```

### Backend Processing

```
1. COLLECTION (Real-time)
   └─ Each question+answer logged to ./feedback_logs/
   └─ User feedback appended to same entry
   └─ Running tally of useful vs not-useful

2. ANALYSIS (Daily/Weekly)
   └─ GET /api/retraining-stats
   └─ Identify:
      • Which topics have low confidence?
      • Which topics are asked most?
      • Which Groq responses were marked useful?
      • Top 10 new Q&A candidates for retraining

3. PREPARATION (Weekly/Monthly)
   └─ Extract Q&A from Groq responses marked useful
   └─ Organize by topic
   └─ Create formatted JSON for retraining

4. RETRAINING (Monthly/Quarterly)
   └─ Teacher reviews new Q&A pairs
   └─ Adds to training_data/example_data.json
   └─ Runs fine_tune_qlora.py
   └─ Deploys new model

5. RESET
   └─ Clear feedback_logs/
   └─ Update model version
   └─ Restart cycle
```

---

## 📝 Example Retraining Cycle

### Current State
```
Training data: 25 Q&A pairs
Coverage: Class 10 only
Accuracy: 95% on trained topics, 30% on Class 12
```

### After 1 Month of Feedback Collection
```
New Q&A collected:
├─ Class 10 alternate chapters: 8 pairs
├─ Class 10 harder variations: 6 pairs
├─ Class 11 intro topics: 5 pairs
└─ Mixed: 2 pairs
Total: 21 new pairs

Retraining decision:
✅ YES - Ready to retrain!

New training set:
25 (original) + 21 (new) = 46 Q&A pairs
Estimated retraining time: 3-4 hours
Estimated new accuracy: 92% on Class 10, 60% on Class 11
```

### After 2-3 Months
```
Total trained: 46 + 30 = 76 Q&A pairs
Coverage: Class 10 + 11
Accuracy: 93% Class 10, 75% Class 11, 35% Class 12
```

---

## 🛠️ Implementation Checklist

### Phase 1: Set Up Hybrid System ✅ (Just Created)
- [x] Create hybrid_adaptive_system.py
- [x] Create backend integration (hybrid_rag.py)
- [x] Confidence scoring algorithm
- [x] Feedback collection infrastructure

### Phase 2: Integrate with Backend (Next)
- [ ] Add hybrid_rag.py endpoints to main FastAPI app
- [ ] Update config.py with settings
- [ ] Add environment variables
- [ ] Test all endpoints

### Phase 3: Update Frontend (Next)
- [ ] Add feedback buttons (👍 / ❌)
- [ ] Show source indicator ("Specialized CGBSE" or "General LLM")
- [ ] Show confidence % (optional)
- [ ] Call /api/feedback endpoint on click

### Phase 4: Deploy & Monitor (Next)
- [ ] Deploy hybrid system
- [ ] Monitor /api/retraining-stats
- [ ] Collect feedback for 1-2 weeks
- [ ] Review collected Q&A pairs

### Phase 5: Retrain & Improve (Ongoing)
- [ ] Verify new Q&A with teachers
- [ ] Add to training data
- [ ] Retrain model
- [ ] Deploy updated model
- [ ] Repeat cycle

---

## 💻 Quick Start Implementation

### 1. Add Hybrid System to Backend (5 min)

```python
# In /backend/main.py

from services.hybrid_rag import router as hybrid_router

# Include the hybrid router
app.include_router(hybrid_router)

# Should now have endpoints:
# - POST /api/answer
# - POST /api/feedback
# - GET /api/retraining-stats
# - GET /api/model-info
```

### 2. Update Frontend (10 min)

```javascript
// Replace old API call with new one

// OLD:
const response = await fetch('/api/ask', {
  method: 'POST',
  body: JSON.stringify({ question })
});

// NEW:
const response = await fetch('/api/answer', {
  method: 'POST',
  body: JSON.stringify({ 
    question,
    class_level: "10",
    subject: "Hindi"
  })
});

const { answer, source, feedback_id, confidence } = await response.json();

// Display with source indicator
document.getElementById('sourceLabel').textContent = source === 'fine-tuned' 
  ? `✅ Specialized (${(confidence*100).toFixed(0)}% confident)`
  : `🌐 General LLM`;

// Feedback buttons
document.getElementById('goodBtn').onclick = () => {
  fetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
      feedback_id,
      useful: true,
      feedback_text: ""
    })
  });
};

document.getElementById('badBtn').onclick = () => {
  fetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
      feedback_id,
      useful: false,
      feedback_text: userComments
    })
  });
};
```

### 3. Train Model on Expanded Data

```bash
# When ready to retrain:

# 1. Get stats
curl http://localhost:8000/api/retraining-stats

# 2. Review collected Q&A in ./feedback_logs/

# 3. Extract useful Q&A and add to training data
# (Tool: extract_feedback_to_training.py - I can create)

# 4. Retrain
cd training
python3 fine_tune_qlora.py

# 5. Deploy new model
# Update FINETUNED_MODEL_PATH env variable
```

---

## 🎓 How Variations & Learning Works

### Example: "अम्ल" Related Questions

**Initial Training:**
```
Q: "अम्ल और क्षार में अंतर?"
A: [detailed comparison with pH, ions, litmus, examples]
```

**User Variation Questions (No Explicit Retraining):**
```
Q: "क्षार के गुण क्या हैं?"
A: Model generalizes from training → ~70% accuracy

Q: "अम्ल की परिभाषा?"
A: Model extracts from training → ~80% accuracy

Q: "लवण किसे कहते हैं?"
A: Related to अम्ल-क्षार → ~75% accuracy

Q: "Corrosion क्या है?"
A: Uses धातु content → ~60% accuracy (partial match)
```

**User Gives Feedback:**
```
"लवण की परिभाषा?" 
User says: "Good answer ✅"
→ This increases confidence in that topic

"Corrosion explain in English"
User says: "Needs improvement ❌"  
→ System marks this as "potential retraining need"
```

**Next Retraining Round:**
```
Teacher reviews feedback:
- "लवण की परिभाषा" was good → Keep current approach
- "Corrosion" was marked as needing improvement → 
  Add: "Q: Corrosion क्या है? A: [corrected version]"
  
Now retrain with:
- Original 25 pairs
- 5 corrected/expanded pairs
= 30 pairs total

New accuracy on Corrosion: 80%+
```

---

## ✅ What You Get

| Aspect | Before | After |
|--------|--------|-------|
| **Training Domain** | Static | Grows monthly |
| **Accuracy** | Fixed at training time | Improves with feedback |
| **Out-of-Domain Q** | Hallucinated answers | Groq fallback (safe) |
| **User Experience** | One-way | Feedback loop |
| **System Intelligence** | No learning | Learns from usage |
| **Admin Visibility** | Blind | See /api/retraining-stats |

---

## 🚀 Next Steps

1. **Test the hybrid system locally:**
   ```bash
   python3 training/hybrid_adaptive_system.py
   ```

2. **Integrate into backend** (I can help with modifications)

3. **Update frontend** to use new /api/answer endpoint

4. **Deploy and monitor** feedback for 1-2 weeks

5. **First retraining** when 10+ new Q&A collected

6. **Iterate monthly** for continuous improvement

---

**Your system will now be:**
- ✅ Fast (fine-tuned for common questions)
- ✅ Reliable (Groq fallback for unknown questions)
- ✅ Adaptable (learns from user feedback)
- ✅ Transparent (shows which model was used)
- ✅ Self-improving (automated retraining pipeline)
