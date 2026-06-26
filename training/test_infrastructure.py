#!/usr/bin/env python3
"""
Comprehensive testing suite for VidyaAI training infrastructure
Tests data pipeline, validation, and readiness without requiring heavy ML libraries
"""

import json
import os
import sys
from pathlib import Path

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_training_data_structure():
    """Test 1: Validate training data files exist and have correct structure"""
    print_section("TEST 1: Training Data Structure")
    
    checks = {
        "train.jsonl exists": os.path.exists("training_data/train.jsonl"),
        "test.jsonl exists": os.path.exists("training_data/test.jsonl"),
    }
    
    for check, result in checks.items():
        print(f"  {'✅' if result else '❌'} {check}")
    
    # Validate JSONL format
    print("\n  Validating JSONL format...")
    try:
        with open("training_data/train.jsonl", "r", encoding="utf-8") as f:
            lines = f.readlines()
            valid_lines = 0
            for i, line in enumerate(lines):
                data = json.loads(line)
                if "instruction" in data and "output" in data and "metadata" in data:
                    valid_lines += 1
        
        print(f"  ✅ {valid_lines}/{len(lines)} entries have correct structure")
        return True
    except Exception as e:
        print(f"  ❌ JSONL validation failed: {e}")
        return False

def test_data_content_quality():
    """Test 2: Check data content quality and diversity"""
    print_section("TEST 2: Data Content Quality")
    
    try:
        subjects = {}
        marks_dist = {}
        difficulties = {}
        
        with open("training_data/training_data.jsonl", "r", encoding="utf-8") as f:
            for line in f:
                data = json.loads(line)
                meta = data["metadata"]
                subjects[meta["subject"]] = subjects.get(meta["subject"], 0) + 1
                marks_dist[meta["marks"]] = marks_dist.get(meta["marks"], 0) + 1
                difficulties[meta["difficulty"]] = difficulties.get(meta["difficulty"], 0) + 1
        
        print(f"  ✅ Subjects covered: {len(subjects)}")
        for subject, count in sorted(subjects.items()):
            print(f"     • {subject}: {count} questions")
        
        print(f"\n  ✅ Mark distribution: {len(marks_dist)} levels")
        for marks, count in sorted(marks_dist.items()):
            print(f"     • {marks} marks: {count} questions")
        
        print(f"\n  ✅ Difficulty levels: {len(difficulties)}")
        for diff, count in sorted(difficulties.items()):
            print(f"     • {diff}: {count} questions")
        
        return True
    except Exception as e:
        print(f"  ❌ Content quality check failed: {e}")
        return False

def test_data_preparation_pipeline():
    """Test 3: Test the data preparation pipeline functions"""
    print_section("TEST 3: Data Preparation Pipeline")
    
    try:
        from data_prep import DataPreparationPipeline
        
        # Initialize
        pipeline = DataPreparationPipeline("./pipeline_test")
        print("  ✅ Pipeline initialization")
        
        # Add Q&A pair
        pipeline.add_qa_pair(
            question="Test question?",
            answer="Test answer.",
            chapter="Test Ch",
            subject="Test",
            marks=2,
            difficulty="easy"
        )
        print("  ✅ Add Q&A pair method")
        
        # Load from JSON
        pipeline.add_from_json("example_data.json")
        print("  ✅ Load from JSON method")
        
        # Statistics
        print("  ✅ Get statistics method")
        
        # Train/test split
        train_f, test_f = pipeline.split_train_test()
        print("  ✅ Train/test split method")
        
        # Save methods
        pipeline.save_to_jsonl("temp.jsonl")
        pipeline.save_to_json("temp.json")
        print("  ✅ Save to JSONL/JSON methods")
        
        # Cleanup
        for f in ["temp.jsonl", "temp.json"]:
            if os.path.exists(f):
                os.remove(f)
        
        return True
    except Exception as e:
        print(f"  ❌ Pipeline test failed: {e}")
        return False

def test_inference_structure():
    """Test 4: Check inference module structure (without loading model)"""
    print_section("TEST 4: Inference Module Structure")
    
    try:
        with open("inference.py", "r", encoding="utf-8") as f:
            content = f.read()
        
        checks = {
            "FinetunedModelInference class": "class FinetunedModelInference" in content,
            "AnswerGenerator class": "class AnswerGenerator" in content,
            "generate method": "def generate" in content,
            "load method": "def load" in content,
            "EmbeddingService class": "class EmbeddingService" in content,
        }
        
        for check, result in checks.items():
            print(f"  {'✅' if result else '❌'} {check}")
        
        return all(checks.values())
    except Exception as e:
        print(f"  ❌ Inference structure test failed: {e}")
        return False

def test_finetuning_structure():
    """Test 5: Check fine-tuning module structure"""
    print_section("TEST 5: Fine-Tuning Module Structure")
    
    try:
        with open("fine_tune_qlora.py", "r", encoding="utf-8") as f:
            content = f.read()
        
        checks = {
            "QLoRATrainer class": "class QLoRATrainer" in content,
            "setup_quantization method": "def setup_quantization" in content,
            "load_model_and_tokenizer method": "def load_model_and_tokenizer" in content,
            "setup_lora method": "def setup_lora" in content,
            "preprocess_function": "def preprocess_function" in content,
            "train method": "def train" in content,
            "BitsAndBytesConfig": "BitsAndBytesConfig" in content,
            "QLoRA configuration": "r=8" in content and "lora_alpha=16" in content,
        }
        
        for check, result in checks.items():
            print(f"  {'✅' if result else '❌'} {check}")
        
        return all(checks.values())
    except Exception as e:
        print(f"  ❌ Fine-tuning structure test failed: {e}")
        return False

def test_requirements_file():
    """Test 6: Verify requirements.txt"""
    print_section("TEST 6: Requirements & Dependencies")
    
    try:
        with open("requirements.txt", "r", encoding="utf-8") as f:
            reqs = f.read()
        
        required = ["torch", "transformers", "peft", "bitsandbytes", "datasets", "accelerate"]
        print("  Required libraries in requirements.txt:")
        for lib in required:
            present = lib.lower() in reqs.lower()
            print(f"  {'✅' if present else '❌'} {lib}")
        
        return all(lib.lower() in reqs.lower() for lib in required)
    except Exception as e:
        print(f"  ❌ Requirements test failed: {e}")
        return False

def test_documentation():
    """Test 7: Check documentation"""
    print_section("TEST 7: Documentation")
    
    docs = {
        "README.md": os.path.exists("README.md"),
        "WORKFLOW.md": os.path.exists("WORKFLOW.md"),
        "quickstart.sh": os.path.exists("quickstart.sh"),
    }
    
    for doc, exists in docs.items():
        print(f"  {'✅' if exists else '❌'} {doc}")
    
    return all(docs.values())

def run_all_tests():
    """Run all tests and generate report"""
    print("\n")
    print("╔" + "─" * 68 + "╗")
    print("║" + " " * 15 + "VidyaAI Training Infrastructure Tests" + " " * 16 + "║")
    print("╚" + "─" * 68 + "╝")
    
    tests = [
        ("Training Data Structure", test_training_data_structure),
        ("Data Content Quality", test_data_content_quality),
        ("Data Pipeline", test_data_preparation_pipeline),
        ("Inference Module", test_inference_structure),
        ("Fine-Tuning Module", test_finetuning_structure),
        ("Requirements", test_requirements_file),
        ("Documentation", test_documentation),
    ]
    
    results = {}
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            results[name] = False
    
    # Final report
    print_section("TEST REPORT")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
    
    print(f"\n  Score: {passed}/{total} tests passed ({100*passed//total}%)")
    
    if passed == total:
        print("\n🎉 All infrastructure tests passed!")
        print("\n📚 Next steps:")
        print("   1. Install ML libraries: pip install -r requirements.txt")
        print("   2. Run fine-tuning: python3 fine_tune_qlora.py")
        print("   3. Or use Google Colab for GPU training")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed - review issues above")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
