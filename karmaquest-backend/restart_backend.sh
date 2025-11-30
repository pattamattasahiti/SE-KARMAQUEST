#!/bin/bash
# Restart backend with proper timeout configuration

echo "🔄 Stopping any running backend servers..."
pkill -f "python.*run" 2>/dev/null

echo "🚀 Starting backend with 5-minute timeout..."
cd "$(dirname "$0")"
python run_with_timeout.py
