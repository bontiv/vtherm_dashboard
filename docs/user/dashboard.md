# Using the dashboard

The Versatile Thermostat dashboard is where you look at and configure your Versatile Thermostat thermostats, in Home Assistant.
Audience: users.

## Open it

"Versatile Thermostat" appears in the side menu of Home Assistant, for administrators only. A user who is not an administrator does not
see it. It needs the Versatile Thermostat integration: Home Assistant does not load the dashboard without it.

Each page of the dashboard has its own address. You can bookmark a page, share its link, reload the browser on it, and use the
back button of the browser. An address that does not exist any more opens the default page of its tab, with a message that you
can close.

## The tabs

The bar at the top shows the tabs:

- **Dashboard**: an overview of your thermostats, with the widgets that the plugins add.
- **Thermostats**: the list of your thermostats, in full width. Open one to see its overview and its configuration.
- **VT add-ons** and the tabs that other plugins add.
- The **Configuration** gear, alone on the right: the general configuration of Versatile Thermostat and the pages of the
  dashboard itself. It has no text. Its name, Configuration, appears when you hover it, and a screen reader reads it.

The tab you are in is underlined.

## The list of the thermostats

The Thermostats tab shows each thermostat as a tile, live: the icon of its type, its name, the temperature of the room and the
setpoint (`19.5 °C → 21 °C`), what it does now (heating, cooling, idle or off, with a dot of the color of the action) and its preset.
When its climate entity is unavailable, the tile says so and still opens the thermostat. The last tile, **New thermostat**, opens the
creation of a thermostat. The tiles wrap to the width of the screen: one column on a phone.

The tiles are grouped by area, the rooms of Home Assistant. Each area has a heading with its icon and its name,
and the floor it is on when your home has floors. The areas are ordered by floor, then by name, and the thermostats of an area by name.

A thermostat is in the area of its device. If you gave its climate entity an area of its own in Home Assistant, that area wins, as
everywhere in Home Assistant. To change the area of a thermostat, change it in Home Assistant: the list follows at once, and so do the
names of the areas and of the floors when you rename them.

The thermostats without area come last, under **No area**. Give them an area in Home Assistant, on the page of their device.

Above the list, **By area** and **By name** let you choose the order. The dashboard remembers your choice in this browser. When none
of your thermostats has an area, the list is simply ordered by name, without headings and without this choice.

## The menu and the breadcrumb

Most tabs have a menu on the left. It lists the pages of the tab, and the page you are on is highlighted. Pages are grouped under
headings, such as "General settings", "Optional features" and "Dashboard" in the Configuration. The menu scrolls on its own when it is longer than the
screen, so the tabs and the page do not move. The Dashboard tab has no menu while it has a single page, its overview: the page takes
the full width.

In the Thermostats tab, the menu starts with a selector of thermostat, then the overview of the thermostat, then its pages under
two headings: **General settings**, the sections that every thermostat has, and **Optional features**, the ones that can be off. The
Configuration groups the sections of the central configuration the same way (see
[Configuring thermostats](configuration.md#the-sections-one-by-one)). The
selector orders the thermostats as the list does, and names each one with its area, for example `Living room · Sofa`.
When you choose another thermostat, the page you are on stays open if the new thermostat has it. Otherwise its overview opens.

Each section of the configuration of a thermostat, and of the central configuration, shows its status at the right of its title, in
the menu and in the drawer of a phone, as soon as you change a value, before you save:

| Status | Meaning |
| --- | --- |
| a check mark | Nothing required is missing, for a section of the optional features. A section of the general settings is always on: it shows nothing then. |
| `Central` | The section uses the central configuration. |
| `N missing` | N required values have no value. |
| `Off` | The section does nothing: its feature is off, the humidity sensor is not used, or the lock blocks neither the users nor the automations. The entry is in retreat. |
| `Central (off)` | The section uses the central configuration, and the central values make it do nothing, such as a central lock that blocks nothing. The entry is in retreat. |
| `Error` | The last save refused a value of the section. It goes away when you change the refused value, or when a save succeeds. |

When several apply, the first of `Error`, `Off`, `Central (off)`, `N missing`, `Central`, the check mark is shown. A screen reader says the status after
the title, for example "Window detection, off".

The sections of the features that are off (window, motion, power, presence, auto start and stop, central boiler, synchronization of the
temperature, heating failure detection) stay in the menu, so that you can find them. Open one: it explains the feature and has a switch
to turn it on. Turning it on shows its fields, with the switch above them to turn it off again; save to keep the change, with the
actions at the foot of the page. The synchronization of the temperature changes the same option as the section Underlyings. A feature that does not exist for the type of the thermostat, such as the auto
start and stop of a thermostat over a switch, is not in the menu. The sections Humidity and Lock have no such switch: their page shows
their options as usual, and checking one of them turns the section on.

Under the tabs, the breadcrumb shows where you are, for example `Thermostats > Salon > TPI`. Click a part of it to go back to that level.

## Fields, messages and windows

The dashboard uses the controls of Home Assistant, so they look and work as in the rest of Home Assistant:

- A field that takes an entity offers a search among your entities, limited to the right kind (for example temperature sensors). A
  list of entities, such as the underlyings of a thermostat, can be put in order by dragging.
- A delay or a temperature is a number with its unit.
- A message (an error, a warning, a field that is read only) is shown in a colored box with an icon.
- An entity shown as text, such as a value inherited from the central configuration, opens its card when you click it.
- When you leave a page with changes that are not saved, a window asks you to confirm. **Stay** keeps the page and your changes.

While Home Assistant loads its controls, the page shows a spinner for a moment. If they do not load, the page shows simpler fields that
do the same thing. See [the fields of the configuration](configuration.md#the-fields).

## The widgets

The overview of the Dashboard tab and the overview of a thermostat show widgets: cards that show how Versatile Thermostat is working
(measures, states, alerts). The widgets of the dashboard only show: none of them changes a mode, a preset or a setting. A widget
that a plugin adds can have buttons that change something; read what the plugin says before you use them.

- The cards are on a grid that uses the width of the screen. A widget can be wider (up to the whole row) or higher than the others;
  on a phone, every card takes the whole width. The cards keep the order that the plugins gave, which is also the order of the
  keyboard.
- A widget of a feature that is off, or whose sensor does not exist, is not shown at all: there is no empty card.
- A value that cannot be read, because its sensor is unavailable, shows "—", never 0. A card that waits for its history shows its
  title and a spinner; a card with nothing to show says why.
- The values are written in your language and with the units of Home Assistant (°C or °F): a temperature is "19,5 °C" in French.
  The age of a measure is written as "3 minutes ago"; point at it, or reach it with the Tab key, to read the full date.
- A state is always given by an icon and a text, never by a color alone. An alert is announced by screen readers.
- A widget that draws a history reads it only once its card is on the screen.

### The overview of a thermostat
The overview of a thermostat shows up to twenty cards, in this order. A card whose feature the thermostat does not have is not shown.
The values come from the `climate` entity of the thermostat and from the sensors that Versatile Thermostat creates for it.

- **Temperature**: the temperature of the room on a gauge whose ends are the minimum and the maximum of the setpoint, with the setpoint
  marked on it; the outdoor temperature of the thermostat; "requested → applied" when a feature (an open window, load shedding…) applies
  another setpoint than the one asked for; and the regulated setpoint of a thermostat over a climate that regulates.
- **Mode and action**: the mode (heating, cooling, off…) and what the thermostat does now (heating now, idle…), with the reason of an
  off or of a mode that was not asked for (window open, sleep mode, central mode…). The sleep mode and the central mode that applies are
  shown only when they apply. A reason that the dashboard does not know yet is shown as Versatile Thermostat writes it.
- **Alerts**: the messages of Versatile Thermostat (load shedding, safety mode, setpoint changed by a feature…), a thermostat that is not
  ready, the equipment that is unavailable (point at the alert to read the list), and a plugin that took the control. Then the age of the
  last measure of the room and of the outside: it turns to the color of a warning, with a clock icon, when it is older than the safety
  delay of the thermostat; without a safety delay, it stays neutral. With nothing to report, the card says "No alert".
- **Heating**: for a thermostat that uses TPI, the heating share asked for, and the times on and off of the cycle when Versatile Thermostat
  publishes them (thermostat over a switch). The position in the cycle is not shown: Versatile Thermostat does not publish it. The
  heating share over 24 hours is not in this card.
- **Valve**: for a thermostat over a valve, or over a climate with valves, the opening of the valve on a gauge, and a bar for each valve
  when there are several.
- **Preset**: the preset with its icon, a timed preset with its remaining time and its end, and a manual override with the preset that
  resumes. No bar shows the progress of a timed preset: its total duration is not published.
- **Safety**: whether the safety mode is on and, while it is, the heating share that it imposes, on a bar of the color of a warning.
  Shown only when the safety mode is configured, by the thermostat or by the central configuration.

Then a card for each feature that the thermostat uses, in this order. A feature that is off leaves no card.

- **Window**: the window sensor (open, closed or unknown), the detection by the drop of temperature when it is configured, the bypass
  when it is on, and what the open window does now: off, eco, frost protection, fan only, or none. The time left before the window
  acts is not shown: Versatile Thermostat does not publish when the window opened.
- **Motion**: motion or no motion, and "Activity preset in force" while Versatile Thermostat applies the preset of activity.
- **Load shedding**: "Load shedding active", in the color of a warning, or "No load shedding" with a check mark.
- **Auto start and stop**: for a thermostat over a climate, whether it is stopped by the feature, whether the feature is enabled, the
  accumulated error on a gauge whose ends and marker are its threshold, and how long ago it last switched. The next action is not
  shown: Versatile Thermostat does not publish one.
- **Lock**: a closed padlock and "Locked", or an open one and "Unlocked". The time of the automatic relock is not shown.
- **Heating failure**: a failure of the heating or of the cooling with its probable cause and a **More info** link that opens the
  entity in Home Assistant, a check in progress on a bar with the minutes elapsed and left, "Detection paused by the template" when a
  template pauses it, and "No failure" when there is nothing to report. It stays shown while the detection is on.

Then the details, and the history last:

- **Equipment**: each equipment of the thermostat (switches, valves, climates) with its name and its state, "unavailable" for one that
  Home Assistant cannot read, how many are active, "Expected active, off" when the thermostat asks for heat and no equipment is on,
  and the fan mode of a thermostat over a climate.
- **Auto TPI learning**: for a thermostat that uses TPI with the option Auto TPI, the state of the learning (active, starting, stopped),
  the heating cycles, the cycles learned for each coefficient, the coefficients computed, the confidence of the model as a percentage
  (it reaches 100 % after 50 cycles of each coefficient), the thermal time constant, the heating capacity, the status of the last
  learning as Versatile Thermostat writes it, and when the learning started. There is no button to start, stop or calibrate the
  learning: use the services of Versatile Thermostat.
- **Central boiler**: a flame and "Calls the boiler" while the thermostat, used by the central boiler, has an active equipment.
- **Energy**: the mean power of the cycle with its curve over 24 hours, and the energy used, with the unit of its sensor.
- **Humidity**: the humidity of the room on a gauge. It has no curve.
- **Tracking of the equipment**: for a thermostat over a climate, the temperature sent to each equipment, the value of each entity that
  it synchronises, and an alert when Versatile Thermostat suspended the tracking of the setpoint, with its reason and its attempts;
  point at the alert to read, for each equipment, the temperature sent and the one that the equipment reports.
- **Last 24 hours**: on two columns, the temperature of the room, the setpoint and the outdoor temperature of the sensor that the
  thermostat uses (its own, or the one of the central configuration), then the heating share on a second chart when the thermostat
  has one. Each chart has a text summary. The history is read only once the card is on the screen; when it cannot be read, the card
  says "History unavailable". Home Assistant does not record the values that Versatile Thermostat publishes inside its groups of
  attributes (the reasons, the managers, the details of the equipment): they have no curve.

None of these cards changes the mode, the setpoint or the preset, bypasses a window, locks the thermostat or turns a feature on: use
the card of the thermostat in Home Assistant for that.

### The Overview page
The Overview page of the Dashboard tab shows the whole home, in up to seven cards, in this order. A card whose feature is off in the
central configuration, or whose entity does not exist, is not shown; the others keep their order. With no thermostat and no central
configuration, the page says that there is nothing to show yet.

- **Central mode**: the central mode (Auto, Stopped, Heat only, Cool only, Frost protection) with its icon. A mode that the dashboard
  does not know yet is shown as Versatile Thermostat writes it. Shown when there is a central configuration.
- **Presence**: present, absent or unknown, read on the presence sensor of the central configuration as Versatile Thermostat reads it
  (`on` or `home` is present, `off` or `not_home` is absent). An unknown sensor is never shown as absent.
- **Thermostats**: on one column, a bar that counts the thermostats that heat, are idle, are off and are unavailable (a thermostat
  that cools adds its own part), with each number written; then the thermostats in alert (safety mode, load shedding, equipment
  unavailable, failure of the heating or of the cooling), each with the reason and a link to its overview. With none, "No alert". An
  unavailable thermostat is counted as unavailable, not as off.
- **Central boiler**: whether the boiler is on, the number of active devices on a gauge whose marker is the activation threshold, the
  thermostats that call the boiler (each with a link to its overview; a device that no thermostat claims is shown by its name), an
  hourglass with "Activation in 30 s" while the activation is delayed, and "Boiler not ready" when Versatile Thermostat says so.
- **Power asked of the boiler**: the power that the active thermostats ask of the boiler on a gauge whose marker is the power threshold,
  and its curve over the last 24 hours with the threshold, in the unit of the sensor (W or kW).
- **Power of the home**: the power of the home against its maximum ("4,1 / 6 kW"), the margin, and the energy of all the thermostats
  when their counters share one unit. The margin and the energy are computed by the dashboard, as their tooltip says. Above the maximum,
  the gauge turns to the color of a warning and the margin says by how much. Shown when the power management is on.
- **Outdoor temperature**: the outdoor sensor of the central configuration, with its unit, and its curve over the last 24 hours. When the
  history cannot be read, the card shows the value and "History unavailable".

The two curves are read only once their card is on the screen, and kept a few minutes. None of these cards changes the central mode or
the presence.

## No thermostat, no plugin

If you have no thermostat, the Thermostats tab says so and tells you to create one from the Configuration. Without any plugin of
your own, the dashboard shows the pages that come with it, and nothing else.

## On a phone

On a phone, in the Home Assistant app or in a browser, the dashboard is laid out for a narrow screen (under 700 px):

- The bar at the top starts with the button of the Home Assistant menu, to reach the other pages of Home Assistant. The title of the
  dashboard is not shown, so that the tabs have the whole width. The tabs scroll sideways, a shade shows on the side where tabs are
  hidden, and the open tab is always brought into view. The Configuration gear always stays visible.
- The menu of the pages is hidden. The **Menu of the pages** button, at the left of the breadcrumb, opens it as a drawer over the page,
  which is darkened.
  The drawer closes when you choose a page, when you touch the darkened page, or with the Escape key.
- The breadcrumb only shows its last two parts.
- Buttons, fields and lists are large enough to be touched, and long texts such as addresses wrap instead of widening the page.
- The bar that saves a configuration stays at the bottom of the screen; its buttons go under its message.

## The plugin status

The plugins add tabs, pages and widgets to the dashboard. Open **Configuration > Dashboard > Plugins** to see each plugin, where
it comes from, its state and, when it did not load, why. A plugin that does not load never stops the dashboard or the other plugins.

| State | What it means |
| --- | --- |
| Loaded | The plugin works. |
| Waiting | The plugin passed the checks and is being loaded. You only see it for a moment. |
| Missing dependency | The plugin needs another plugin that is not installed, did not load, or is not compatible. The page names the missing plugins. |
| Dashboard incompatible | The plugin was not made for this version of the dashboard. The page gives the version that it asks for and says whether the dashboard is older or more recent. Update the plugin, or the dashboard. |
| Dependency cycle | Several plugins wait for each other. The page lists them. This is a mistake of the plugin authors. |
| Invalid | The plugin declares something that is not valid, for example an address that is not allowed or a version constraint that cannot be read. |
| Failed | The plugin was downloaded but could not start. The page shows the error. |

The **Source** says whether a plugin is installed with an integration, comes with the dashboard (native), or is a plugin that a
developer tests from his own computer (development, with its address).

Each plugin has its own card. Under the plugins, the warnings and errors list the contributions that a plugin made but that the dashboard could not place as
asked, for example a menu entry placed after a page that does not exist.

## Colors

The dashboard has no colors of its own. It uses the colors, the fonts and the dark or light mode of the Home Assistant theme
that you chose, including a theme that you installed, and follows when you change theme.
