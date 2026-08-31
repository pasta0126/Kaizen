FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY kaizen_api ./kaizen_api

RUN useradd --create-home app && chown -R app /app
USER app

EXPOSE 8080
CMD ["uvicorn", "kaizen_api.main:app", "--host", "0.0.0.0", "--port", "8080"]
