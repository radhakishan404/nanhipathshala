FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    GOOGLE_GENAI_USE_VERTEXAI=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY nanhipathshala_agent ./nanhipathshala_agent

EXPOSE 8080

CMD ["sh", "-c", "adk api_server --host 0.0.0.0 --port ${PORT:-8080} ."]
