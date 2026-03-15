import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { farmsTable } from "./farms";

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  farmId: integer("farm_id").references(() => farmsTable.id),
  deviceId: text("device_id").notNull(),
  deviceName: text("device_name").notNull(),
  deviceType: text("device_type").notNull().default("ESP32"),
  status: text("status").notNull().default("offline"),
  lastSync: timestamp("last_sync", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({ id: true, createdAt: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;
