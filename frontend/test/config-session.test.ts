import { describe, expect, it, vi } from "vitest";

import type { ConfigApi } from "../src/config/api.ts";
import { ConfigSession } from "../src/config/config-session.ts";

function fakeApi(): ConfigApi & Record<string, ReturnType<typeof vi.fn>> {
  let cycle = 5;
  return {
    thermostats: vi.fn(async () => ({ thermostats: [{ id: "a", name: "Salon", type: "over_switch", read_only: false }], has_central_config: true, central_config_id: "c", supported_config_version: [2, 4], supported_vtherm_major: 10 })),
    config: vi.fn(async (id: string) => ({ id, name: "Salon", type: "over_switch", values: { cycle_min: cycle }, version: 2, minor_version: 4, read_only: false, read_only_reason: null })),
    centralConfig: vi.fn(),
    presets: vi.fn(async () => [{ preset: "eco_temp", entity_id: "number.eco", value: 17, min: 7, max: 35, step: 0.1, unit: "°C" }]),
    save: vi.fn(async (_id: string, changes: Record<string, Record<string, unknown>>) => {
      cycle = Number(changes["main"]?.["cycle_min"] ?? cycle);
      return { ok: true, config_saved: true, entry_id: "a", errors: [], preset_errors: [] };
    }),
    create: vi.fn(),
  } as unknown as ConfigApi & Record<string, ReturnType<typeof vi.fn>>;
}

describe("the configurations of the panel", () => {
  it("reads a configuration once, with its presets, and opens a draft", async () => {
    const api = fakeApi();
    const session = new ConfigSession(api);
    const [first, second] = await Promise.all([session.load("a"), session.load("a")]);
    expect(first).toBe(second);
    expect(api["config"]).toHaveBeenCalledTimes(1);
    expect(first.draft.values()).toEqual({ cycle_min: 5 });
    expect(first.draft.presets()).toEqual({ eco_temp: 17 });
  });

  it("keeps the draft while the configuration is open, and drops it when it is closed", async () => {
    const session = new ConfigSession(fakeApi());
    (await session.load("a")).draft.propose("main", { cycle_min: 8 });
    expect(session.dirtyDrafts()).toHaveLength(1);
    expect((await session.load("a")).draft.values()["cycle_min"]).toBe(8);
    session.close("a");
    expect(session.dirtyDrafts()).toHaveLength(0);
    expect((await session.load("a")).draft.values()["cycle_min"]).toBe(5);
  });

  it("reads the configuration and the list again after a save", async () => {
    const api = fakeApi();
    const session = new ConfigSession(api);
    (await session.load("a")).draft.propose("main", { cycle_min: 8 });
    const outcome = await session.save("a");
    expect(outcome.ok).toBe(true);
    expect(session.get("a")?.draft.dirty).toBe(false);
    expect(session.get("a")?.draft.savedValues()["cycle_min"]).toBe(8);
    expect(api["thermostats"]).toHaveBeenCalledTimes(1);
    expect(session.centralId).toBe("c");
  });

  it("tells its listeners when a draft changes", async () => {
    const session = new ConfigSession(fakeApi());
    const listener = vi.fn();
    session.subscribe(listener);
    (await session.load("a")).draft.propose("main", { cycle_min: 9 });
    expect(listener).toHaveBeenCalled();
  });
});

describe("the areas of the thermostats", () => {
  const located = (deviceArea: string | null, entityArea: string | null = null) => ({
    devices: { "device-a": { area_id: deviceArea } },
    entities: { "climate.salon": { area_id: entityArea } },
  });

  function sessionWithLocatedThermostat(): ConfigSession {
    const api = fakeApi();
    vi.mocked(api.thermostats).mockImplementation(async () => ({
      thermostats: [
        {
          id: "a",
          name: "Salon",
          type: "over_switch",
          read_only: false,
          device_id: "device-a",
          climate_entity_id: "climate.salon",
          area_id: "living",
          area_name: "Living room",
          floor_name: null,
          floor_level: null,
        },
      ],
      has_central_config: false,
      central_config_id: null,
      supported_config_version: [2, 4], supported_vtherm_major: 10,
    }));
    return new ConfigSession(api);
  }

  it("takes note of the areas first, then tells when the device of a thermostat moves to another area", async () => {
    const session = sessionWithLocatedThermostat();
    await session.refreshList();
    expect(session.areasMoved(located("living"))).toBe(false);
    expect(session.areasMoved(located("living"))).toBe(false);
    expect(session.areasMoved(located("office"))).toBe(true);
    expect(session.areasMoved(located("office"))).toBe(false);
  });

  it("tells when the climate entity gets an area of its own", async () => {
    const session = sessionWithLocatedThermostat();
    await session.refreshList();
    session.areasMoved(located("living"));
    expect(session.areasMoved(located("living", "office"))).toBe(true);
  });

  it("takes note of the areas again after the list is read again", async () => {
    const session = sessionWithLocatedThermostat();
    await session.refreshList();
    session.areasMoved(located("living"));
    await session.refreshList();
    expect(session.areasMoved(located("office"))).toBe(false);
  });

  it("does nothing without the list, or without the registries of the devices and of the entities", async () => {
    const session = sessionWithLocatedThermostat();
    expect(session.areasMoved(located("living"))).toBe(false);
    await session.refreshList();
    expect(session.areasMoved({})).toBe(false);
    expect(session.areasMoved({})).toBe(false);
  });
});

describe("the creation of a configuration", () => {
  const complete = { name: "Office", temperature_sensor_entity_id: "sensor.office", external_temperature_sensor_entity_id: "sensor.outdoor", underlying_entity_ids: ["switch.office"] };

  const createCalls = (api: ConfigApi) => vi.mocked(api.create).mock.calls;

  function creating(response: unknown = { ok: true, entry_id: "new_entry", errors: [] }) {
    const api = fakeApi();
    vi.mocked(api.create).mockResolvedValue(response as never);
    return { api, session: new ConfigSession(api) };
  }

  it("starts a draft of the first type, which stays the same until it is closed", () => {
    const { session } = creating();
    const draft = session.startCreation("thermostat");
    expect(session.startCreation("thermostat")).toBe(draft);
    expect(session.creation("thermostat")?.draft).toBe(draft);
    expect(draft.values()).toMatchObject({ thermostat_type: "thermostat_over_switch", use_main_central_config: false });
    expect(draft.dirty).toBe(false);
    expect(session.creation("central")).toBeUndefined();
  });

  it("sends a section for every section of the creation that applies, with the changes of the draft", async () => {
    const { api, session } = creating();
    const draft = session.startCreation("thermostat");
    draft.propose("main", { name: "Office", temperature_sensor_entity_id: "sensor.office", external_temperature_sensor_entity_id: "sensor.outdoor" });
    draft.propose("type", { underlying_entity_ids: ["switch.office"] });
    draft.propose("tpi", { tpi_coef_int: 0.7 });
    expect(await session.create("thermostat")).toEqual({ ok: true, entryId: "new_entry" });
    const [type, changes] = createCalls(api)[0] as [string, Record<string, Record<string, unknown>>];
    expect(type).toBe("thermostat_over_switch");
    expect(Object.keys(changes).sort()).toEqual(["advanced", "main", "tpi", "type"]);
    expect(changes["tpi"]).toEqual({ tpi_coef_int: 0.7 });
    expect(changes["advanced"]).toEqual({});
    expect(changes["main"]).toMatchObject({ name: "Office", use_main_central_config: false });
  });

  it("does not send a section that does not apply, nor its changes", async () => {
    const { api, session } = creating();
    const draft = session.startCreation("thermostat");
    draft.propose("tpi", { tpi_coef_int: 0.7 });
    draft.changeType("thermostat_over_climate");
    draft.propose("tpi", { tpi_coef_int: 0.7 });
    await session.create("thermostat");
    const [type, changes] = createCalls(api)[0] as [string, Record<string, unknown>];
    expect(type).toBe("thermostat_over_climate");
    expect(Object.keys(changes).sort()).toEqual(["advanced", "main", "type"]);
  });

  it("sends the main, TPI and advanced sections of the central configuration", async () => {
    const { api, session } = creating();
    session.startCreation("central").propose("main", { external_temperature_sensor_entity_id: "sensor.outdoor" });
    await session.create("central");
    const [type, changes] = createCalls(api)[0] as [string, Record<string, unknown>];
    expect(type).toBe("thermostat_central_config");
    expect(Object.keys(changes).sort()).toEqual(["advanced", "main", "tpi"]);
  });

  it("uses the central configuration when one exists", async () => {
    const { api, session } = creating();
    await session.refreshList();
    expect(session.startCreation("thermostat").values()["use_main_central_config"]).toBe(true);
    await session.create("thermostat");
    expect(createCalls(api)[0]?.[1]).toMatchObject({ main: { use_main_central_config: true } });
  });

  it("drops the draft and reads the list again once the configuration is created", async () => {
    const { api, session } = creating();
    session.startCreation("thermostat").propose("main", complete);
    await session.create("thermostat");
    expect(session.creation("thermostat")).toBeUndefined();
    expect(api["thermostats"]).toHaveBeenCalledTimes(1);
  });

  it("keeps the draft and puts the errors on it when the creation is refused", async () => {
    const { api, session } = creating({ ok: false, entry_id: null, errors: [{ tab: "main", field: "name", code: "name_exists" }] });
    const draft = session.startCreation("thermostat");
    draft.propose("main", complete);
    expect(await session.create("thermostat")).toEqual({ ok: false, entryId: null });
    expect(session.creation("thermostat")?.draft).toBe(draft);
    expect(draft.errorsOf("main")).toEqual({ name: "name_exists" });
    expect(draft.dirty).toBe(true);
    expect(api["thermostats"]).not.toHaveBeenCalled();
  });
});
