## 1. Rule and constants

- [x] 1.1 Add `SUPPORTED_VTHERM_MAJOR = 10` to `custom_components/vtherm_dashboard/const.py` and keep `SUPPORTED_CONFIG_VERSION = (2, 4)` as the version the embedded schema describes.
- [x] 1.2 Change `read_only_reason(entry, vtherm_major)` in `vtherm_config.py`: read-only unless the configuration major is the supported one and the package major equals `SUPPORTED_VTHERM_MAJOR`. An unknown major (`None`) is read-only. Keep the reason `config_version_newer`.
- [x] 1.3 Add `async_vtherm_major(hass)`, which reads the package version through `async_get_integration` and returns `None` for `IntegrationNotFound`, an absent version or an unparsable one.
- [x] 1.4 Pass `vtherm_major` through `list_thermostats`, `read_config`, `read_central_config` and `view_of`, which stay synchronous.

## 2. Boundaries

- [x] 2.1 In `websocket_api.py`, turn `ws_get_thermostats`, `ws_get_config`, `ws_get_central_config` and `ws_get_presets` into `async def` with `websocket_api.async_response`, and resolve the major once per request.
- [x] 2.2 Add `supported_vtherm_major` to the `ws_get_thermostats` payload, next to `supported_config_version`.
- [x] 2.3 In `config_flow_driver.py`, resolve the major before refusing to write, so a write is refused with the same reason as a read.

## 3. Frontend

- [x] 3.1 Add the optional `supported_vtherm_major` field to `frontend/src/config/api.ts` and to the `ws_get_thermostats` fixtures of `frontend/test/`.
- [x] 3.2 Reword the read-only message in `frontend/src/shell-translations.ts` and `frontend/src/native/catalogs/errors.ts` (en, fr, de) to say that the installed version could not be verified.

## 4. Tests

- [x] 4.1 Update `tests/test_vtherm_config.py` and `tests/test_websocket_config.py`: configuration `2.5` on package `10` is editable, package `11` and `9` are read-only, an unknown or unparsable package version is read-only, configuration major `1` or `3` is read-only, `IntegrationNotFound` is read-only, and the payload has `supported_vtherm_major`.
- [x] 4.2 Test the write path in `tests/test_config_flow_driver.py`, and compare `SUPPORTED_VTHERM_MAJOR` with the manifest of the development checkout.

## 5. Documentation

- [x] 5.1 Update `docs/reference/websocket-api.md` and `docs/contributing/config-flow-driver.md`.
- [x] 5.2 Add an entry to `CHANGELOG.md`.
