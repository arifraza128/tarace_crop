import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema";

const { Pool } = pg;
const localDataDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".pglite",
);

async function initializeLocalDatabase(client: PGlite): Promise<void> {
  await client.exec(`
    create table if not exists users (
      id serial primary key,
      name text not null,
      email text not null unique,
      password_hash text not null,
      created_at timestamptz not null default now()
    );

    create table if not exists farms (
      id serial primary key,
      user_id integer not null references users(id),
      farmer_name text not null,
      farm_name text not null,
      location text not null,
      region_type text not null default 'hilly',
      terrace_count integer,
      farm_size text,
      soil_type text,
      water_source text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists crops (
      id serial primary key,
      user_id integer not null references users(id),
      farm_id integer references farms(id),
      crop_name text not null,
      crop_type text not null,
      sowing_date text,
      growth_stage text not null default 'seedling',
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists devices (
      id serial primary key,
      user_id integer not null references users(id),
      farm_id integer references farms(id),
      device_id text not null,
      device_name text not null,
      device_type text not null default 'ESP32',
      status text not null default 'offline',
      last_sync timestamptz,
      created_at timestamptz not null default now()
    );

    create table if not exists sensor_readings (
      id serial primary key,
      user_id integer not null references users(id),
      farm_id integer references farms(id),
      device_id text,
      soil_moisture real not null,
      temperature real not null,
      humidity real not null,
      light_intensity real not null,
      water_level real not null,
      source_type text not null default 'manual',
      created_at timestamptz not null default now()
    );

    create table if not exists alerts (
      id serial primary key,
      user_id integer not null references users(id),
      farm_id integer references farms(id),
      title text not null,
      message text not null,
      severity text not null default 'medium',
      status text not null default 'active',
      created_at timestamptz not null default now()
    );

    create table if not exists recommendations (
      id serial primary key,
      user_id integer not null references users(id),
      farm_id integer references farms(id),
      category text not null,
      message text not null,
      created_at timestamptz not null default now()
    );

    create table if not exists price_data (
      id serial primary key,
      user_id integer not null references users(id),
      crop_name text not null,
      price_per_kg real not null,
      market_name text not null default 'Local Market',
      unit text not null default 'kg',
      notes text,
      created_at timestamptz not null default now()
    );
  `);

  const existingUsers = await client.query<{ count: string }>("select count(*) as count from users");
  if (Number(existingUsers.rows[0]?.count ?? 0) > 0) {
    return;
  }

  await client.exec(`
    insert into users (name, email, password_hash, created_at)
    values ('Ramu Farmer', 'demo@farm.com', '$2b$10$yQUEAOcAKxeCJ5OpVt11reZWTFZrFfjYSIbws5WFgLOKJQKZjYW5y', '2026-03-15T08:00:00Z');

    insert into farms (
      user_id, farmer_name, farm_name, location, region_type, terrace_count, farm_size, soil_type, water_source, created_at, updated_at
    ) values (
      1, 'Ramu Farmer', 'Green Terrace Farm', 'Himachal Pradesh, India', 'hilly', 12, '2.5 acres', 'Loamy', 'Mountain spring + rainwater', '2026-03-15T08:05:00Z', '2026-03-15T08:05:00Z'
    );

    insert into crops (user_id, farm_id, crop_name, crop_type, sowing_date, growth_stage, notes, created_at, updated_at)
    values
      (1, 1, 'Tomato', 'Vegetable', '2026-01-15', 'flowering', 'Local variety adapted to hilly terrain', '2026-03-15T08:10:00Z', '2026-03-15T08:10:00Z'),
      (1, 1, 'Wheat', 'Cereal', '2025-11-01', 'harvesting', 'Winter wheat for terraces 1-5', '2026-03-15T08:11:00Z', '2026-03-15T08:11:00Z');

    insert into devices (user_id, farm_id, device_id, device_name, device_type, status, created_at)
    values (1, 1, 'ESP32-001', 'Main Field Sensor', 'ESP32', 'offline', '2026-03-15T08:12:00Z');

    insert into sensor_readings (
      user_id, farm_id, device_id, soil_moisture, temperature, humidity, light_intensity, water_level, source_type, created_at
    ) values
      (1, 1, 'ESP32-001', 32, 24, 58, 420, 61, 'demo', '2026-03-15T06:00:00Z'),
      (1, 1, 'ESP32-001', 35, 25, 56, 460, 59, 'demo', '2026-03-15T09:00:00Z'),
      (1, 1, 'ESP32-001', 31, 26, 53, 520, 57, 'demo', '2026-03-15T12:00:00Z'),
      (1, 1, 'ESP32-001', 33, 27, 50, 600, 54, 'demo', '2026-03-14T15:00:00Z'),
      (1, 1, 'ESP32-001', 36, 29, 48, 680, 52, 'demo', '2026-03-13T15:00:00Z'),
      (1, 1, 'ESP32-001', 39, 30, 46, 710, 50, 'demo', '2026-03-12T15:00:00Z'),
      (1, 1, 'ESP32-001', 42, 31, 45, 740, 48, 'demo', '2026-03-11T15:00:00Z'),
      (1, 1, 'ESP32-001', 38, 28, 51, 620, 55, 'demo', '2026-03-10T15:00:00Z'),
      (1, 1, 'ESP32-001', 34, 27, 54, 590, 58, 'demo', '2026-03-09T15:00:00Z'),
      (1, 1, 'ESP32-001', 37, 29, 49, 650, 53, 'demo', '2026-03-08T15:00:00Z');

    insert into alerts (user_id, farm_id, title, message, severity, status, created_at)
    values
      (1, 1, 'Low Soil Moisture', 'Soil moisture dropped to 24%. Irrigation recommended.', 'medium', 'active', '2026-03-15T10:00:00Z'),
      (1, 1, 'Crop Stress Warning', 'Temperature is 36°C and humidity is 32%. High stress risk.', 'high', 'active', '2026-03-14T10:00:00Z'),
      (1, 1, 'Low Water Level', 'Water level at 18%. Check water storage.', 'medium', 'resolved', '2026-03-13T10:00:00Z');

    insert into recommendations (user_id, farm_id, category, message, created_at)
    values
      (1, 1, 'irrigation', 'Soil moisture is at 24%. Irrigation is recommended to prevent crop stress.', '2026-03-15T10:15:00Z'),
      (1, 1, 'crop', 'Tomato is in flowering stage. Nutrient support and adequate water supply are important now.', '2026-03-15T10:16:00Z'),
      (1, 1, 'general', 'Farm conditions are mostly stable. Continue regular monitoring.', '2026-03-15T10:17:00Z');

    insert into price_data (user_id, crop_name, price_per_kg, market_name, unit, notes, created_at)
    values
      (1, 'Tomato', 28.0, 'Shimla Mandi', 'kg', 'Good quality', '2026-03-02T08:00:00Z'),
      (1, 'Tomato', 29.5, 'Shimla Mandi', 'kg', null, '2026-03-05T08:00:00Z'),
      (1, 'Tomato', 31.0, 'Shimla Mandi', 'kg', 'High demand', '2026-03-08T08:00:00Z'),
      (1, 'Tomato', 33.5, 'Shimla Mandi', 'kg', null, '2026-03-11T08:00:00Z'),
      (1, 'Tomato', 36.0, 'Shimla Mandi', 'kg', 'Festival season', '2026-03-14T08:00:00Z'),
      (1, 'Potato', 18.0, 'Local Mandi', 'kg', null, '2026-03-03T08:00:00Z'),
      (1, 'Potato', 17.5, 'Local Mandi', 'kg', null, '2026-03-06T08:00:00Z'),
      (1, 'Potato', 18.5, 'Local Mandi', 'kg', null, '2026-03-09T08:00:00Z'),
      (1, 'Potato', 18.0, 'Local Mandi', 'kg', null, '2026-03-13T08:00:00Z'),
      (1, 'Capsicum', 55.0, 'Shimla Mandi', 'kg', 'Premium quality', '2026-03-04T08:00:00Z'),
      (1, 'Capsicum', 50.0, 'Shimla Mandi', 'kg', null, '2026-03-07T08:00:00Z'),
      (1, 'Capsicum', 46.0, 'Shimla Mandi', 'kg', 'Oversupply', '2026-03-10T08:00:00Z'),
      (1, 'Capsicum', 42.0, 'Shimla Mandi', 'kg', null, '2026-03-13T08:00:00Z');
  `);
}

async function createDatabase() {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return {
      pool,
      db: drizzleNodePg(pool, { schema }),
    };
  }

  console.warn(
    "DATABASE_URL is not set. Using embedded PGlite seeded with demo data.",
  );
  const client = new PGlite({ dataDir: localDataDir });
  await initializeLocalDatabase(client);
  return {
    pool: client,
    db: drizzlePglite(client, { schema }),
  };
}

const database = await createDatabase();

export const pool = database.pool;
export const db = database.db;

export * from "./schema";
