FROM oven/bun:latest
WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the server code
COPY . .

# Expose the port
EXPOSE 3000

# Start the server using your package.json script
CMD ["bun", "run", "start"]



