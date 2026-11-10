## Fully Kiosk Browser

Controls Android devices running [Fully Kiosk Browser](https://www.fully-kiosk.com) through its
[REST API](https://www.fully-kiosk.com/docs/en/api/rest).

### Setup in Fully Kiosk

Open **Settings → Remote Administration (PLUS)**, enable **Remote Administration**, and set a **Remote Admin Password**.
The API listens on port **2323** (plain HTTP; HTTPS is not supported by this module).

### Module configuration

- **Tablet IP / hostname**, **Remote Admin port** and **password** as above.
- **Poll device status**: reads the device info regularly. This enables the variables, the feedbacks, the actions that need the current state ("Screen: toggle on/off", "change brightness by step", "change volume by step") and the presets that use them. None of these are shown when polling is off. Without polling the module only sends commands.

### Actions

Browser (load URL, start URL, reload, tabs, clear cache/cookies/storage, inject JavaScript), screen (on/off, brightness, screensaver, overlay message), kiosk lock, app control (start application/intent, restart, exit), audio (text-to-speech, volume, sound, video), settings (set boolean/string setting) and a **Custom command** action for anything else in the API.

Some commands only work on rooted or provisioned devices, or with device admin rights; see the Fully Kiosk documentation.

### Audio, speech and video

- **Text-to-speech**: text, optional locale (e.g. `en_US`) and TTS engine package, and an option to queue instead of interrupting. **Stop text-to-speech** cancels it.
- **Play sound** / **Stop sound**: plays an audio file from a URL (optionally looped) on a chosen Android stream.
- **Play video** / **Stop video**: plays a video URL full screen, with options for loop, controls, exit on touch and exit on completion.
- **Set volume** / **Change volume by step**: per Android stream (the step action needs polling).

The URL must be reachable from the tablet.

### Feedbacks (polling only)

Device state (screen on, screensaver, kiosk locked, plugged in, kiosk mode, maintenance mode) and battery below threshold.

### Variables (polling only)

`device_name`, `device_model`, `android_version`, `app_version`, `ip`, `wifi_ssid`, `wifi_signal`, `battery`, `plugged`, `screen_on`, `brightness`, `screensaver`, `kiosk_locked`, `current_page`, `current_tab`, `volume_music`, `volume_tts`, `volume_system`, `volume_alarm`, `volume_notification`, `volume_ring`.
