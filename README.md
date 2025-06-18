# Gist Rest API

Gist is a subject-based social app that enables users to socialize and engage in discussions about topics they share an interest in.

## Features

- **Authentication:** Create an account, log in, and log out of websites.
- **Authorization:** Only logged-in users have access to protected routes.
- **CRUD:** Most routes have complete Create, Read, Update, and Delete support.
- **Secured forms:** Forms' data are thoroughly sanitized and validated.
- **Tested Routes:** GET routes have thorough testing that ensures the request-response cycle works appropriately.

## Users and privileges

- **Basic:** Authenticated user
- **Admin:** An administrator

| Privilege                   | Basic | Admin |
| --------------------------- | ----- | ----- |
| Create an account           | Yes   | Yes   |
| Send messages               | Yes   | Yes   |
| Receive messages            | Yes   | Yes   |
| Update personal profile     | Yes   | Yes   |
| Update non-personal profile | No    | No    |
| Delete personal account     | Yes   | No    |
| Delete non-personal account | No    | Yes   |
| Create chat rooms           | No    | Yes   |
| Manage chat rooms           | No    | Yes   |

## API Routes

### User

- `GET /users` Fetch all users' data.
- `POST /users` Create a new user account.
- `PUT /users/:username` Update a single user's data.
- `DELETE /users/:username` Delete a single user's data.

### Channel

- `GET /channels` Fetch all channels.
- `POST /channels` Create a new channel.
- `POST /channels/:channelId/users/:username` Add a user to a channel.
- `PUT /channels/:id` Update a single channel.
- `DELETE /channels/:id` Delete a single channel.
- `DELETE /channels/:channelId/users/:username` Remove a user from a channel.

### Authentication

- `POST /auths` Create a new authentication token.

## Technologies used

- Node.js
- Express.js
- StreamChat
- PostgreSQL
- Prisma ORM
- Passport.js (local strategy)
- JSON Web Token
- Express Validator
- Jest
- SuperTest

## Usage

1. Clone the project

```bash
git clone https://github.com/oluwatobiss/gist-backend.git
```

2. Navigate into the project repo

```bash
cd gist-backend
```

3. Install dependencies

```bash
npm install
```

4. Create an environment variable file

```bash
touch .env
```

5. Define the project's environment variables

```
ADMIN_CODE=example-pass
DATABASE_URL=postgresql://username:password@localhost:5432/gist
GIST_APP_URI=http://localhost:3000
JWT_SECRET=example_jwt_secret
PORT=3001
STREAM_API_KEY=x0xxxxxx0x0x
STREAM_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

6. Migrate the project's schema to your database

```bash
npm run db:dev
```

7. Start the server

```bash
npm run dev
```

## Related Repos

- [Gist Website](https://github.com/oluwatobiss/gist-frontend)
