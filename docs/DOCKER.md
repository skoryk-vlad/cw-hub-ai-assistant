# Docker Setup Guide

## Quick Start

```bash
docker-compose up
```

That's it! The application will be available at http://localhost:3001 with MongoDB ready to use.

## What's Configured

### Services

1. **MongoDB**
   - Container: `mongodb`
   - Port: 27017
   - Credentials: root / example
   - Database: clockwise_ai
   - Health checks enabled

2. **API (Web App)**
   - Container: `api`
   - Port: 3000
   - Hot reload: ✅ Enabled
   - Automatic restart on file changes

### Hot Reload

The application automatically reloads when you change files in:
- `apps/` - All application code
- `scripts/` - Build scripts
- `data/` - Data files
- Configuration files (tsconfig, package.json, etc.)

**Note:** Changes to `node_modules` or `package.json` require a rebuild:
```bash
docker-compose up --build
```

## Common Commands

### Starting Services

```bash
# Start in foreground (see logs)
docker-compose up

# Start in background
docker-compose up -d

# Rebuild containers (after dependency changes)
docker-compose up --build
```

### Managing Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart api
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f mongodb
```

### Debugging

```bash
# Access API container shell
docker-compose exec api sh

# Access MongoDB shell
docker-compose exec mongodb mongosh -u root -p example

# Check service status
docker-compose ps

# View resource usage
docker stats
```

## How Hot Reload Works

1. **Volume Mounts**: Source code is mounted from your host to the container
2. **tsx Watch Mode**: The `npm run dev:web` command uses tsx which watches for file changes
3. **Automatic Restart**: When files change, tsx automatically restarts the Node.js process

### What Triggers Reload?

✅ TypeScript files (`.ts`)
✅ JavaScript files (`.js`)
✅ Configuration files

### What Requires Rebuild?

- Changes to `package.json` dependencies
- Changes to `Dockerfile`
- Changes to `docker-compose.yml`

## Environment Variables

Make sure your `.env` file has the Docker MongoDB URI:

```bash
MONGODB_URI=mongodb://root:example@mongodb:27017/clockwise_ai?authSource=admin
OPENAI_API_KEY=sk-...
PORT=3000
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs api

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### MongoDB connection issues

```bash
# Check MongoDB is healthy
docker-compose ps

# Check MongoDB logs
docker-compose logs mongodb

# Verify connection string in .env
cat .env | grep MONGODB_URI
```

### Port already in use

If port 3000 or 27017 is already in use, edit `docker-compose.yml`:

```yaml
ports:
  - '3001:3000'  # Use port 3001 on host instead
```

### Hot reload not working

1. Check volumes are mounted: `docker-compose config`
2. Verify tsx is running: `docker-compose logs -f api`
3. Try rebuilding: `docker-compose up --build`

## Performance Optimization

The setup uses a named volume for `node_modules` to:
- Speed up container startup
- Avoid reinstalling dependencies on every change
- Improve hot reload performance

To clear the node_modules cache:
```bash
docker-compose down -v
docker-compose up --build
```

## Development Workflow

1. Start Docker Compose:
   ```bash
   docker-compose up
   ```

2. Make code changes in your editor

3. Save the file

4. Watch the logs - the server automatically restarts:
   ```
   [API] File changed: apps/web/src/index.ts
   [API] Restarting...
   [API] Chat server running http://localhost:3000
   ```

5. Test your changes at http://localhost:3000

## Production

For production, you'll want to:
1. Build the application: `npm run build`
2. Use `npm run start` instead of `npm run dev`
3. Remove volume mounts (use COPY in Dockerfile)
4. Use environment-specific docker-compose files

See `Dockerfile` for the production build configuration.
