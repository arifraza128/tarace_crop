import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const priceDataTable = pgTable("price_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  cropName: text("crop_name").notNull(),
  pricePerKg: real("price_per_kg").notNull(),
  marketName: text("market_name").notNull().default("Local Market"),
  unit: text("unit").notNull().default("kg"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPriceDataSchema = createInsertSchema(priceDataTable).omit({ id: true, createdAt: true });
export type InsertPriceData = z.infer<typeof insertPriceDataSchema>;
export type PriceData = typeof priceDataTable.$inferSelect;
