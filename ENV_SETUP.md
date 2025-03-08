# Environment Setup

This monorepo uses a hierarchical environment configuration approach.

## Configuration Hierarchy

Environment variables are loaded in the following order, with later configs overriding earlier ones:

1. Workspace-level environment variables (root `.env` files)
2. App-specific base environment variables (apps/{app}/config/.env)
3. App-specific environment-specific variables (apps/{app}/config/.env.{environment})

## Development Setup

1. Copy example files to create your local environment:

```bash
# Root workspace
cp .env.example .env

# Host application
cp apps/host/config/.env.example apps/host/config/.env
cp apps/host/config/.env.example apps/host/config/.env.development

# Client application
cp apps/client/config/.env.example apps/client/config/.env
cp apps/client/config/.env.example apps/client/config/.env.development
```

2. Modify the environment files as needed for your local setup

3. Start the development server with:

```bash
pnpm dev
```

## Adding New Environment Variables

When adding new environment variables:

1. Add them to the respective `.env.example` file
2. Add them to the corresponding environment utility in `src/utils/env.ts`
3. Update this README if necessary

## Production Deployment

For production deployments:

1. Create `.env.production` files for each application
2. Set `NODE_ENV=production` in your deployment environment
