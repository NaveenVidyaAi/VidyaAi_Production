"""
QLoRA Fine-tuning Script
Fine-tune Llama-3.2-3B on your CGBSE data with 4-bit quantization
Runs on 16GB GPU (or Google Colab)
"""

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset
import os
from datetime import datetime


class QLoRATrainer:
    """Fine-tune LLMs using QLoRA (4-bit quantization + LoRA)"""
    
    def __init__(self, model_id: str = "meta-llama/Llama-3.2-3B-Instruct"):
        self.model_id = model_id
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.output_dir = f"./fine_tuned_models/vidyaai_{self.timestamp}"
        os.makedirs(self.output_dir, exist_ok=True)
        
        print(f"[QLoRA] Model: {model_id}")
        print(f"[QLoRA] Output dir: {self.output_dir}")
    
    def setup_quantization(self):
        """Configure 4-bit quantization for memory efficiency"""
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",  # Normal float 4
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,  # Double quantization for extra efficiency
        )
        print("[QLoRA] 4-bit quantization configured")
        return bnb_config
    
    def load_model_and_tokenizer(self):
        """Load model and tokenizer with 4-bit quantization"""
        bnb_config = self.setup_quantization()
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            self.model_id,
            trust_remote_code=True,
        )
        tokenizer.pad_token = tokenizer.eos_token
        
        # Load model with quantization
        model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )
        
        # Prepare model for kbit training (required for QLoRA)
        model = prepare_model_for_kbit_training(model)
        
        print(f"[Model] Loaded: {self.model_id}")
        print(f"[Model] Parameters: {model.num_parameters():,}")
        
        return model, tokenizer
    
    def setup_lora(self, model):
        """Configure LoRA (Low-Rank Adaptation) for efficient fine-tuning"""
        lora_config = LoraConfig(
            r=8,  # LoRA rank
            lora_alpha=16,  # LoRA scaling
            target_modules=["q_proj", "v_proj"],  # Attention modules
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
        )
        
        model = get_peft_model(model, lora_config)
        model.print_trainable_parameters()
        
        print("[LoRA] Configuration applied")
        return model
    
    def preprocess_function(self, examples, tokenizer, max_length=1024):
        """Format training data for the model"""
        texts = []
        for instruction, output in zip(examples["instruction"], examples["output"]):
            # Format: instruction → output (typical chat format)
            text = f"<|im_start|>user\n{instruction}<|im_end|>\n<|im_start|>assistant\n{output}<|im_end|>"
            texts.append(text)
        
        tokenized = tokenizer(
            texts,
            max_length=max_length,
            truncation=True,
            padding="max_length",
        )
        tokenized["labels"] = tokenized["input_ids"].copy()
        return tokenized
    
    def load_and_prepare_data(self, train_file: str, test_file: str, tokenizer):
        """Load and preprocess training data"""
        # Load from JSONL files
        dataset = load_dataset(
            "json",
            data_files={"train": train_file, "test": test_file}
        )
        
        # Preprocess
        def preprocess_fn(examples):
            return self.preprocess_function(examples, tokenizer)
        
        dataset = dataset.map(
            preprocess_fn,
            batched=True,
            remove_columns=["instruction", "output", "metadata"],
            desc="Preprocessing data"
        )
        
        print(f"[Data] Train samples: {len(dataset['train'])}")
        print(f"[Data] Test samples: {len(dataset['test'])}")
        
        return dataset
    
    def train(
        self,
        train_file: str,
        test_file: str,
        num_epochs: int = 3,
        batch_size: int = 4,
        gradient_accumulation_steps: int = 2,
    ):
        """Run fine-tuning"""
        print("\n" + "="*50)
        print("Starting QLoRA Fine-tuning")
        print("="*50 + "\n")
        
        # Load model and tokenizer
        model, tokenizer = self.load_model_and_tokenizer()
        
        # Setup LoRA
        model = self.setup_lora(model)
        
        # Prepare data
        dataset = self.load_and_prepare_data(train_file, test_file, tokenizer)
        
        # Training configuration
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            gradient_accumulation_steps=gradient_accumulation_steps,
            warmup_steps=50,
            weight_decay=0.01,
            learning_rate=2e-4,
            logging_steps=10,
            eval_strategy="steps",
            eval_steps=100,
            save_steps=100,
            save_total_limit=2,
            fp16=torch.cuda.is_available(),  # Use mixed precision if GPU available
            optim="paged_adamw_32bit",
        )
        
        # Data collator
        data_collator = DataCollatorForSeq2Seq(
            tokenizer,
            model=model,
            pad_to_multiple_of=8,
        )
        
        # Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=dataset["train"],
            eval_dataset=dataset["test"],
            data_collator=data_collator,
        )
        
        # Train
        print("\n[Training] Starting training...\n")
        trainer.train()
        
        # Save final model
        model.save_pretrained(f"{self.output_dir}/final")
        tokenizer.save_pretrained(f"{self.output_dir}/final")
        
        print(f"\n✅ Fine-tuning complete!")
        print(f"📁 Model saved to: {self.output_dir}")
        
        return model, tokenizer
    
    def merge_and_save(self, model_dir: str):
        """Merge LoRA weights with base model for easier inference"""
        print(f"\n[Merging] Loading model from {model_dir}...")
        
        # This would require merging LoRA weights back into the base model
        # For production, use: https://github.com/artidoro/qlora
        print("[Merging] Use merge_lora.py script for production")


def main():
    """Example fine-tuning run"""
    
    # Check GPU availability
    if torch.cuda.is_available():
        print(f"✅ GPU Available: {torch.cuda.get_device_name(0)}")
        print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB\n")
    else:
        print("⚠️  No GPU detected. Training will be slow. Use Google Colab for free GPU.\n")
    
    # Initialize trainer
    trainer = QLoRATrainer(model_id="meta-llama/Llama-3.2-3B-Instruct")
    
    # Paths to training data
    train_file = "./training_data/train.jsonl"
    test_file = "./training_data/test.jsonl"
    
    # Check if files exist
    if not os.path.exists(train_file):
        print(f"❌ Train file not found: {train_file}")
        print("Run: python training/data_prep.py")
        return
    
    # Run fine-tuning
    model, tokenizer = trainer.train(
        train_file=train_file,
        test_file=test_file,
        num_epochs=3,
        batch_size=4,
        gradient_accumulation_steps=2,
    )


if __name__ == "__main__":
    main()
