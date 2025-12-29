# Use a CUDA compatible Python image
FROM python:3.12.10

# Set the working directory
WORKDIR /app

# Install system dependencies for psycopg2 (Postgres driver)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    net-tools \
    iputils-ping \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install ping and net tools to be able to ping each other
RUN apt update && apt install -y \
    nano

# Copy requirements and install
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code
COPY . .

ENV PYTHONPATH=/app

EXPOSE 8000

# Command to run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]