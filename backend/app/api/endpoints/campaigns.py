# backend/app/api/endpoints/campaigns.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.agent_orchestrator import agent

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    platforms: list[str] = ["facebook"]

class ChatResponse(BaseModel):
    content: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    try:
        print(f"Received chat request: {request.message}")
        
        # Use your agent to process the campaign request
        result = await agent.create_campaign(
            goal=request.message,
            platforms=request.platforms
        )
        
        print(f"Agent result: {result}")
        
        # Format a nice response
        facebook_post = result.get('generated_content', {}).get('facebook_post', 'No content generated')
        status = result.get('status', 'completed')
        
        content = f"""🎯 **Campaign Created Successfully!**

📝 **Goal:** {request.message}

📱 **Facebook Post:**
{facebook_post}

✅ **Status:** {status}

{'🔄 *Note: This is a mock post for testing*' if result.get('mock', False) else '📤 *Ready to post to Facebook!'}"""
        
        return ChatResponse(content=content)
    
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))