from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import json
import logging


def register_exception_handlers(app: FastAPI):

    @app.exception_handler(RequestValidationError)
    async def request_validation_exception_handler(
            request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            field_path = ".".join(str(x) for x in error['loc'])
            message = error['msg']
            errors.append(f"{message}: `{field_path}`")
        error_list = " * " + "\n * ".join(errors)
        try:
            request_data = json.loads(await request.body())
        except:
            request_data = await request.body()
            logging.info('Failed to parse request data as JSON in exception handler')
        logging.error(
            f"RequestValidationError @ {request.method} {request.url.path}\nRequest data: {request_data}\nErrors:\n{error_list}"
        )

        return JSONResponse(content=errors, status_code=400)
