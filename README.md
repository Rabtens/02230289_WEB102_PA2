### Description

This project is a Node.js application that provides endpoints for user authentication, Pokemon data fetching from PokeAPI, and managing caught Pokemon for authenticated users.

Technologies Used:

- Node.js
- TypeScript
- Prisma for database operations
- Hono for middleware and CORS handling
- bcrypt for password hashing
- jsonwebtoken for JWT token management
- axios for HTTP requests
- Setup Instructions
- Clone the repository

### bash
- Copy code
git clone <>
cd <project-folder>
Install dependencies

### bash
- Copy code
- npm install

### Set up environment variables

- Create a .env file and define the following variables:
- makefile
- Copy code
DATABASE_URL=your_database_url
Run the application

### bash
- Copy code
- npm start
The application should now be running on http://localhost:3000.

### Endpoints

#### Register User

- URL: http://localhost:3000/register
- Method: POST
- Body:
- json

Copy code
{
  "email": "rabten@example.com",
  "password": "1234"
}

![alt text](<Screenshot from 2024-06-14 01-27-28.png>)

#### Login User

- URL: http://localhost:3000/login
- Method: POST
- Body:
json
Copy code
{
  "email": "user@example.com",
  "password": "password"
}

![alt text](<Screenshot from 2024-06-14 01-28-45.png>)

#### Fetch Pokemon Data

- URL: http://localhost:3000/pokemon/{name}
- Method: GET
- Catch Pokemon (Protected)

- URL: http://localhost:3000/protected/catch
- Method: POST
- Headers:
- Authorization: Bearer {token}
- Body:
json
Copy code
{
  "name": "PokemonName"
}

#### Release Pokemon (Protected)

- URL: http://localhost:3000/protected/release/{id}
- Method: DELETE
- Headers:
- Authorization: Bearer {token}

#### Get Caught Pokemon (Protected)

- URL: http://localhost:3000/protected/caught
- Method: GET

-Headers:
- Authorization: Bearer {token}
### Authentication
- JWT Token
- JWT tokens are used for authentication in protected endpoints (/protected/*).
- Obtain a token by registering and logging in a user. Use the token in the Authorization header prefixed with Bearer.

#### Error Handling
- Errors are handled with appropriate HTTP status codes and error messages.
- Common errors include 401 Unauthorized, 404 Not Found, and 500 Internal Server Error.

#### Dependencies
- Ensure you have Node.js installed.
- Install TypeScript globally: npm install -g typescript
- Install other dependencies with npm install.

#### Database
- This project assumes a PostgreSQL database configured with Prisma.
- Modify the DATABASE_URL in .env to connect to your database.

#### Additional Notes
Make sure to replace your_database_url in the .env file with your actual database URL.

#### Conclusion
This README provides an overview of how to set up, run, and use the endpoints of your Node.js application. Adjust paths and configurations as necessary for your specific environment and deployment strategy.








