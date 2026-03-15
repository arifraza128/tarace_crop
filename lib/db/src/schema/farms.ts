import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const farmsTable = pgTable("farms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  farmerName: text("farmer_name").notNull(),
  farmName: text("farm_name").notNull(),
  location: text("location").notNull(),
  regionType: text("region_type").notNull().default("hilly"),
  terraceCount: integer("terrace_count"),
  farmSize: text("farm_size"),
  soilType: text("soil_type"),
  waterSource: text("water_source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFarmSchema = createInsertSchema(farmsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farmsTable.$inferSelect;
