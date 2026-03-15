import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { farmsTable } from "./farms";

export const cropsTable = pgTable("crops", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  farmId: integer("farm_id").references(() => farmsTable.id),
  cropName: text("crop_name").notNull(),
  cropType: text("crop_type").notNull(),
  sowingDate: text("sowing_date"),
  growthStage: text("growth_stage").notNull().default("seedling"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCropSchema = createInsertSchema(cropsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof cropsTable.$inferSelect;
