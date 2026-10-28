FROM python:3.14-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway geeft de poort mee in $PORT; lokaal (docker compose) is dat 8000
CMD fastapi run main.py --host 0.0.0.0 --port ${PORT:-8000}