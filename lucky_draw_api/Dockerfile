FROM python:3.14-slim

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files first to leverage Docker cache
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
# --no-install-project installs only the dependencies, preventing errors because the source code isn't copied yet
RUN uv sync --frozen --no-cache --no-install-project

# Copy the rest of the application
COPY . .

# Run a final sync to install the project itself
RUN uv sync --frozen --no-cache

# Expose the port FastAPI runs on
EXPOSE 3026

# Run the application
CMD ["uv", "run", "fastapi", "run", "src/lucky_draw_api/main.py", "--host", "0.0.0.0", "--port", "3026"]
