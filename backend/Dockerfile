FROM python:3.11-slim

# Hugging Face Spaces run as a non-root user (uid 1000)
RUN useradd -m -u 1000 user
USER user

# Set home and path variables
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy requirements file first to leverage Docker layer caching
COPY --chown=user requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy the rest of your backend source code
COPY --chown=user . .

# Hugging Face Spaces strictly requires exposing port 7860
EXPOSE 7860

# Start the FastAPI server on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
