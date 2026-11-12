/**
 * Outpost expansions (each one adds a room), maintained by hand: the
 * arctracker.io API has no data for them. The API's `hideout` modules only
 * reference them as `requires: [{ outpostRooms: N }]`.
 *
 * Source: https://arc-raiders-guide.wiki/outpost/ (updated 2026-10-30), matching
 * other guides. Remove this list once the API covers expansions, or their items
 * will be counted twice.
 */
export interface OutpostExpansion {
  /** Outpost level the expansion reaches */
  level: number;
  requirementItemIds: { itemId: string; quantity: number }[];
}

export const OUTPOST_EXPANSIONS: OutpostExpansion[] = [
  {
    level: 2,
    requirementItemIds: [
      { itemId: "steel_cable", quantity: 3 },
      { itemId: "sheetmetal", quantity: 20 },
      { itemId: "cable_stripper", quantity: 3 },
    ],
  },
  {
    level: 3,
    requirementItemIds: [
      { itemId: "epoxy_bucket", quantity: 3 },
      { itemId: "planks", quantity: 35 },
      { itemId: "hand_drill", quantity: 3 },
    ],
  },
  {
    level: 4,
    requirementItemIds: [
      { itemId: "sheetmetal", quantity: 40 },
      { itemId: "laser_level", quantity: 3 },
      { itemId: "insulation_roll", quantity: 3 },
    ],
  },
];
