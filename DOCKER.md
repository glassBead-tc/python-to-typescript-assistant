# Docker Support for Python-to-TypeScript Porting MCP Server

This document describes how to use Docker with the Python-to-TypeScript Porting MCP Server.

## Quick Start

### Build and Run with Docker

```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run
```

### Build and Run with Docker Compose

```bash
# Start the production server
npm run compose:up

# View logs
npm run compose:logs

# Stop the server
npm run compose:down
```

## Development with Docker

### Development Environment Setup

```bash
# Build development image
npm run docker:build-dev

# Start development server with hot reloading
npm run compose:dev

# View development logs
docker-compose logs -f mcp-server-dev
```

### Development Features

- **Hot Reloading**: Source code changes are automatically detected
- **Volume Mounting**: Local `src/` directory is mounted for real-time updates
- **Separate Port**: Development server runs on port 3001
- **Development Dependencies**: Includes additional tools like nodemon and tsx

## Docker Images

### Production Image (`Dockerfile`)

- **Multi-stage build** for optimized image size
- **Alpine Linux** base for security and minimal footprint
- **Non-root user** for security
- **Signal handling** with dumb-init
- **Resource efficient** with minimal dependencies

### Development Image (`Dockerfile.dev`)

- **Development dependencies** included
- **Hot reloading** with nodemon
- **Debugging support** with source maps
- **Volume mounting** for live code updates

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run docker:build` | Build production Docker image |
| `npm run docker:build-dev` | Build development Docker image |
| `npm run docker:run` | Run production container interactively |
| `npm run docker:run-dev` | Run development container with port mapping |
| `npm run compose:up` | Start production services with Docker Compose |
| `npm run compose:down` | Stop all Docker Compose services |
| `npm run compose:dev` | Start development services |
| `npm run compose:logs` | View logs from all services |

## Service Configuration

### Production Service (`mcp-server`)

- **Port**: 3000 (mapped to host 3000)
- **Environment**: Production
- **Resources**: Limited to 512MB RAM, 0.5 CPU
- **Health Check**: Basic Node.js process check
- **Logging**: JSON format with rotation

### Development Service (`mcp-server-dev`)

- **Port**: 3000 (mapped to host 3001)
- **Environment**: Development
- **Volumes**: Source code mounted for hot reloading
- **Profile**: `dev` (only starts with `--profile dev`)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3000` | Server port (if needed) |

## Health Monitoring

The production container includes a health check that verifies the Node.js process is running:

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "process.exit(0)"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

## Security Features

- **Non-root user**: Containers run as user `mcpserver` (UID 1001)
- **Alpine Linux**: Minimal attack surface
- **Read-only volumes**: Development source mounting is read-only
- **Resource limits**: Prevents resource exhaustion

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change port mappings in `docker-compose.yml`
2. **Permission issues**: Ensure Docker daemon is running and user has access
3. **Build failures**: Clear Docker cache with `docker system prune`

### Debug Commands

```bash
# View container logs
docker logs py-to-ts-mcp-server

# Execute shell in running container
docker exec -it py-to-ts-mcp-server sh

# Check container resource usage
docker stats py-to-ts-mcp-server

# Inspect container configuration
docker inspect py-to-ts-mcp-server
```

### Development Debugging

```bash
# Access development container shell
docker exec -it py-to-ts-mcp-server-dev sh

# Restart development services
docker-compose --profile dev restart

# Rebuild development image
docker-compose --profile dev build --no-cache
```

## Production Deployment

For production deployment, consider:

1. **Environment-specific compose files**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **External configuration**:
   - Use environment files (`.env`)
   - Mount configuration volumes
   - Use Docker secrets for sensitive data

3. **Monitoring and logging**:
   - Configure log aggregation
   - Set up health check endpoints
   - Monitor resource usage

4. **Scaling**:
   ```bash
   docker-compose up -d --scale mcp-server=3
   ```

## Integration with MCP Clients

Since this is an MCP server that typically runs on stdio, you may need to configure your MCP client to connect to the containerized server. Consider:

- **Named pipes** or **Unix sockets** for local communication
- **TCP sockets** for network communication
- **Docker networking** for container-to-container communication

## Cleanup

```bash
# Remove all containers and images
npm run compose:down
docker rmi python-to-typescript-mcp-server:latest
docker rmi python-to-typescript-mcp-server:dev

# Clean up Docker system
docker system prune -a
``` 