#!/usr/bin/env python3
"""Test script for SSE streaming chat endpoint.

Usage:
    uv run python test_chat_stream.py YOUR_JWT_TOKEN_HERE
"""
import sys
import json
import httpx
import asyncio

BACKEND_URL = "http://localhost:8000"


async def test_streaming_chat(token: str):
    """Test the streaming chat endpoint."""
    print("=" * 60)
    print("Testing SSE Streaming Chat Endpoint")
    print("=" * 60)
    
    url = f"{BACKEND_URL}/api/chat/stream"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "message": "Add a task to test streaming",
    }
    
    print(f"\n📤 Sending request to: {url}")
    print(f"📝 Message: {payload['message']}")
    print(f"🔑 Token: {token[:20]}...\n")
    
    print("⏳ Waiting for streaming response...\n")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                url,
                headers=headers,
                json=payload,
            ) as response:
                print(f"✅ Response Status: {response.status_code}")
                print(f"✅ Response Headers: {dict(response.headers)}\n")
                
                if response.status_code != 200:
                    error_text = await response.aread()
                    print(f"❌ Error: {error_text.decode()}")
                    return
                
                print("📺 Streaming tokens:\n")
                print("-" * 60)
                
                full_response = ""
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix
                        try:
                            event = json.loads(data)
                            event_type = event.get("type", "unknown")
                            
                            if event_type == "token":
                                content = event.get("content", "")
                                print(content, end="", flush=True)
                                full_response += content
                            elif event_type == "error":
                                print(f"\n❌ Error: {event.get('content')}")
                            elif event_type == "done":
                                print("\n" + "-" * 60)
                                print(f"✅ Done! Conversation ID: {event.get('conversation_id')}")
                                print(f"✅ Full Response: {event.get('response')[:100]}...")
                                break
                        except json.JSONDecodeError:
                            print(f"⚠️  Could not parse: {data}")
                
                print("\n" + "=" * 60)
                print(f"✅ Streaming test completed!")
                print(f"📝 Total characters received: {len(full_response)}")
                print("=" * 60)
                
    except httpx.ConnectError as e:
        print(f"❌ Connection error: {e}")
        print(f"💡 Is the backend server running at {BACKEND_URL}?")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_chat_stream.py YOUR_JWT_TOKEN_HERE")
        print("\nGet your JWT token from:")
        print("  1. Open browser DevTools → Application → Local Storage")
        print("  2. Find key: 'better_auth_jwt'")
        print("  3. Copy the value (starts with 'eyJ...')")
        sys.exit(1)
    
    token = sys.argv[1]
    asyncio.run(test_streaming_chat(token))
