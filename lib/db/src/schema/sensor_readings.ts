import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { farmsTable } from "./farms";

export const sensorReadingsTable = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  farmId: integer("farm_id").references(() => farmsTable.id),
  deviceId: text("device_id"),
  soilMoisture: real("soil_moisture").notNull(),
  temperature: real("temperature").notNull(),
  humidity: real("humidity").notNull(),
  lightIntensity: real("light_intensity").notNull(),
  waterLevel: real("water_level").notNull(),
  sourceType: text("source_type").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSensorReadingSchema = createInsertSchema(sensorReadingsTable).omit({ id: true, createdAt: true });
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
export type SensorReading = typeof sensorReadingsTable.$inferSelect;
