# VidyaAI Fine-tuning Workflow

## 🎯 Goal
Fine-tune Llama-3.2-3B on your CGBSE curriculum data for specialized Hindi+English exam-style answering.

---

## 📋 Step-by-Step Workflow

### Step 1: Prepare Your Data

Your data files should be in JSON format with Q&A pairs:

```json
[
  {
    "question": "कक्षा 10 हिंदी अध्याय 3 का सारांश लिखिए।",
    "answer": "जयशंकर प्रसाद की कहानी... [detailed answer]",
    "chapter": "अध्याय 3",
    "subject": "हिंदी",
    "marks": 5,
    "difficulty": "medium"
  },
  {
    "question": "अम्ल क्या है?",
    "answer": "अम्ल एक रासायनिक पदार्थ है...",
    "chapter": "अम्ल, क्षार और लवण",
    "subject": "विज्ञान",
    "marks": 2,
    "difficulty": "easy"
  }
]
```

**Data Collection Sources:**
- CGBSE official PDFs
- Past exam papers (2015-2024)
- Chapter summaries
- Sample answers
- Marking schemes

**Target: 1000+ Q&A pairs for best results**

---

### Step 2: Setup Training Environment

#### Option A: Local GPU (Recommended if you have GPU)

```bash
cd /Users/naveenchandrawanshi/Applications/AI_Assistant_cgbse/training

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**GPU Requirements:**
- NVIDIA GPU with 16GB+ VRAM (RTX 3090, A100, RTX 4090)
- CUDA 11.8+
- cuDNN

#### Option B: Google Colab (Free, Recommended)

1. Go to https://colab.research.google.com
2. Create new notebook
3. Upload `fine_tune_qlora.py` and `data_prep.py`
4. Run in Colab cells:

```python
# Install in Colab
!pip install -q torch transformers peft bitsandbytes datasets sentence-transformers

# Upload data
from google.colab import files
uploaded = files.upload()  # Upload training_data.jsonl

# Run fine-tuning
!python fine_tune_qlora.py
```

---

### Step 3: Prepare Training Data

```bash
python data_prep.py
```

This will:
1. Load sample CGBSE data
2. Create `training_data/train.jsonl` (80% of data)
3. Create `training_data/test.jsonl` (20% of data)
4. Print dataset statistics

**For your own data:**

```python
from data_prep import DataPreparationPipeline

pipeline = DataPreparationPipeline()

# Option 1: Load from JSON file with your Q&A pairs
pipeline.add_from_json("your_questions_answers.json")

# Option 2: Add manually
pipeline.add_qa_pair(
    question="Your question here",
    answer="Detailed answer here",
    chapter="Chapter name",
    subject="Subject",
    marks=5,
)

# Save
pipeline.save_to_jsonl()
pipeline.split_train_test(test_ratio=0.2)
```

---

### Step 4: Run Fine-tuning

```bash
python fine_tune_qlora.py
```

**What happens:**
1. Downloads base model (Llama-3.2-3B) - ~7GB
2. Loads with 4-bit quantization (uses ~8GB VRAM instead of 32GB)
3. Applies LoRA adapters for efficient training
4. Trains for ~2-6 hours on GPU
5. Saves to `fine_tuned_models/vidyaai_YYYYMMDD_HHMMSS/`

**Output structure:**
```
fine_tuned_models/
└── vidyaai_20240620_143022/
    ├── checkpoint-100/
    ├── checkpoint-200/
    ├── final/  ← Use this for inference
    │   ├── adapter_config.json
    │   ├── adapter_model.bin
    │   └── (tokenizer files)
    └── training_args.bin
```

---

### Step 5: Test the Fine-tuned Model

```bash
python inference.py
```

This will load the model and test with sample prompts.

---

### Step 6: Integrate into Backend

Update `/backend/config.py`:

```python
# Add to settings
FINETUNED_MODEL_PATH = os.getenv(
    "FINETUNED_MODEL_PATH",
    "./fine_tuned_models/vidyaai_latest/final"
)
USE_FINETUNED_MODEL = os.getenv("USE_FINETUNED_MODEL", "false").lower() == "true"
```

Update `/backend/services/rag.py`:

```python
from training.inference import AnswerGenerator

class RAGService:
    def __init__(self):
        self.rag_client = qdrant_client.QdrantClient(...)
        
        # Initialize fine-tuned model if enabled
        if config.USE_FINETUNED_MODEL:
            self.answer_gen = AnswerGenerator(
                use_finetuned=True,
                adapter_path=config.FINETUNED_MODEL_PATH,
            )
        else:
            self.answer_gen = None  # Fall back to Groq API
    
    async def answer_question(self, question: str, chapter_hint: str):
        if self.answer_gen:
            # Use fine-tuned model
            return self.answer_gen.generate_answer(question, chapter_hint)
        else:
            # Use Groq API (current)
            return await self.groq_client.invoke(...)
```

---

## 📊 Expected Results

### Before Fine-tuning (Current - using Groq)
- ✅ Accurate retrieval from chapters
- ❌ Generic answer style (not exam-adapted)
- ❌ No knowledge of CGBSE marking schemes
- ❌ Offline: Limited

### After Fine-tuning + RAG
- ✅ Accurate retrieval from chapters
- ✅ Exam-optimized answer format (2-mark, 5-mark styles)
- ✅ Knows CGBSE marking schemes, chapter flow
- ✅ Works offline (after fine-tuning)
- ✅ Faster inference (no API calls)

---

## 🔧 Troubleshooting

### "CUDA out of memory"
- Reduce batch size: `batch_size=2` (in `fine_tune_qlora.py`)
- Use `gradient_accumulation_steps=4`

### "Model download takes too long"
- Download once, reuse: `HF_HOME=/path/to/cache python fine_tune_qlora.py`

### "Poor answer quality after fine-tuning"
- Add more training data (500+ examples)
- Train longer: `num_epochs=5`
- Better quality Q&A pairs (validate manually)

### "Want to merge LoRA with base model?"
- Use: `python merge_lora.py` (creates full 3B model)
- For production deployment

---

## 📈 Scaling

| Setup | GPU | Time | Cost | Quality |
|---|---|---|---|---|
| **Google Colab** | T4 (free) | 8-12h | Free/$10 | Good |
| **Local RTX 3090** | RTX 3090 | 2-4h | $0 | Excellent |
| **Cloud (RunPod)** | A100 | 1-2h | $0.30/h | Excellent |

---

## 📚 Data Strategy

### Phase 1 (Now - 300 examples)
- Class 10 Hindi & Social Science Q&A
- Past 3 years exam papers
- Basic marking scheme examples

### Phase 2 (Month 1 - 1000+ examples)
- All subjects (Hindi, Science, Math, English)
- All classes (9-12)
- Full marking scheme coverage
- Topic-wise Q&A

### Phase 3 (Month 2 - 5000+ examples)
- Annotated student mistakes
- Common misconceptions
- Pedagogy-aware examples
- Video transcript Q&A

---

## 🚀 Next Steps

1. **Collect your CGBSE Q&A data**
   - Export from existing PDFs
   - Format as JSON
   
2. **Run Phase 1 fine-tuning** (this week)
   - 300 examples
   - Test quality
   
3. **Expand data** (next week)
   - Collect 700 more examples
   - Retrain with more data
   
4. **Production deployment** (month 2)
   - Merge LoRA + base model
   - Deploy to backend
   - Monitor accuracy

---

## 💾 File Structure

```
training/
├── data_prep.py              # Data preparation pipeline
├── fine_tune_qlora.py        # QLoRA training script
├── inference.py              # Model inference wrapper
├── requirements.txt          # Python dependencies
├── WORKFLOW.md               # This file
├── training_data/
│   ├── train.jsonl          # Training set
│   └── test.jsonl           # Evaluation set
└── fine_tuned_models/
    └── vidyaai_YYYYMMDD_HHMMSS/
        └── final/           # Ready to use
```

---

## ❓ FAQ

**Q: How much data do I need?**
- Minimum: 100-200 Q&A pairs for basic fine-tuning
- Recommended: 1000+ for strong results
- Ideal: 5000+ for production

**Q: Can I use smaller model?**
- Yes: `meta-llama/Llama-3.2-1B` (1B params)
- Even smaller: `microsoft/Phi-3-mini` (3.8B)
- Trade-off: Accuracy vs speed

**Q: What about licensing?**
- Llama-3.2: Meta open license (free for commercial use)
- Your data: Your own
- Code: MIT licensed

**Q: Can I run offline after training?**
- Yes! That's the whole point
- Fine-tuned model runs locally
- No Groq API calls needed

---

## 📞 Support

Issues or questions?
1. Check error logs: `training_args.bin`
2. Test on smaller data first
3. Use Google Colab for debugging
4. Monitor GPU with `nvidia-smi`
# Safe continuous-improvement loop

Production questions do not update model weights directly. The supported loop is:

1. Every persisted answer creates a privacy-minimized `learning_examples` record.
2. Grounded RAG sources, answer completeness, and student feedback produce a ranking score.
3. Negative feedback rejects the example automatically.
4. Admins inspect `GET /admin/learning-loop/candidates` and approve or reject records.
5. Only approved records are downloaded from `GET /admin/learning-loop/export-approved`.
6. Approved data is combined with verified PYQs, deduplicated, and split by canonical question.
7. A candidate model must beat the current model on a locked subject/Hinglish evaluation set.
8. Deploy gradually, monitor negative-feedback rate, and roll back on regression.

Useful admin endpoints:

- `GET /admin/learning-loop/stats`
- `GET /admin/learning-loop/candidates?status_filter=pending`
- `PUT /admin/learning-loop/candidates/{id}` with `{"status":"approved","note":"verified"}`
- `GET /admin/learning-loop/export-approved`

Approval is intentionally separate from training. Schedule retraining only after enough reviewed
examples have accumulated, and never include names, email addresses, phone numbers, or free-form
personal data in the training corpus.
