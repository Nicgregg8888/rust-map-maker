// The map summary the generator saves in the database (maps.info).
// Shared by the website (to check what it reads) and the generator (to check
// what it writes), so the two can never drift apart.
import { z } from "zod";

export const MonumentPointSchema = z.object({
  type: z.string().min(1).max(100),
  name: z.string().max(200).nullable(),
  x: z.number().finite(),
  y: z.number().finite(),
});

export const BiomePercentagesSchema = z.object({
  snow: z.number().min(0).max(100),
  desert: z.number().min(0).max(100),
  forest: z.number().min(0).max(100),
  tundra: z.number().min(0).max(100),
  jungle: z.number().min(0).max(100),
});

export const MapSummarySchema = z.object({
  monuments: z.array(MonumentPointSchema).max(2000),
  biomes: BiomePercentagesSchema.nullable(),
  generatedAt: z.string(),
});

export type MapSummary = z.infer<typeof MapSummarySchema>;
