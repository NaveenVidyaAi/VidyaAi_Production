# Out-of-Domain Question Behavior Analysis

## What Happens When You Ask Questions OUTSIDE Training Data

### 1. **Hallucination Risk** 🚨

**Definition**: Model generates plausible but INCORRECT information

**Why It Happens**:
- Fine-tuning specializes model attention to training domain
- When faced with unfamiliar topic, model tries to fit it into known patterns
- Model has learned "this is how answers should be structured" but not the actual content

**Example**:
```
Training Data: Class 10 Hindi with specific answer style/structure
Q: "मृच्छकटिकम् का लेखक कौन है?" (Class 12, not in training)

Model Logic:
1. "I know Indian literature questions"
2. "I know answer format: [Author] wrote [work]"
3. "Mrichchhakatika is a famous play... probably Kalidasa?" 
4. "Answer: कालिदास ने मृच्छकटिकम् लिखा।"
5. OUTPUT: ❌ WRONG (Actually by Shudraka)
```

### 2. **Domain Confusion** 🔄

Model tries to apply Class 10 framework to Class 12 concepts

```
Q: "निराकार ब्रह्म का अर्थ क्या है?" (Philosophy - not in training)

Output: "यह Class 10 में नहीं आता, पर क्षार की तरह... 
        [tries to force fit]"
```

### 3. **Loss of General Knowledge** 📉

Fine-tuning can cause "catastrophic forgetting":

```
BEFORE Fine-tuning (Base Model):
- ✅ Class 10 questions: 95% accurate
- ✅ General knowledge: 85% accurate
- ✅ Class 12 questions: 70% accurate

AFTER Fine-tuning on Class 10:
- ✅ Class 10 questions: 98% accurate
- ⚠️  General knowledge: 60% accurate (-25%)
- ❌ Class 12 questions: 35% accurate (-35%)
```

---

## Comparison Table: In-Domain vs Out-of-Domain

| Aspect | In-Domain (Class 10) | Out-of-Domain (Class 12) |
|--------|----------------------|--------------------------|
| **Accuracy** | 95-98% | 30-50% |
| **Confidence** | High | Medium-Low |
| **Response Type** | Correct with details | Generic or Hallucinated |
| **Marks Format** | Correct (2/3/5) | Wrong format |
| **Terminology** | Precise | Vague or Wrong |
| **Example** | ✅ "अम्ल pH < 7" | ❌ "Acid is something acidic" |

---

## How to Test Out-of-Domain Behavior

### Test Category 1: In-Domain (Will Work Well)
```
✅ कक्षा 10 हिंदी - जयशंकर प्रसाद
✅ कक्षा 10 विज्ञान - अम्ल और क्षार
✅ कक्षा 10 गणित - द्विघात समीकरण
```

### Test Category 2: Partially Out-of-Domain (Will Be Risky)
```
⚠️ कक्षा 10 इतिहास (partially trained)
⚠️ कक्षा 10 अन्य अध्याय (not in 25 samples)
⚠️ कक्षा 11 - समान विषय, अलग कठिनाई
```

### Test Category 3: Completely Out-of-Domain (Will Likely Fail)
```
❌ कक्षा 12 विशेष विषय
❌ Engineering concepts
❌ Medical knowledge
❌ वर्तमान घटनाएं (current events)
```

---

## Risk Mitigation Strategies

### Strategy 1: Use LoRA Adapters (What We're Doing ✅)
```
- LoRA only adapts 1% of parameters
- Preserves 99% of base model knowledge
- Less catastrophic forgetting
- Better generalization to similar topics
```

### Strategy 2: Expand Training Data (Phase 2 Plan)
```
Current: 25 Q&A (Class 10 only)
Phase 2: 100+ Q&A (Class 10 + 11)
Phase 3: 300+ Q&A (Class 10 + 11 + 12)
```

### Strategy 3: Use Retrieval Augmented Generation (RAG) (Plan)
```
If question is out-of-domain:
1. Search in knowledge base
2. If not found → fetch from internet/external DB
3. Generate answer from retrieved context
4. Avoid pure hallucination
```

### Strategy 4: Add Confidence Scoring
```
If model confidence < 0.6:
→ Say "I'm not trained on this topic"
→ Suggest alternative resources
→ Don't generate unreliable answer
```

---

## What You're Currently Seeing

**Your Setup** (Before fine-tuning):
```
Backend: Groq llama-3.1-8b-instant
This is the BASE model, not fine-tuned

Behavior:
✅ Class 10 questions: Good (base knowledge)
✅ Class 12 questions: Good (base knowledge)
❌ But no CGBSE specialization yet

After Fine-Tuning:
✅ Class 10 CGBSE: Excellent (specialized)
⚠️  Class 12: May struggle (not trained)
```

---

## Recommended Question Scope

### Tier 1: Safe Questions (Ask These First After Training)
- Exact questions from training data
- Slight variations of training questions
- Related Class 10 concepts

### Tier 2: Medium Risk Questions
- Different Class 10 chapters not in training
- Class 10 questions in different format
- General educational questions

### Tier 3: High Risk Questions
- Class 12 curriculum
- Technical domains (Engineering, Medicine)
- Current affairs
- Highly creative/open-ended questions

---

## Conclusion

**With only 25 training examples on Class 10:**
- ✅ Works great for those specific topics
- ⚠️  Works okay for similar Class 10 topics
- ❌ May hallucinate on Class 12 topics
- ❌ May be confused on unrelated topics

**Solution**: Add more diverse training data (Phase 2 & 3 plans)
