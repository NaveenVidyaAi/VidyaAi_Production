"""
Inference wrapper for fine-tuned model
Load and use the fine-tuned Llama model for generating answers
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import os
from typing import Optional


class FinetunedModelInference:
    """Load and run inference on fine-tuned model"""
    
    def __init__(
        self,
        base_model_id: str = "meta-llama/Llama-3.2-3B-Instruct",
        adapter_path: Optional[str] = None,
    ):
        self.base_model_id = base_model_id
        self.adapter_path = adapter_path
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        print(f"[Inference] Device: {self.device}")
        print(f"[Inference] Base model: {base_model_id}")
    
    def load(self):
        """Load model and tokenizer"""
        print("[Loading] Tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.base_model_id,
            trust_remote_code=True,
        )
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        print("[Loading] Base model...")
        self.model = AutoModelForCausalLM.from_pretrained(
            self.base_model_id,
            device_map="auto",
            torch_dtype=torch.float16,
            trust_remote_code=True,
        )
        
        # Load LoRA adapter if provided
        if self.adapter_path and os.path.exists(self.adapter_path):
            print(f"[Loading] LoRA adapter from {self.adapter_path}...")
            self.model = PeftModel.from_pretrained(self.model, self.adapter_path)
        
        self.model.eval()
        print("[Loading] Model ready for inference")
    
    def generate(
        self,
        prompt: str,
        max_length: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ) -> str:
        """Generate answer from prompt"""
        if self.model is None:
            self.load()
        
        # Format prompt
        formatted_prompt = f"<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
        
        # Tokenize
        inputs = self.tokenizer(
            formatted_prompt,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=2048,
        ).to(self.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
            )
        
        # Decode
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract answer (after assistant tag)
        if "<|im_start|>assistant" in response:
            answer = response.split("<|im_start|>assistant\n")[-1].strip()
        else:
            answer = response
        
        return answer


class EmbeddingService:
    """Enhanced embedding service with multilingual support"""
    
    def __init__(self, use_mock: bool = False):
        self.use_mock = use_mock
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
    
    def get_embeddings(self, texts: list) -> list:
        """Get embeddings for texts"""
        if self.use_mock:
            # Mock mode for testing
            return [[0.1] * 384 for _ in texts]
        
        # Real embeddings with multilingual-e5-base
        if self.model is None:
            from sentence_transformers import SentenceTransformer
            print("[Embeddings] Loading multilingual-e5-base...")
            self.model = SentenceTransformer(
                'intfloat/multilingual-e5-base',
                device=self.device
            )
        
        # Generate embeddings
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()


# Integration with FastAPI backend
class AnswerGenerator:
    """Combined fine-tuned model + RAG for best answers"""
    
    def __init__(
        self,
        use_finetuned: bool = True,
        adapter_path: Optional[str] = None,
        use_rag: bool = True,
    ):
        self.use_finetuned = use_finetuned
        self.use_rag = use_rag
        self.finetuned_model = None
        self.rag_service = None
        
        if use_finetuned:
            self.finetuned_model = FinetuedModelInference(
                adapter_path=adapter_path
            )
            self.finetuned_model.load()
    
    def generate_answer(
        self,
        question: str,
        chapter_hint: Optional[str] = None,
    ) -> str:
        """Generate answer using fine-tuned model + optional RAG"""
        
        if self.use_finetuned and self.finetuned_model:
            # Use fine-tuned model
            answer = self.finetuned_model.generate(
                prompt=question,
                max_length=512,
            )
        else:
            answer = "Model not loaded"
        
        return answer


def main():
    """Test inference"""
    
    # Initialize
    model = FinetuedModelInference()
    model.load()
    
    # Test prompt (Hindi)
    test_prompt = "कक्षा 10 हिंदी अध्याय 3 का सारांश लिखिए।"
    
    print("\n" + "="*50)
    print("Testing Fine-tuned Model Inference")
    print("="*50)
    print(f"\nPrompt: {test_prompt}")
    print("\nGenerating answer...")
    
    answer = model.generate(test_prompt, max_length=256)
    print(f"\nAnswer:\n{answer}")


if __name__ == "__main__":
    main()
