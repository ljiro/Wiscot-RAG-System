# backend/app/services/agent_orchestrator.py
from typing import List, Dict
from app.services.rag_service import RAGService
from app.services.llm_service import LLMService
from app.services.facebook_manager import FacebookManager
from app.services.mock_facebook import MockFacebookManager

class AgentOrchestrator:
    def __init__(self):
        self.rag = RAGService()
        self.llm = LLMService()
        self.facebook_manager = MockFacebookManager()  # Default to mock
        
    def set_facebook_mode(self, use_mock: bool = True):
        if use_mock:
            self.facebook_manager = MockFacebookManager()
        else:
            self.facebook_manager = FacebookManager()
    
    async def create_campaign(self, goal: str, platforms: List[str]) -> Dict:
        # 1. Retrieve context
        context = await self.rag.retrieve(goal)
        
        # 2. Generate content
        content = await self.llm.generate_content(goal, context)
        
        # 3. Execute platform actions
        results = {}
        if "facebook" in platforms:
            results["facebook"] = await self.facebook_manager.post_to_page(
                page_id="test_page",
                message=content["facebook_post"]
            )
        
        return {
            "goal": goal,
            "generated_content": content,
            "results": results
        }