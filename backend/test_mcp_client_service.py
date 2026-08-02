import asyncio 
from sqlmodel import Session
from src.services.agent.agent_service import handle_chat, handle_chat_stream
from src.core.database import engine  # wherever your engine is

async def main(): 
    user_id = "yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI"
    # conversation_id = "conversation_456"
    message = "What todos do I have?"
    # Call the function to test
    with Session(engine) as session:
        response = await handle_chat(
            user_id=user_id,
            message=message,
            conversation_id=None,
            session=session  # 👈 real session object
        )

        print("Response from handle_chat:")
        print(response)
    # with Session(engine) as session:
    #     async for chunk in handle_chat_stream(
    #         user_id=user_id,
    #         message=message,
    #         conversation_id=None,
    #         session=session
    #     ):
    #         print(chunk, end="", flush=True)
asyncio.run(main())