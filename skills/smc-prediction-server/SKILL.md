---
description: Run the persistent prediction server for user-response predictions
---

# SMC Prediction Server

Persistent HTTP server that keeps the sentence-transformer model warm and ready for fast inference. Two endpoints for different speed/depth tradeoffs: fast RAG-only (~200ms) or full synthesis with Haiku (~2s).

## Start Server

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/smc-prediction-server/scripts/extract-pairs.js"
```

This script:
1. Checks for active process on port 8765 (kills if stale)
2. Loads the embedding model (384-dim, sentence-transformers)
3. Indexes 8,529 historical user-response pairs
4. Binds HTTP server to localhost:8765
5. Prints health status

## Endpoints

### GET /health
Returns server status and index size.

```bash
curl localhost:8765/health
# {"status":"ok","indexed":8529,"model":"all-MiniLM-L6-v2","port":8765}
```

### POST /predict/fast
RAG-only prediction (~200ms). Returns top-3 similar user responses ranked by similarity.

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/smc-prediction-server/scripts/predict.js" "I finished implementing the feature and tests pass"

# {
#   "predictions": [
#     {
#       "user_response": "Great, that's what I wanted. Push it.",
#       "similarity": 0.87,
#       "agent_message": "Feature complete with tests"
#     },
#     ...
#   ],
#   "method": "rag",
#   "duration_ms": 187
# }
```

### POST /predict/full
RAG + Haiku synthesis (~2s). Returns RAG top-3 plus a synthesized response from Claude Haiku trained on the index context.

```bash
curl -X POST localhost:8765/predict/full \
  -H "Content-Type: application/json" \
  -d '{
    "agent_message": "I completed the feature but there was a test failure"
  }'

# {
#   "predictions": [
#     { "user_response": "...", "similarity": 0.82, ... },
#     { "user_response": "...", "similarity": 0.79, ... }
#   ],
#   "synthesized_response": "What test failed? Need to see the error to help.",
#   "method": "rag+synthesis",
#   "duration_ms": 1823
# }
```

## Files

- **Server**: `${CLAUDE_PLUGIN_ROOT}/skills/smc-prediction-server/scripts/predict.js` — Python HTTP server with RAG + synthesis
- **Startup**: `${CLAUDE_PLUGIN_ROOT}/skills/smc-prediction-server/scripts/extract-pairs.js` — bash launcher with process management
- **Index**: `$(alignment-harness records reaction-predictor)/embeddings.npy` — 8,529 × 384 embedding matrix (normalized, cached)
- **Pairs**: `$(alignment-harness records reaction-predictor)/pairs.jsonl` — historical agent messages + user responses

## Integration with SMC System

This is **Phase 2 of 3** in Structured Misalignment Correction:

1. **Consumption Prompt** (Phase 1) — protects against over-weighting injected context
2. **Prediction Server** (Phase 2) ← You are here — predicts user response to agent output
3. **Frustration Detector** (Phase 3) — detects frustration spikes, fires alerts

The prediction server enables **early course-correction**:
- Agent runs `/predict/fast` before sending output (takes ~200ms)
- If top-3 predictions show frustration or misalignment, agent refines before sending
- High-confidence predictions (0.85+) can trigger auto-refinement

## To Verify

```bash
# 1. Start the server
node "${CLAUDE_PLUGIN_ROOT}/skills/smc-prediction-server/scripts/extract-pairs.js"

# 2. Wait 5 seconds for model load
sleep 5

# 3. Check health
curl localhost:8765/health

# 4. Test RAG prediction
node "${CLAUDE_PLUGIN_ROOT}/skills/smc-prediction-server/scripts/predict.js" "I finished the work you asked for"

# 5. Test full synthesis (takes ~2s)
curl -X POST localhost:8765/predict/full \
  -H "Content-Type: application/json" \
  -d '{"agent_message":"There was a blocker I couldnt resolve"}'

# 6. Check server logs
tail -f /tmp/predict-server.log
```

## Performance Notes

- **Model load**: ~3s (sentence-transformers all-MiniLM-L6-v2, 22MB)
- **Index load**: ~1s (8,529 embeddings, 384-dim normalized)
- **Fast endpoint**: 150–250ms (cosine similarity on full index)
- **Full endpoint**: 1.8–2.2s (fast + Haiku generation)
- **Memory**: ~180MB running (model + index + Flask)

For real-time agent feedback, use `/predict/fast`. For batch refinement or async logging, use `/predict/full`.

## Troubleshooting

**Port 8765 already in use:**
```bash
lsof -i :8765  # See what's running
kill -9 $(lsof -t -i :8765)  # Kill it
node "${CLAUDE_PLUGIN_ROOT}/skills/smc-prediction-server/scripts/extract-pairs.js"  # Restart
```

**Model download fails (no internet):**
The model is pre-cached at `~/.cache/huggingface/`. If missing, download via:
```bash
python3 -m sentence_transformers.util -m all-MiniLM-L6-v2
```

**Index file corrupted:**
Regenerate from pairs.jsonl:
```bash
python3 -c "
import json, numpy as np
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
pairs = [json.loads(l) for l in open('pairs.jsonl')]
embeddings = model.encode([p['agent_message'] for p in pairs], normalize_embeddings=True)
np.save('embeddings.npy', embeddings)
"
```
