INFO:     Application startup complete.
WARNING:  StatReload detected changes in 'src\routers\chat.py'. Reloading...
 INFO:     Shutting down
INFO:     Waiting for application shutdown.
Shutting down Todo Backend API...
StreamableHTTP session manager shutting down
INFO:     Application shutdown complete.
INFO:     Finished server process [3344]
INFO:     Started server process [11008]
INFO:     Waiting for application startup.
StreamableHTTP session manager started
Starting up Todo Backend API...
Creating database tables...
Database tables created successfully
Database tables created/verified
INFO:     Application startup complete.
WARNING:  StatReload detected changes in 'src\services\agent\agent_service.py'. Reloading...
 INFO:     Shutting down
INFO:     Waiting for application shutdown.
Shutting down Todo Backend API...
StreamableHTTP session manager shutting down
INFO:     Application shutdown complete.
INFO:     Finished server process [11008]
INFO:     Started server process [17304]
INFO:     Waiting for application startup.
StreamableHTTP session manager started
Starting up Todo Backend API...
Creating database tables...
Database tables created successfully
Database tables created/verified
INFO:     Application startup complete.
WARNING:  StatReload detected changes in 'src\services\agent\agent_service.py'. Reloading...
 INFO:     Shutting down
INFO:     Waiting for application shutdown.
Shutting down Todo Backend API...
StreamableHTTP session manager shutting down
INFO:     Application shutdown complete.
INFO:     Finished server process [17304]
INFO:     Started server process [19200]
INFO:     Waiting for application startup.
StreamableHTTP session manager started
Starting up Todo Backend API...
Creating database tables...
Database tables created successfully
Database tables created/verified
INFO:     Application startup complete.
GET /docs
GET /docs status=200 duration=0.003s
INFO:     127.0.0.1:54673 - "GET /docs HTTP/1.1" 200 OK
GET /openapi.json
GET /openapi.json status=200 duration=0.231s
INFO:     127.0.0.1:54673 - "GET /openapi.json HTTP/1.1" 200 OK
GET /
GET / status=200 duration=0.004s
INFO:     127.0.0.1:53719 - "GET / HTTP/1.1" 200 OK
GET /api/conversations
GET /api/conversations status=401 duration=0.003s
INFO:     127.0.0.1:63443 - "GET /api/conversations?limit=50 HTTP/1.1" 401 Unauthorized
GET /api/chat/stream
GET /api/chat/stream status=405 duration=0.004s
INFO:     127.0.0.1:50869 - "GET /api/chat/stream HTTP/1.1" 405 Method Not Allowed
POST /api/chat/stream
JWT token has expired
POST /api/chat/stream status=401 duration=1.398s
INFO:     127.0.0.1:53217 - "POST /api/chat/stream HTTP/1.1" 401 Unauthorized
GET /api/todos
GET /api/todos status=307 duration=0.002s
INFO:     127.0.0.1:60767 - "GET /api/todos HTTP/1.1" 307 Temporary Redirect
GET /api/todos
GET /api/todos status=307 duration=0.013s
INFO:     127.0.0.1:60767 - "GET /api/todos HTTP/1.1" 307 Temporary Redirect
GET /api/todos/
GET /api/todos/ status=200 duration=1.657s
INFO:     127.0.0.1:60767 - "GET /api/todos/ HTTP/1.1" 200 OK
GET /api/todos/
GET /api/todos/ status=200 duration=2.383s
INFO:     127.0.0.1:65141 - "GET /api/todos/ HTTP/1.1" 200 OK
POST /api/chat/stream
Streaming chat request from user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI: show my tasks...
Starting streaming chat for user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI, conversation: 6b525953-c98d-4d25-a09c-24801152cc75
Stream: Running AI agent with MCP server at http://localhost:8000/mcp/
POST /api/chat/stream status=200 duration=5.607s
POST /mcp/
POST /mcp/ status=200 duration=0.069s
INFO:     127.0.0.1:49966 - "POST /mcp/ HTTP/1.1" 200 OK
HTTP Request: POST http://localhost:8000/mcp/ "HTTP/1.1 200 OK"
Negotiated protocol version: 2025-11-25
Terminating session: None
Stream: Agent error: Runner.run() got an unexpected keyword argument 'stream'
Traceback (most recent call last):
  File "D:\AbdullahQureshi\workspace\Hackathon-2025\hackathon-2\todo-in-memory-console-app\backend\src\services\agent\agent_service.py", line 314, in handle_chat_stream
    result = Runner.run(
             ^^^^^^^^^^^
TypeError: Runner.run() got an unexpected keyword argument 'stream'
Stream: Completed for user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI, conversation: 6b525953-c98d-4d25-a09c-24801152cc75, tokens: 0
INFO:     127.0.0.1:50262 - "POST /api/chat/stream HTTP/1.1" 200 OK
WARNING:  StatReload detected changes in 'src\services\agent\agent_service.py'. Reloading...
 INFO:     Shutting down
INFO:     Waiting for application shutdown.
Shutting down Todo Backend API...
StreamableHTTP session manager shutting down
INFO:     Application shutdown complete.
INFO:     Finished server process [19200]
INFO:     Started server process [17156]
INFO:     Waiting for application startup.
StreamableHTTP session manager started
Starting up Todo Backend API...
Creating database tables...
Database tables created successfully
Database tables created/verified
INFO:     Application startup complete.
POST /api/chat/stream
Streaming chat request from user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI: show my tasks...
Starting streaming chat for user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI, conversation: 6b525953-c98d-4d25-a09c-24801152cc75
Stream: Running AI agent with MCP server at http://localhost:8000/mcp/
POST /api/chat/stream status=200 duration=7.246s
POST /mcp/
POST /mcp/ status=200 duration=0.012s
INFO:     127.0.0.1:50439 - "POST /mcp/ HTTP/1.1" 200 OK
HTTP Request: POST http://localhost:8000/mcp/ "HTTP/1.1 200 OK"
Negotiated protocol version: 2025-11-25
Terminating session: None
Stream: Agent error: 'coroutine' object has no attribute 'stream_events'    
Traceback (most recent call last):
  File "D:\AbdullahQureshi\workspace\Hackathon-2025\hackathon-2\todo-in-memory-console-app\backend\src\services\agent\agent_service.py", line 321, in handle_chat_stream
    async for chunk in result.stream_events:
                       ^^^^^^^^^^^^^^^^^^^^
AttributeError: 'coroutine' object has no attribute 'stream_events'
Stream: Completed for user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI, conversation: 6b525953-c98d-4d25-a09c-24801152cc75, tokens: 0
INFO:     127.0.0.1:62219 - "POST /api/chat/stream HTTP/1.1" 200 OK
D:\AbdullahQureshi\workspace\Hackathon-2025\hackathon-2\todo-in-memory-console-app\backend\src\routers\chat.py:112: RuntimeWarning: coroutine 'Runner.run' was never awaited
  async for chunk in handle_chat_stream(
RuntimeWarning: Enable tracemalloc to get the object allocation traceback   
POST /api/chat/stream
Streaming chat request from user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI: show my tasks...
Starting streaming chat for user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI, conversation: new
Stream: Running AI agent with MCP server at http://localhost:8000/mcp/
POST /api/chat/stream status=200 duration=4.831s
POST /mcp/
POST /mcp/ status=200 duration=0.007s
INFO:     127.0.0.1:51213 - "POST /mcp/ HTTP/1.1" 200 OK
HTTP Request: POST http://localhost:8000/mcp/ "HTTP/1.1 200 OK"
Negotiated protocol version: 2025-11-25
Terminating session: None
Stream: Agent error: 'coroutine' object has no attribute 'stream_events'    
Traceback (most recent call last):
  File "D:\AbdullahQureshi\workspace\Hackathon-2025\hackathon-2\todo-in-memory-console-app\backend\src\services\agent\agent_service.py", line 321, in handle_chat_stream
    async for chunk in result.stream_events:
                       ^^^^^^^^^^^^^^^^^^^^
AttributeError: 'coroutine' object has no attribute 'stream_events'
Stream: Completed for user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI, conversation: dc35a6c7-13c4-45c7-a945-ac13dd0d1721, tokens: 0
INFO:     127.0.0.1:53621 - "POST /api/chat/stream HTTP/1.1" 200 OK
WARNING:  StatReload detected changes in 'src\services\agent\agent_service.py'. Reloading...
 INFO:     Shutting down
INFO:     Waiting for application shutdown.
Shutting down Todo Backend API...
StreamableHTTP session manager shutting down
INFO:     Application shutdown complete.
INFO:     Finished server process [17156]
INFO:     Started server process [6880]
INFO:     Waiting for application startup.
StreamableHTTP session manager started
Starting up Todo Backend API...
Creating database tables...
Database tables created successfully
Database tables created/verified
INFO:     Application startup complete.
POST /api/chat/stream
Streaming chat request from user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI: show my tasks...
Starting streaming chat for user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI, conversation: new
Stream: Running AI agent with MCP server at http://localhost:8000/mcp/
POST /api/chat/stream status=200 duration=7.867s
POST /mcp/
POST /mcp/ status=200 duration=0.024s
INFO:     127.0.0.1:51057 - "POST /mcp/ HTTP/1.1" 200 OK
HTTP Request: POST http://localhost:8000/mcp/ "HTTP/1.1 200 OK"
Negotiated protocol version: 2025-11-25
Terminating session: None
POST /mcp/
POST /mcp/ status=202 duration=0.024s
Terminating session: None
INFO:     127.0.0.1:51059 - "POST /mcp/ HTTP/1.1" 202 Accepted
HTTP Request: POST http://localhost:8000/mcp/ "HTTP/1.1 202 Accepted"       
POST /mcp/
POST /mcp/ status=200 duration=0.024s
Processing request of type ListToolsRequest
INFO:     127.0.0.1:51061 - "POST /mcp/ HTTP/1.1" 200 OK
HTTP Request: POST http://localhost:8000/mcp/ "HTTP/1.1 200 OK"
Terminating session: None
HTTP Request: POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions "HTTP/1.1 200 OK"
INFO:     127.0.0.1:61421 - "POST /api/chat/stream HTTP/1.1" 200 OK
POST /mcp/
POST /mcp/ status=200 duration=0.012s
Processing request of type CallToolRequest
INFO:     127.0.0.1:54677 - "POST /mcp/ HTTP/1.1" 200 OK
HTTP Request: POST http://localhost:8000/mcp/ "HTTP/1.1 200 OK"
Terminating session: None
POST /mcp/
POST /mcp/ status=200 duration=0.025s
Processing request of type ListToolsRequest
INFO:     127.0.0.1:55186 - "POST /mcp/ HTTP/1.1" 200 OK
HTTP Request: POST http://localhost:8000/mcp/ "HTTP/1.1 200 OK"
Terminating session: None
HTTP Request: POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions "HTTP/1.1 200 OK"
Stream: AI agent completed. Tokens streamed: 13, Response length: 138 chars
Stream: Completed for user yKCN7ctCRp3PCJbQpYP1FbJXH3LkZCGI, conversation: 5309ed2c-6384-4c54-959a-16cc4f298735, tokens: 13
