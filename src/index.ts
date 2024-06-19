import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient, Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "jsonwebtoken";
import axios from "axios";
import { jwt } from 'hono/jwt';
import type { JwtVariables } from 'hono/jwt';

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();
const prisma = new PrismaClient();

app.use("/*", cors());

app.use(
  "/protected/*",
  jwt({
    secret: 'mySecretKey',
  })
);

// Rate Limiting Middleware
function rateLimit(limit: number, interval: number) {
  const queue: number[] = [];

  return async (context: any, next: any) => {
    const now = Date.now();
    queue.push(now);

    while (queue[0] && queue[0] < now - interval) {
      queue.shift();
    }

    // Checks if queue length exceeds limit and if it does, send HTTP 429 Too Many Requests
    if (queue.length > limit) {
      return context.json({ message: "Rate limit exceeded" }, 429);
    }

    await next();
  };
}

// Applying rate limiting middleware to register endpoint
const registerRateLimitMiddleware = rateLimit(5, 1000); // 5 requests per second
app.use("/register", registerRateLimitMiddleware);

// Applying rate limiting middleware to login endpoint
const loginRateLimitMiddleware = rateLimit(10, 1000); // 10 requests per second
app.use("/login", loginRateLimitMiddleware);

// Applying rate limiting middleware to protected/catch endpoint
const catchRateLimitMiddleware = rateLimit(10, 1000); // 10 requests per second
app.use("/protected/catch", catchRateLimitMiddleware);

// Applying rate limiting middleware to protected/release/:id endpoint
const releaseRateLimitMiddleware = rateLimit(5, 1000); // 5 requests per second
app.use("/protected/release/:id", releaseRateLimitMiddleware);

// Applying rate limiting middleware to protected/caught endpoint
const caughtRateLimitMiddleware = rateLimit(10, 1000); // 10 requests per second
app.use("/protected/caught", caughtRateLimitMiddleware);

// Authentication Endpoints
app.post("/register", async (c) => {
  const body = await c.req.json();
  const email = body.email;
  const password = body.password;

  const bcryptHash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 4,
  });

  try {
    const user = await prisma.user.create({
      data: {
        email: email,
        hashedPassword: bcryptHash,
      },
    });

    return c.json({ message: `${user.email} created successfully` });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return c.json({ message: "Email already exists" });
      }
    }
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
});

app.post("/login", async (c) => {
  const body = await c.req.json();
  const email = body.email;
  const password = body.password;

  const user = await prisma.user.findUnique({
    where: { email: email },
    select: { id: true, hashedPassword: true },
  });

  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }

  const match = await Bun.password.verify(
    password,
    user.hashedPassword,
    "bcrypt"
  );

  if (match) {
    const payload = {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expires in 60 minutes
    };
    const secret = "mySecretKey";
    const token = sign(payload, secret);
    return c.json({ message: "Login successful", token: token });
  } else {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }
});

// Fetch Pokemon Data from PokeAPI
app.get("/pokemon/:name", async (c) => {
  const { name } = c.req.param();

  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`);
    return c.json({ data: response.data });
  } catch (error) {
    return c.json({ message: "Pokemon not found" }, 404);
  }
});

// Protected User Resource Endpoints

app.post("/protected/catch", async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  
  const body = await c.req.json();
  const pokemonName = body.name;

  let pokemon = await prisma.pokemon.findUnique({ where: { name: pokemonName } });
  
  if (!pokemon) {
    pokemon = await prisma.pokemon.create({
      data: { name: pokemonName }
    });
  }

  const caughtPokemon = await prisma.caughtPokemon.create({
    data: {
      userId: payload.sub,
      pokemonId: pokemon.id
    }
  });

  return c.json({ message: "Pokemon caught", data: caughtPokemon });
});

app.delete("/protected/release/:id", async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const { id } = c.req.param();

  await prisma.caughtPokemon.deleteMany({
    where: { id: id, userId: payload.sub }
  });

  return c.json({ message: "Pokemon released" });
});

app.get("/protected/caught", async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const caughtPokemon = await prisma.caughtPokemon.findMany({
    where: { userId: payload.sub },
    include: { pokemon: true }
  });

  return c.json({ data: caughtPokemon });
});

export default app;
