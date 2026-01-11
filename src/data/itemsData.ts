import type { Item } from "../types";
import { getImageUrl } from "../services/dataService";

const USE_LOCAL_DATA = import.meta.env.VITE_USE_LOCAL_DATA === "true";

// Import all images from the items directory (only for local development)
const imageMap: Record<string, string> = {};

if (USE_LOCAL_DATA) {
  const imageModules = import.meta.glob<{ default: string }>(
    "../arcraiders-data/images/items/*.png",
    { eager: true }
  );

  Object.entries(imageModules).forEach(([path, module]) => {
    // Extract filename from path (e.g., "../arcraiders-data/images/items/acoustic_guitar.png" -> "acoustic_guitar")
    const filename = path.split("/").pop()?.replace(".png", "") || "";
    imageMap[filename] = module.default;
  });
}

// Helper function to get image for an item
export const getItemImage = (item: Item): string | undefined => {
  if (USE_LOCAL_DATA) {
    // Try exact match first (e.g., "bettina_i" -> "bettina_i.png")
    if (imageMap[item.id]) {
      return imageMap[item.id];
    }

    // Fallback: Extract base name from the imageFilename URL
    // e.g., "https://cdn.arctracker.io/items/bettina.png" -> "bettina"
    if (item.imageFilename) {
      const urlFilename = item.imageFilename
        .split("/")
        .pop()
        ?.replace(".png", "");
      if (urlFilename && imageMap[urlFilename]) {
        return imageMap[urlFilename];
      }
    }

    return undefined;
  } else {
    // Use GitHub raw URL for images
    // First, check if imageFilename exists and extract the actual filename from it
    if (item.imageFilename) {
      const urlFilename = item.imageFilename.split("/").pop();
      if (urlFilename) {
        return getImageUrl(`images/items/${urlFilename}`);
      }
    }

    // Fallback: use item.id if imageFilename doesn't exist
    if (item.id) {
      return getImageUrl(`images/items/${item.id}.png`);
    }

    return undefined;
  }
};

// Helper function to get image for a material by ID
export const getMaterialImage = (materialId: string): string | undefined => {
  if (USE_LOCAL_DATA) {
    return imageMap[materialId];
  } else {
    return getImageUrl(`images/items/${materialId}.png`);
  }
};

// Helper function to capitalize material names
export const formatMaterialName = (materialId: string): string => {
  return materialId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const blacklistedItems = [
  "backpack_black_hiker_color",
  "cans_backpack_attachment",
  "banana",
  "blue_radio_renegade_color",
  "blue_gate_cellar_key",
  "blue_gate_communication_tower_key",
  "blue_gate_confiscation_room_key",
  "blue_gate_village_key",
  "buried_city_residential_master_key",
  "buried_city_town_hall_key",
  "buried_city_hospital_key",
  "dam_control_tower_key",
  "dam_staff_room_key",
  "dam_surveillance_key",
  "dam_testing_annex_key",
  "dam_utility_key",
  "flushing_terminal_key",
  "patrol_car_key",
  "raider_hatch_key",
  "spaceport_container_storage_key",
  "spaceport_control_tower_key",
  "spaceport_trench_tower_key",
  "spaceport_warehouse_key",
  "stella_montis_archives_key",
  "stella_montis_assembly_admin_key",
  "stella_montis_medical_storage_key",
  "stella_montis_security_checkpoint_key",
  "angled_grip_ii_blueprint",
  "angled_grip_iii_blueprint",
  "anvil_blueprint",
  "aphelion_blueprint",
  "barricade_kit_blueprint",
  "bettina_blueprint",
  "blaze_grenade_blueprint",
  "blue_light_stick_blueprint",
  "bobcat_blueprint",
  "burletta_blueprint",
  "combat_mk3_aggressive_blueprint",
  "combat_mk3_flanking_blueprint",
  "compensator_ii_blueprint",
  "compensator_iii_blueprint",
  "complex_gun_parts_blueprint",
  "deadline_blueprint",
  "defibrillator_blueprint",
  "equalizer_blueprint",
  "explosive_mine_blueprint",
  "extended_barrel_blueprint",
  "extended_light_mag_ii_blueprint",
  "extended_light_mag_iii_blueprint",
  "extended_medium_mag_ii_blueprint",
  "extended_medium_mag_iii_blueprint",
  "extended_shotgun_mag_ii_blueprint",
  "extended_shotgun_mag_iii_blueprint",
  "fireworks_box_blueprint",
  "gas_mine_blueprint",
  "green_light_stick_blueprint",
  "heavy_gun_parts_blueprint",
  "horizontal_grip_blueprint",
  "hullcracker_blueprint",
  "il_toro_blueprint",
  "jolt_mine_blueprint",
  "jupiter_blueprint",
  "light_gun_parts_blueprint",
  "lightweight_stock_blueprint",
  "looting_mk3_survivor_blueprint",
  "lure_grenade_blueprint",
  "medium_gun_parts_blueprint",
  "muzzle_brake_ii_blueprint",
  "muzzle_brake_iii_blueprint",
  "osprey_blueprint",
  "padded_stock_blueprint",
  "pulse_mine_blueprint",
  "red_light_stick_blueprint",
  "remote_raider_flare_blueprint",
  "seeker_grenade_blueprint",
  "shotgun_choke_ii_blueprint",
  "shotgun_choke_iii_blueprint",
  "shotgun_silencer_blueprint",
  "showstopper_blueprint",
  "silencer_i_blueprint",
  "silencer_ii_blueprint",
  "smoke_grenade_blueprint",
  "snap_hook_blueprint",
  "stable_stock_ii_blueprint",
  "stable_stock_iii_blueprint",
  "tactical_mk3_defensive_blueprint",
  "tactical_mk3_healing_blueprint",
  "tagging_grenade_blueprint",
  "tempest_blueprint",
  "torrente_blueprint",
  "trailblazer_blueprint",
  "trigger_nade_blueprint",
  "venator_blueprint",
  "vertical_grip_ii_blueprint",
  "vertical_grip_iii_blueprint",
  "vita_shot_blueprint",
  "vita_spray_blueprint",
  "vulcano_blueprint",
  "wolfpack_blueprint",
  "yellow_light_stick_blueprint",
  "cheer",
  "junior_outfit",
  "burgerboy",
  "celeste_journal",
  "esr_analyzer",
  "experimental_seed_sample",
  "first_wave_compass",
  "first_wave_rations",
  "first_wave_tape",
  "lidar_scanner",
  "major_aivas_patch",
  "radio_renegade",
];

// Helper function to filter blacklisted items
export const filterBlacklistedItems = (items: Item[]): Item[] => {
  return items.filter((item) => !blacklistedItems.includes(item.id));
};
