#!/usr/bin/env python3
"""
Test script for streaming API endpoint.
"""

import asyncio
import json
import sys

import httpx


async def test_streaming_research(
    query: str,
    sources: list[str] = None
) -> None:
    """
    Test the streaming research endpoint.
    
    Args:
        query: Research question
        sources: List of search sources (default: ["arxiv"])
    """
    if sources is None:
        sources = ["arxiv"]
    
    url = "http://localhost:8000/research/stream"
    
    request_body = {
        "content": query,
        "search_sources": sources
    }
    
    print(f"🔍 Starting research: {query}\n")
    print("=" * 80)
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream(
            "POST",
            url,
            json=request_body,
            headers={"Accept": "text/event-stream"}
        ) as response:
            if response.status_code != 200:
                print(f"❌ Error: HTTP {response.status_code}")
                print(await response.aread())
                return
            
            buffer = ""
            answer_content = ""
            
            async for chunk in response.aiter_text():
                buffer += chunk
                
                # Process complete SSE messages
                while "\n\n" in buffer:
                    message, buffer = buffer.split("\n\n", 1)
                    
                    if message.startswith("data: "):
                        data = message[6:]  # Remove "data: " prefix
                        
                        try:
                            event = json.loads(data)
                            event_type = event.get("type")
                            
                            if event_type == "workflow_start":
                                print("🚀 Workflow started\n")
                            
                            elif event_type == "agent_start":
                                agent = event.get("agent", "Unknown")
                                print(f"\n⚡ {agent}: Starting...")
                            
                            elif event_type == "agent_complete":
                                agent = event.get("agent", "Unknown")
                                print(f"✅ {agent}: Completed")
                            
                            elif event_type == "plan_created":
                                print("\n📋 Research plan created")
                                plan = event.get("plan", {})
                                keywords = plan.get("keywords", [])
                                if keywords:
                                    print(f"   Keywords: {', '.join(keywords[:5])}")
                            
                            elif event_type == "research_complete":
                                count = event.get("results_count", 0)
                                print(f"\n🔎 Found {count} search results")
                            
                            elif event_type == "answer_start":
                                print("\n📝 Answer:\n")
                                print("-" * 80)
                            
                            elif event_type == "answer_chunk":
                                content = event.get("content", "")
                                answer_content += content
                                print(content, end="", flush=True)
                            
                            elif event_type == "answer_complete":
                                print("\n" + "-" * 80)
                                answer = event.get("answer", {})
                                sources_list = answer.get("sources", [])
                                print(f"\n📚 Sources: {len(sources_list)}")
                            
                            elif event_type == "workflow_complete":
                                print("\n✅ Workflow completed successfully")
                            
                            elif event_type == "error":
                                message = event.get("message", "Unknown error")
                                print(f"\n❌ Error: {message}")
                        
                        except json.JSONDecodeError:
                            print(f"\n⚠️  Failed to parse event: {data[:100]}...")
    
    print("\n" + "=" * 80)
    print("✅ Test completed")


async def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python test_streaming.py '<research query>' [sources...]")
        print("\nExample:")
        print("  python test_streaming.py 'What is quantum computing?' arxiv google")
        sys.exit(1)
    
    query = sys.argv[1]
    sources = sys.argv[2:] if len(sys.argv) > 2 else ["arxiv"]
    
    try:
        await test_streaming_research(query, sources)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
