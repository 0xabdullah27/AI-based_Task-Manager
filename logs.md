  response = await self.dispatch_func(request, call_next)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\src\middleware\logging.py", line 16, in logging_middleware
    response = await call_next(request)
               ^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\starlette\middleware\base.py", line 168, in call_next
    raise app_exc from app_exc.__cause__ or app_exc.__context__
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\starlette\middleware\base.py", line 144, in coro
    await self.app(scope, receive_or_disconnect, send_no_error)
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\starlette\middleware\exceptions.py", line 63, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\fastapi\middleware\asyncexitstack.py", line 18, in __call__
    await self.app(scope, receive, send)
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\starlette\routing.py", line 716, in __call__
    await self.middleware_stack(scope, receive, send)
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\starlette\routing.py", line 736, in app
    await route.handle(scope, receive, send)
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\starlette\routing.py", line 290, in handle
    await self.app(scope, receive, send)
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\fastapi\routing.py", line 115, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\starlette\_exception_handler.py", line 53, in wrapped_app
    raise exc
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\starlette\_exception_handler.py", line 42, in wrapped_app
    await app(scope, receive, sender)
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\fastapi\routing.py", line 101, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\fastapi\routing.py", line 355, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\fastapi\routing.py", line 243, in run_endpoint_function
    return await dependant.call(**values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\.venv\Lib\site-packages\slowapi\extension.py", line 734, in async_wrapper
    response = await func(*args, **kwargs)  # type: ignore
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\src\routers\chat.py", line 47, in chat
    return await handle_chat(
           ^^^^^^^^^^^^^^^^^^
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\src\services\agent\agent_service.py", line 337, in handle_chat
    model = _get_model(session, user_id)
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\AbdullahQureshi\workspace\AI-based_Task-Manager\backend\src\services\agent\agent_service.py", line 278, in _get_model
    raise ValueError(
ValueError: LLM_API_KEY not set in settings. Current config: LLM_PROVIDER=mistral, LLM_MODEL=mistral-small-latest
INFO:     127.0.0.1:55833 - "POST /api/chat HTTP/1.1" 500 Internal Server Error
