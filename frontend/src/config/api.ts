/** The WebSocket commands of the configuration of Versatile Thermostat. See docs/reference/websocket-api.md. */

import type { Hass } from "@vtherm/dashboard-sdk";

/** A thermostat of the list. */
export interface ThermostatEntry {
  readonly id: string;
  readonly name: string;
  readonly type: "over_switch" | "over_climate" | "over_valve";
  readonly read_only: boolean;
  /** The device of the thermostat in Home Assistant, or null when the registry has none. */
  readonly device_id: string | null;
  /** The climate entity of the thermostat, or null when the registry has none. */
  readonly climate_entity_id: string | null;
  /** The area of the thermostat: the own area of its climate entity, or else the area of its device. */
  readonly area_id: string | null;
  /** The name of the area when the list was read, a fallback for `hass.areas`. */
  readonly area_name: string | null;
  /** The floor of the area and its level when the list was read, a fallback for `hass.floors`. */
  readonly floor_name: string | null;
  readonly floor_level: number | null;
}

/** The list of the thermostats. */
export interface ThermostatList {
  readonly thermostats: readonly ThermostatEntry[];
  readonly has_central_config: boolean;
  readonly central_config_id: string | null;
  /** The version and the minor version of the configuration that the embedded schema describes. It is not the editing rule. */
  readonly supported_config_version: readonly number[];
  /** The major version of the Versatile Thermostat package that the dashboard has verified. Absent from a backend that predates it. */
  readonly supported_vtherm_major?: number;
}

/** The configuration of an entry. */
export interface ConfigData {
  readonly id: string;
  readonly name: string;
  readonly type: "central" | "over_switch" | "over_climate" | "over_valve";
  readonly values: Readonly<Record<string, unknown>>;
  readonly version: number;
  readonly minor_version: number;
  readonly read_only: boolean;
  readonly read_only_reason: string | null;
}

/** The temperature of a preset. */
export interface PresetData {
  readonly preset: string;
  readonly entity_id: string;
  readonly value: number | null;
  readonly min: number | null;
  readonly max: number | null;
  readonly step: number | null;
  readonly unit: string | null;
}

/** An error of a save. */
export interface SaveError {
  readonly tab: string | null;
  readonly field: string;
  readonly code: string;
}

/** The result of `save_config`. */
export interface SaveResponse {
  readonly ok: boolean;
  readonly config_saved: boolean;
  readonly entry_id: string | null;
  readonly errors: readonly SaveError[];
  readonly preset_errors: readonly SaveError[];
}

/** The result of `create_config`. */
export interface CreateResponse {
  readonly ok: boolean;
  readonly entry_id: string | null;
  readonly errors: readonly SaveError[];
}

/** The changes of a draft, by tab and by key. */
export type TabChanges = Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/** The commands, on a connection to Home Assistant. */
export interface ConfigApi {
  thermostats(): Promise<ThermostatList>;
  config(entryId: string): Promise<ConfigData>;
  centralConfig(): Promise<ConfigData | null>;
  presets(entryId: string): Promise<readonly PresetData[]>;
  save(entryId: string, changes: TabChanges, presets: Readonly<Record<string, number>>): Promise<SaveResponse>;
  create(thermostatType: string, changes: TabChanges): Promise<CreateResponse>;
}

/**
 * Give the commands of the configuration on a connection.
 *
 * @param hass - The state of Home Assistant.
 */
export function createConfigApi(hass: Pick<Hass, "callWS">): ConfigApi {
  const call = <Result>(message: Record<string, unknown>): Promise<Result> => hass.callWS<Result>(message);
  return {
    thermostats: () => call({ type: "vtherm_dashboard/get_thermostats" }),
    config: (entryId) => call({ type: "vtherm_dashboard/get_config", entry_id: entryId }),
    centralConfig: () => call({ type: "vtherm_dashboard/get_central_config" }),
    presets: async (entryId) => (await call<{ presets: PresetData[] }>({ type: "vtherm_dashboard/get_presets", entry_id: entryId })).presets,
    save: (entryId, changes, presets) => call({ type: "vtherm_dashboard/save_config", entry_id: entryId, changes, presets }),
    create: (thermostatType, changes) => call({ type: "vtherm_dashboard/create_config", thermostat_type: thermostatType, changes }),
  };
}
