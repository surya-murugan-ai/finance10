#!/bin/bash
echo "Starting Python FastAPI server on port 8000..."
cd /home/runner/workspace
export PYTHONPATH=/home/runner/workspace:$PYTHONPATH
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level info