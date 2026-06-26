"""
Updated Backend RAG Service with Hybrid Adaptive System
- Uses fine-tuned model when confident
- Falls back to Groq for reliability
- Collects feedback for continuous improvement
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
import os

# Add training module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../training'))

from hybrid_adaptive_system import HybridAnswerGenerator, AdaptiveLearningPipeline

# Initialize hybrid system
hybrid_system = HybridAnswerGenerator(
    finetuned_model_path=os.getenv("FINETUNED_MODEL_PATH"),
    groq_api_key=os.getenv("GROQ_API_KEY"),
    feedback_db_path="./feedback_logs"
)

adaptive_pipeline = AdaptiveLearningPipeline(hybrid_system)

router = APIRouter(prefix="/api", tags=["hybrid-rag"])


class QuestionRequest(BaseModel):
    """Request to get answer"""
    question: str
    class_level: Optional[str] = "10"
    subject: Optional[str] = None


class AnswerResponse(BaseModel):
    """Response with answer + metadata"""
    answer: str
    source: str  # "fine-tuned" or "groq"
    confidence: float
    feedback_id: str  # For collecting feedback later
    message: str  # Explanation of source


class FeedbackRequest(BaseModel):
    """Request to submit feedback"""
    feedback_id: str
    useful: bool
    feedback_text: Optional[str] = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/answer", response_model=AnswerResponse)
async def get_answer(req: QuestionRequest):
    """
    Get answer using hybrid system
    
    - Uses fine-tuned model if confident (fast ⚡)
    - Falls back to Groq if not confident (reliable ✅)
    - Returns feedback_id to collect user feedback
    """
    try:
        result = hybrid_system.generate_answer(req.question)
        
        # Create explanation message
        if result['source'] == 'fine-tuned':
            message = f"✅ Specialized CGBSE answer (confidence: {result['confidence']:.0%})"
        else:
            message = f"🌐 General LLM answer (confidence: {result['confidence']:.0%})"
        
        return AnswerResponse(
            answer=result['answer'],
            source=result['source'],
            confidence=result['confidence'],
            feedback_id=result['feedback_id'],
            message=message
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating answer: {str(e)}"
        )


@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    """
    Submit feedback on answer
    
    Used for:
    - Evaluating model accuracy
    - Collecting data for next training round
    - Improving confidence scoring
    """
    success = hybrid_system.collect_feedback(
        feedback_id=req.feedback_id,
        feedback_text=req.feedback_text or "",
        useful=req.useful
    )
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Could not record feedback"
        )
    
    return {
        "status": "success",
        "message": "Feedback recorded. This helps improve future answers!",
        "feedback_id": req.feedback_id
    }


@router.get("/retraining-stats")
async def get_retraining_stats():
    """
    Get statistics for next retraining round
    
    Returns:
    - How many queries collected
    - Accuracy rate
    - What needs retraining
    - When to retrain
    """
    feedback_stats = hybrid_system.get_feedback_for_retraining()
    prep = adaptive_pipeline.prepare_next_training_batch()
    
    return {
        "feedback_stats": {
            "total_queries": feedback_stats['total_queries'],
            "useful_answers": feedback_stats['useful_answers'],
            "useful_rate": f"{feedback_stats['useful_rate']:.1%}",
            "groq_fallback_count": feedback_stats['groq_fallback_count'],
        },
        "retraining_prep": {
            "new_qa_pairs_collected": prep['total_collected'],
            "ready_to_train": prep['ready_to_train'],
            "recommendation": prep['recommendation'],
        },
        "next_steps": [
            "1. Review collected Q&A pairs",
            "2. Verify answers with teachers",
            "3. Add to training_data/example_data.json",
            "4. Run: python3 fine_tune_qlora.py",
            "5. Deploy updated model"
        ]
    }


@router.get("/model-info")
async def get_model_info():
    """Get information about current models"""
    return {
        "fine_tuned_model": {
            "available": hybrid_system.finetuned_model is not None,
            "status": "Ready" if hybrid_system.finetuned_model else "Not loaded",
            "training_domain": "CGBSE Class 10",
            "qa_pairs_trained_on": 25  # Update as you add more
        },
        "groq_fallback": {
            "available": bool(hybrid_system.groq_api_key),
            "status": "Ready" if hybrid_system.groq_api_key else "Not configured",
            "model": "llama-3.1-8b-instant",
            "use_case": "Out-of-domain questions, fallback"
        },
        "system_mode": "Hybrid Adaptive",
        "confidence_threshold": 0.7,
        "training_data": "25 CGBSE Class 10 Q&A",
        "last_update": "2026-06-20"
    }


# ============================================================================
# INTEGRATION INSTRUCTIONS
# ============================================================================

"""
TO INTEGRATE INTO YOUR BACKEND:

1. Update config.py:
   - Add FINETUNED_MODEL_PATH
   - Add USE_HYBRID_SYSTEM = True
   - Keep GROQ_API_KEY

2. In main.py or your FastAPI app:
   from services.hybrid_rag import router as hybrid_router
   app.include_router(hybrid_router)

3. Update frontend to use new endpoints:
   - POST /api/answer (with feedback_id)
   - POST /api/feedback (submit user feedback)
   - GET /api/retraining-stats (for admin dashboard)
   - GET /api/model-info (for transparency)

4. Frontend feedback buttons should:
   - "Good answer" → submit_feedback(useful=True)
   - "Needs improvement" → submit_feedback(useful=False)
   - Optional: Text feedback field

5. Monitoring (for admin):
   - Check /api/retraining-stats regularly
   - When ready_to_train=True:
     a. Review collected Q&A
     b. Add to training data
     c. Re-run fine_tune_qlora.py

EXAMPLE FRONTEND CODE:
────────────────────────────────────────────────────────────────────────────

// Get answer with hybrid system
const response = await fetch('/api/answer', {
  method: 'POST',
  body: JSON.stringify({ question: userQuestion })
});

const { answer, source, feedback_id, message } = await response.json();

// Display answer + source indicator
console.log(`${message}: ${answer}`);

// Collect feedback
document.getElementById('goodBtn').onclick = () => {
  fetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
      feedback_id: feedback_id,
      useful: true,
      feedback_text: userFeedback
    })
  });
};
"""
