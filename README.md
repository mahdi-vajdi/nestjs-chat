# Chatterbox - NestJS Real-time Chat Application

Chatterbox is a real-time chat application built with NestJS, designed for scalability and maintainability. It features WebSocket communication, JWT-based authentication, and a PostgreSQL database backend.

## Features

*   **Real-time Messaging:** Utilizes WebSockets (Socket.IO) for instant message delivery.
*   **Scalable Architecture:** Leverages Redis with `@socket.io/redis-adapter` for multi-instance WebSocket scaling.
*   **Authentication & Authorization:** Secure JWT-based authentication (access and refresh tokens) using RSA keys.
*   **Database:** PostgreSQL managed with TypeORM, including support for migrations.
*   **API Documentation:** Swagger (OpenAPI) integration for easy API exploration and testing.
*   **Configuration Management:** Flexible configuration using `@nestjs/config` and `.env` files.
*   **Logging:** Comprehensive logging with Winston.
*   **Input Validation:** Uses `class-validator` and `class-transformer` for robust request validation.
*   **Structured Codebase:** Follows a modular approach with clear separation of concerns (application, infrastructure, presentation layers).

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) (v9.x or later) or [yarn](https://yarnpkg.com/)
*   [PostgreSQL](https://www.postgresql.org/) (v13.x or later)
*   [Redis](https://redis.io/) (v6.x or later)
*   [OpenSSL](https://www.openssl.org/) (for generating RSA keys)
*   [Docker](https://www.docker.com/) (Optional, for running PostgreSQL and Redis in containers)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd nestjs-chat
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up environment variables:**
    Copy the example environment file and update it with your local configuration:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` with your specific settings (database credentials, ports, key paths, etc.). See the [Environment Variables](#environment-variables) section for details.

4.  **Generate RSA Keys for Authentication:**
    The application uses RSA keys for signing and verifying JWTs. Use the provided Makefile to generate them:
    ```bash
    make generate_keys
    ```
    This will create a `keys/` directory with `access_private.key`, `access_public.key`, `refresh_private.key`, and `refresh_public.key`.
    Ensure the paths in your `.env` file (`AUTH_ACCESS_PUBLIC_KEY_PATH`, `AUTH_ACCESS_PRIVATE_KEY_PATH`, etc.) point to these generated keys (e.g., `keys/access_private.key`).

5.  **Set up the Database:**
    Ensure your PostgreSQL server is running and accessible with the credentials provided in your `.env` file.
    Run database migrations to create the necessary tables:
    ```bash
    npm run migration:run
    ```

## Running the Application

*   **Development Mode (with hot-reloading):**
    ```bash
    npm run start:dev
    ```
    The application will typically be available at `http://localhost:<PORT>` (as defined in your `.env`).

*   **Production Mode:**
    ```bash
    npm run build
    npm run start:prod
    ```

*   **Debugging Mode:**
    ```bash
    npm run start:debug
    ```

## Running Tests

*   **Run all tests:**
    ```bash
    npm test
    ```

*   **Run tests in watch mode:**
    ```bash
    npm run test:watch
    ```

*   **Run tests with coverage report:**
    ```bash
    npm run test:cov
    ```

*   **Run End-to-End (E2E) tests:**
    ```bash
    npm run test:e2e
    ```

## API Documentation

Swagger API documentation is available once the application is running. Navigate to:

`http://localhost:<PORT>/swagger`

(Replace `<PORT>` with the HTTP port specified in your `.env` file).

## Environment Variables

The following environment variables need to be configured in your `.env` file:

| Variable                        | Description                                                 |
| ------------------------------- | ----------------------------------------------------------- |
| `POSTGRES_HOST`                 | PostgreSQL server host.                                     |
| `POSTGRES_PORT`                 | PostgreSQL server port.                                     |
| `POSTGRES_USERNAME`             | PostgreSQL username.                                        |
| `POSTGRES_PASSWORD`             | PostgreSQL password.                                        |
| `POSTGRES_DATABASE`             | PostgreSQL database name.                                   |
| `POSTGRES_LOG`                  | Enable/disable TypeORM logging (`true`/`false`).            |
| `POSTGRES_SLOW_QUERY_LIMIT`     | Slow query limit in milliseconds for logging.               |
| `LOG_USE_FILE`                  | Whether to log to a file (`true`/`false`).                  |
| `LOG_FILE`                      | Path to the log file (if `LOG_USE_FILE` is true).         |
| `LOG_LEVEL`                     | Logging level (e.g., `debug`, `info`, `warn`, `error`).     |
| `PORT`                          | Port number for the HTTP server.                            |
| `REDIS_HOST`                    | Redis server host.                                          |
| `REDIS_PORT`                    | Redis server port.                                          |
| `REDIS_USERNAME`                | Redis username (if applicable).                             |
| `REDIS_PASSWORD`                | Redis password (if applicable).                             |
| `WEBSOCKET_PORT`                | Port number for the WebSocket server (Note: NestJS integrates WS with HTTP port by default unless explicitly separated). |
| `AUTH_ACCESS_PUBLIC_KEY_PATH`   | Path to the access token public RSA key.                    |
| `AUTH_ACCESS_PRIVATE_KEY_PATH`  | Path to the access token private RSA key.                   |
| `AUTH_REFRESH_PUBLIC_KEY_PATH`  | Path to the refresh token public RSA key.                   |
| `AUTH_REFRESH_PRIVATE_KEY_PATH` | Path to the refresh token private RSA key.                  |

## Key Generation (`Makefile`)

The `Makefile` provides convenient commands for managing RSA keys used for JWT authentication:

*   **`make generate_keys`**: Generates new RSA private and public key pairs for both access and refresh tokens. It will create them in the `keys/` directory. If keys already exist, it will prompt an error; use `make delete_keys` first.
*   **`make delete_keys`**: Deletes the `keys/` directory and all its contents.
*   **`make help`**: Displays available Makefile commands.

## Project Structure

A brief overview of the main directories in `src/`:

*   **`src/main.ts`**: Application entry point, initializes NestJS app, Swagger, WebSocket adapter, etc.
*   **`src/app.module.ts`**: Root module of the application.
*   **`src/application/`**: Contains core business logic, services, and use cases for different domains (e.g., `auth`, `chat`, `user`).
*   **`src/common/`**: Shared utilities, decorators, enums, constants, and base classes used across the application.
*   **`src/infrastructure/`**: Handles external concerns like database interactions (TypeORM entities, repositories), third-party service integrations (Redis, logging), and WebSocket adapters.
*   **`src/presentation/`**: Manages how the application interacts with the outside world. Includes HTTP controllers, WebSocket gateways, Data Transfer Objects (DTOs), and guards.

## License

This project is [UNLICENSED](./LICENSE).