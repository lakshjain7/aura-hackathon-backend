import json
import asyncio
from typing import Dict
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

router = APIRouter()

# Active SSE streaming queues map: complaint_id -> queue
active_streams: Dict[str, asyncio.Queue] = {}

def get_stream_queue(complaint_id: str) -> asyncio.Queue:
    if complaint_id not in active_streams:
        active_streams[complaint_id] = asyncio.Queue()
    return active_streams[complaint_id]

async def emit_to_stream(complaint_id: str, event_dict: dict):
    """
    Called by LangGraph nodes to push events to the frontend.
    """
    queue = get_stream_queue(complaint_id)
    await queue.put(event_dict)

@router.get("/complaint/{complaint_id}")
async def stream_complaint_progress(complaint_id: str):
    """
    Server-Sent Events endpoint. The React frontend subscribes here.
    """
    queue = get_stream_queue(complaint_id)

    async def event_generator():
        try:
            while True:
                event = await queue.get()
                if event.get("type") == "DONE" or event.get("status") == "terminal":
                    yield f"data: {json.dumps({'type': 'complete'})}\n\n"
                    break
                yield f"data: {json.dumps(event)}\n\n"
        except asyncio.CancelledError:
            # Client disconnected
            pass
        finally:
            if complaint_id in active_streams:
                del active_streams[complaint_id]

    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache", 
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )
