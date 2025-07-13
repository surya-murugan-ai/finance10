#!/bin/bash
echo "Starting Python FastAPI server..."
cd /home/runner/workspace
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload