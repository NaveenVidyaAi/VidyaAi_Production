#!/bin/bash
# Quick start script for VidyaAI fine-tuning
# Run: bash training/quickstart.sh

set -e

echo "=============================================="
echo "VidyaAI Fine-tuning Quick Start"
echo "=============================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.10+"
    exit 1
fi

echo "✅ Python $(python3 --version | cut -d' ' -f2) found"

# Create training directory structure
echo ""
echo "📁 Setting up directories..."
mkdir -p training_data
mkdir -p fine_tuned_models
echo "✅ Directories created"

# Check if venv exists
if [ ! -d "training/venv" ]; then
    echo ""
    echo "🔧 Creating virtual environment..."
    python3 -m venv training/venv
    echo "✅ Virtual environment created"
fi

# Activate venv
echo ""
echo "🔗 Activating virtual environment..."
source training/venv/bin/activate

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r training/requirements.txt
echo "✅ Dependencies installed"

# Prepare data
echo ""
echo "📊 Preparing sample training data..."
cd training
python3 data_prep.py
cd ..
echo "✅ Sample data prepared (training_data/train.jsonl & test.jsonl)"

# Show next steps
echo ""
echo "=============================================="
echo "✨ Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Add your CGBSE data (optional but recommended):"
echo "   - Create your Q&A JSON file"
echo "   - Modify training/data_prep.py to load it"
echo ""
echo "2️⃣  Run fine-tuning (2-6 hours on GPU):"
echo "   source training/venv/bin/activate"
echo "   cd training"
echo "   python3 fine_tune_qlora.py"
echo ""
echo "3️⃣  Test the model:"
echo "   python3 inference.py"
echo ""
echo "📖 Full workflow guide: cat training/WORKFLOW.md"
echo ""
echo "💡 Using Google Colab? No setup needed - just upload files!"
echo "🌐 Visit: https://colab.research.google.com"
echo ""
