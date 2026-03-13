# Mock API Playground

Create and host mock REST APIs without writing any code. Design your endpoints, define the schema, and get a working API instantly.

## What is this?

Ever needed to test your frontend but the backend isn't ready yet? Or wanted to prototype an API design before committing to implementation? That's what this is for.

You define what your API should look like (endpoints, data structure, response codes), and it generates realistic mock data on the fly. No servers to configure, no backend code to write.

## Quick Example

Say you're building a user management system. Create a `/users` endpoint, define the schema:

```json
{
  "id": "uuid",
  "name": "string",
  "email": "email",
  "age": "number"
}
```

And boom - you get a working endpoint that returns data like:

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "age": 28
  }
]
```

## Features

**Basic Stuff:**

- Create projects and endpoints through a web UI
- Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Automatic realistic data generation
- Configurable response codes and headers
- Arrays and pagination out of the box

**Advanced:**

- **Scenarios** - Return different responses based on query params or headers
- **Validation** - Validate incoming POST/PUT/PATCH requests against your schema
- **Request Logs** - See all requests made to your endpoints
- **Batch Operations** - Enable/disable/delete multiple endpoints at once
- **OpenAPI Export/Import** - Export your API as OpenAPI 3.0 spec, or import existing specs
- **Global Headers** - Set default headers for all endpoints in a project
- **Delay Simulation** - Add artificial delays to simulate slow networks

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Docker (for running Postgres locally)

### Installation

1. Clone and install:

```bash
git clone <repo-url>
cd api-design-mocking
npm install
```

2. Set up your database:

```bash
# Copy the example env file
cp .env.example .env

# Update DATABASE_URL in .env to point to your Postgres instance
# Example: postgresql://user:password@localhost:5432/mock_api_playground

# Run migrations
npx prisma db push
npx prisma generate
```

3. Configure authentication (using better-auth):

```bash
# Add these to your .env:
BETTER_AUTH_SECRET=<generate-a-random-secret>
BETTER_AUTH_URL=http://localhost:3000
```

4. Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000 and you're good to go.

## Usage

### Creating Your First Mock API

1. **Create a Project** - Give it a name and slug (e.g., `my-app`)
2. **Add an Endpoint** - Choose a path (e.g., `/users`) and method (GET)
3. **Define the Schema** - Add fields with types (string, number, email, etc.)
4. **Hit Save** - Your endpoint is live at `/api/mock/my-app/users`

### Using Scenarios

Let's say you want to return admin users when `?role=admin` is in the query:

1. In the endpoint editor, go to "Response Scenarios"
2. Add a scenario with:
   - Condition: `role` (query param) equals `admin`
   - Response: Your custom JSON for admin users
3. Now `/users?role=admin` returns different data than `/users`

### Validation

Enable "Validate Request Body" on POST/PUT/PATCH endpoints to ensure incoming data matches your schema. Invalid requests get a 400 with detailed errors.

### Global Headers

In Project Settings, add headers like `X-API-Version: 1.0` that apply to all endpoints. Individual endpoint headers override these.

### OpenAPI Integration

**Export:**

- Go to Docs page or Project Settings
- Click "JSON" or "YAML" to download your OpenAPI spec
- Import into Postman, Insomnia, etc.

**Import:**

- Click "Import OpenAPI" in your project
- Upload a spec file or paste the JSON/YAML
- All endpoints are created automatically

## Tech Stack

- **Next.js 16** - App router with server components
- **Prisma** - Database ORM with PostgreSQL
- **Better Auth** - Authentication
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Styling

## API Usage

Your mock endpoints are available at:

```
GET /api/mock/{project-slug}/{endpoint-path}
```

Example:

```bash
curl http://localhost:3000/api/mock/my-app/users
```

With authentication (if enabled on endpoint):

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/mock/my-app/users
```

## Deployment

Works on any platform that supports Next.js:

**Vercel:**

```bash
vercel
```

**Docker:**

```dockerfile
# Build and run with Docker
docker build -t mock-api .
docker run -p 3000:3000 mock-api
```

Just make sure your DATABASE_URL points to an accessible Postgres instance.

## Project Structure

```
app/
├── api/              # API routes
│   ├── mock/         # Mock API handler (the actual endpoints)
│   └── projects/     # Project/endpoint CRUD
├── (dashboard)/      # Protected dashboard pages
└── docs/             # Public API documentation

components/
├── endpoints/        # Endpoint management UI
├── projects/         # Project management UI
└── docs/             # Documentation components

lib/
├── mock-generator.ts      # Fake data generation
├── validator.ts           # Request validation
├── openapi-generator.ts   # OpenAPI spec export
└── openapi-importer.ts    # OpenAPI spec import

prisma/
└── schema.prisma     # Database schema
```

## Common Issues

**"Can't connect to database"**

- Make sure PostgreSQL is running
- Check your DATABASE_URL in .env
- Run `npx prisma db push` to sync the schema

**"Build fails with Prisma errors"**

- Run `npx prisma generate` to regenerate the Prisma client
- Make sure you're using the correct Node version (18+)

**"Mock endpoint returns 404"**

- Check that the endpoint is enabled
- Verify the project slug and endpoint path match your URL
- Look at the endpoint list to see the exact path

## Development

```bash
# Run dev server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Database management
npx prisma studio  # Visual database browser
npx prisma migrate dev  # Create migration
```

## Contributing

This is a personal project, but feel free to fork it and make it your own. If you find bugs or have ideas, open an issue.

## License

MIT - do whatever you want with it.

---

Built with Next.js
