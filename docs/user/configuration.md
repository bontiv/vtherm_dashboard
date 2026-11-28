# Configuring thermostats
Audience: users.

The dashboard edits the configuration of Versatile Thermostat without the screens of Home Assistant. It uses the same rules as
those screens: a value that the flow of Versatile Thermostat refuses is refused here too, with the same message.

## Where to configure
- **Thermostats tab**: open a thermostat, then one of the sections of its menu.
- **Configuration gear, groups "General settings" and "Optional features"**: the sections of the central configuration, which the
  thermostats can share.

## Change, save, discard
A change is kept in a draft. As in the configuration pages of Home Assistant, the actions are at the foot of the card of each
section: **Discard** on the left and **Save** on the right. They are off while the draft has no change. After a change, "Unsaved
changes" shows above them.

- **Save** writes the whole draft at once, the changes of every section. While it saves, the button shows its indicator; then it
  turns green with a check mark for two seconds. If a field is refused, nothing is written, the button turns red with an alert icon,
  and the error shows under the field; an error that concerns no field shows above the actions. The temperatures of the presets are
  applied after the configuration. If one of them fails, the configuration is still saved, the button turns red and a warning above
  the actions says so.
- **Discard** goes back to the saved values, in every section.
- When a save is refused because of a value of another section, the message above the actions offers **Go to** that section, which
  opens it with the refused field shown. The section has the status `Error` in the menu until you change the value.
- On a phone, scroll to the foot of the card to reach the actions.
- You can go from a section to another of the same thermostat: the draft stays. Leaving the thermostat, or the central
  configuration, asks you to confirm, and drops the draft. Closing the browser tab asks too.

A thermostat saved by a newer Versatile Thermostat than the dashboard knows is shown read-only, with a message. Change it in the
screens of Home Assistant, or update the dashboard.

## The fields
The fields are those of Home Assistant, as in its own settings:

- An entity is chosen in the entity picker, with its search, its name, its device and its area. Each field only offers the entities
  that Versatile Thermostat accepts there: a temperature sensor offers the `sensor` entities of class temperature and the
  `input_number` and `number` entities. An entity already saved stays shown even if the picker would not offer it.
- The underlyings of a thermostat are a list of entities, in an order that you can change by dragging. The commands and the opening
  degrees go with the underlyings by position.
- The commands of a thermostat on switch are given for each underlying, in front of it: a service, chosen in the service picker of
  Home Assistant, and an optional attribute with its value (`option:comfort`). They are required for an underlying that is not a
  switch; a switch uses its default commands. A command that the picker cannot show (another format, a service that Home Assistant
  does not list) is shown as it is, in a text field.
- The services of the central boiler are an entity, a service and an optional attribute.
- A delay is a number with its unit, minutes or seconds, as Versatile Thermostat stores it.
- The fields of a section are tiles on a grid: on a wide screen, several fields share a line; on a phone, they are on one column. A
  list of entities, a template and the commands take the whole width.
- The settings that are rarely changed, such as the minimal delays and the thresholds of TPI, the settings of Auto TPI, the keep-alive
  of a switch, the commands or the code of the lock, are in the closed panel **Advanced settings (N)** at the end of their section,
  with their number. It opens by itself when one of them is refused, or is required and has no value.
- An entity of the central configuration shown in a section opens its card of Home Assistant when you click it.
- Under each field, a short hint says what it changes. A field with a button (i) at its right has more: the button opens, under the
  field, an explanation and often a diagram of the setting, drawn with the values that you are typing, the central ones when the
  section uses the central configuration. The panel stays open while you change the field; the button or Escape closes it. The diagram
  highlights the setting of the field that you are in. The fields that share a diagram, such as the openings of a valve, the
  coefficients of TPI or the detection of a window by a drop of temperature, show it next to them, without opening any help.

When the dashboard is opened directly, its sections may show "Loading the controls of Home Assistant" for a moment. A version of
Home Assistant without these controls (they were checked on Home Assistant 2026.10) shows plain fields instead, with the same values.

## Create the central configuration
Until it exists, the section "Central configuration" of the gear offers to create it. **Create the central configuration** opens
its sections in the same page as for any configuration: Main attributes, TPI parameters and Safety and manual override, with the default
values of Versatile Thermostat. Change what you need, then press **Create** at the foot of the card of any section. The thermostats
that use the central configuration can then start. **Cancel** drops the creation, without asking, and brings back the offer.

## Create a thermostat
In the Thermostats tab, **Create a thermostat** first asks what the thermostat controls, with one card per type: switch a heater on and off (over a switch), drive a device with its own thermostat (over a climate), or set how far a valve opens (over a valve). Each card gives
examples of devices. Click a card, or press Enter or Space on it, and the page of a new thermostat then opens, the same as for an existing one, with a menu on the left and one
section at a time. The menu only lists what a new thermostat needs, in this order:

1. **Main attributes**.
2. **Underlyings**, the devices that the thermostat controls. Its form depends on the type.
3. **TPI parameters**, when the type uses them.
4. **Safety and manual override**: the safety mode, the manual override and the repair of an incorrect state. Versatile Thermostat calls this step "Advanced parameters".

To change the type later, select **New thermostat** in the breadcrumb above the page: the choice of the type opens again, with
your draft kept. Changing the type keeps the values that the new type accepts, such as the name and the sensors, and drops the
others, such as an underlying of another domain. No card is selected when the choice opens; when you come back, the card of the type you chose is outlined. **Cancel** on the choice of the type drops the creation.
The features, the presets and the sections of the add-ons are on the page of the thermostat once it is created.

**Create** replaces **Save**, and **Cancel** replaces **Discard**. **Create** stays off while a required field is empty. A warning at the top of the page, above the card, says which ones, section by
section, and goes away once nothing is missing. In the section that is open, each required field that is still empty is drawn in the error color of your theme and marked "Required", and it returns to normal once it has a value. When Versatile Thermostat refuses the creation, the error shows on its field
and your draft stays. When it succeeds, the overview of the new thermostat opens. Leaving a creation that has a value asks you to
confirm, as for any draft; **Cancel** does not ask.

When there is a central configuration, a new thermostat uses it by default. Without a central configuration, the options that need
one are off and cannot be turned on, and the new thermostat has its own TPI and safety parameters, with the defaults of Versatile
Thermostat unless you change them in the sections "TPI parameters" and "Safety and manual override".

## Use the central configuration
Most sections have a switch **Customize for this thermostat**. While it is off, the section uses the central configuration: it shows
the central values as chips, `label: value`, with the names of the entities, and the link **Edit the central configuration**, which
opens the same section of the general configuration (with unsaved changes, the dashboard asks first). When the central configuration
has no value for the section, the section says that the defaults of Versatile Thermostat apply. Turn the switch on to give this
thermostat its own values: it turns off the option "Use the central configuration" of Versatile Thermostat. While there is no
central configuration, the switch is on and cannot be turned off, and says why.

## The sections, one by one
The menu groups the sections under two headings, for a thermostat as for the central configuration. A section appears only when it
applies to the thermostat. The sections of the general settings show no check mark when nothing is missing: they are always on.

**General settings**, the sections that cannot be turned off, from what the thermostat is to its expert settings:

| Section | Appears when | What it configures |
| --- | --- | --- |
| Main attributes | always | Name, temperature sensors, cycle, and whether the thermostat uses the central configuration. |
| Underlyings | thermostat only | The devices that the thermostat controls. The form depends on the type. |
| Presets | switch, climate and valve thermostats | The temperature of each preset, in a table. They are `number` entities, saved after the configuration. See [The presets table](#the-presets-table). |
| TPI parameters | the proportional function is TPI, or a valve regulates | The TPI coefficients, and Auto TPI with its learning type. |
| Valve regulation | a climate that regulates with a valve | The valves, their offsets and their opening. |
| Safety and manual override | always | The safety mode, the manual override and the repair of an incorrect state. Versatile Thermostat calls this section "Advanced parameters". |

**Optional features**, the sections that can be off. A section whose feature is off stays in the menu with the status `Off`, and
offers to turn it on. The switch stays above the section while the feature is on, to turn it off; it is the only place to turn a
feature on or off, and the save actions are at the foot of its card while the feature is off:

| Section | Appears when | Off when | What it configures |
| --- | --- | --- | --- |
| Central boiler | central configuration | the feature is off | The services that start and stop the central boiler. |
| Window | always | the feature is off | How to detect an open window, **Opening sensor** or **Temperature drop**, then the sensor or the thresholds of the detection, the delays and the action. See [The detection of a window](#the-detection-of-a-window). |
| Motion | always | the feature is off | The motion sensor, the delays and the presets. |
| Power | always | the feature is off | The power sensors and the shedding. |
| Presence | always | the feature is off | The presence sensor and the presets. |
| Auto start and stop | climate thermostat without valve regulation | the feature is off | The automatic start and stop of the device. |
| Sync device internal temperature | climate thermostat | the option of the section Underlyings is off | The synchronization of the internal temperature of the device. Turning it on in place checks the option of the section Underlyings. |
| Lock | always | it blocks neither the commands of the users nor the ones of the automations | The lock of the thermostat, with an optional code. A thermostat that uses a central lock that blocks nothing shows `Central (off)`. |
| Humidity | thermostat only | **Use humidity sensor** is unchecked | A humidity sensor. The dashboard suggests the one of the same device. |
| Heating failure detection | the features of the type offer it | the feature is off | The thresholds of the detection. |

The identifiers of these sections, which a UI plugin can use to place its own tab, are in [Native UI plugins](../plugins/native-plugins.md).

## What VT would do with these settings
The sections TPI parameters, Window and Safety and manual override of a thermostat end with a closed panel **What VT would do with these settings**.
Open it to see the effect of the values of the page, before you save them. Every value that the dashboard computes is marked
*estimation*: it applies the rules of Versatile Thermostat to the values of the page, and to the history that Home Assistant
recorded; it does not predict how the room would have reacted to other settings.

- **TPI parameters**: **Now** gives the heating share that TPI would apply now, decomposed into the room part and the outdoor part
  (0 without an outdoor sensor), and how long the heater would be on and off in a cycle, with the reason when a rule changes it (a
  pulse shorter than the minimal activation delay, the thresholds). Try another setpoint in the panel without changing the one of
  the thermostat. **24 h** and **7 days** replay the period: the room, the setpoint, the share estimated with your settings (dashed)
  and the share recorded by VT, their means, the mean time to reach the setpoint (lowered setpoints left out), the largest overshoot
  and the time within ±0.5° of the setpoint. The two shares differ when the settings or the mode changed during the period.
- **Window**, with the method **Temperature drop**: the slope of the temperature over 24 h or 7 days, the periods where a window
  would have been detected with your thresholds, and the strongest drop. A detection longer than the maximum duration stops there.
- **Safety and manual override**: the silences of the room and outdoor sensors over 24 h or 7 days, those longer than the safety delay, and the
  longest. VT enters the safety mode only while the heating share is at least the minimal share of safety. A thermostat over a
  climate without valve regulation never enters it, so the panel says so.

The history is read only while the panel is open, for the entities of this thermostat, and kept a few minutes. While a thermostat
is being created, the panel gives only the estimation of now. When the history is too short or cannot be read, the panel says so.

## The detection of a window
The section Window asks first **How to detect an open window?**, with two buttons:

- **Opening sensor**: the section asks for the sensor, a `binary_sensor` or an `input_boolean`. Until it is chosen, the section has the
  status `1 missing`.
- **Temperature drop**: the section shows the thresholds of the detection (opening, closing) and its maximum duration, with the
  defaults of Versatile Thermostat.

The choice comes from the values: the sensor when the thermostat has one, the drop of temperature when it has a threshold of
detection without a sensor, otherwise the sensor. Choosing a method removes the values of the other one from the draft: the sensor
when you choose the drop of temperature, the thresholds of this thermostat when you choose the sensor. The thresholds that come from
the central configuration are not touched.

## The presets table
The Presets section shows the temperatures as a table: one row for each preset (frost, eco, comfort, boost) and one column for each
situation.

- **Columns.** Normal is always there. Away appears when the presence feature is on, Air conditioning when the AC mode is on, and
  Air conditioning, away when both are on. The general configuration shows all four. A cell with no preset entity shows "—". If you
  turn a feature on and have not saved yet, its column shows "—" and a note says that the temperatures exist after the save.
- **Cells.** Each cell is a compact number field with the unit, the limits and the step of the entity. A comma or a point both work as
  the decimal separator. A dot beside a cell and a colored border mean that its value is not saved yet. A value beyond the limits or
  that is not a number marks the cell as invalid, explains why under the table, and stays out of the draft. A temperature that Home
  Assistant refuses at the save marks its cell the same way.
- **Draft.** The changes stay in the draft, like every other field, and are written by **Save**.
- **Order warning.** If a heating column is not frost ≤ eco ≤ comfort ≤ boost, a warning names the two presets. In an air conditioning
  column the expected order is the opposite. The warning does not block the save.
- **Central presets.** When the section uses the central presets, the table shows them read-only, with a link to the Presets of the
  general configuration. If the draft has unsaved changes, the dashboard asks before it leaves the page.
- **Narrow screens.** When the card is narrower than 520 px, each preset becomes a block, with its situations in a two-column grid and
  no horizontal scroll.
