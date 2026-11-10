import type ModuleInstance from './main.js'

export type VariablesSchema = {
	device_name: string
	device_model: string
	android_version: string
	app_version: string
	ip: string
	wifi_ssid: string
	wifi_signal: string
	battery: string
	plugged: string
	screen_on: string
	brightness: string
	screensaver: string
	kiosk_locked: string
	current_page: string
	current_tab: string
	volume_music: string
	volume_tts: string
	volume_system: string
	volume_alarm: string
	volume_notification: string
	volume_ring: string
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	// Variables are only filled while polling is enabled
	if (!self.config.polling) {
		self.setVariableDefinitions({} as never) // no data without polling
		return
	}
	self.setVariableDefinitions({
		device_name: { name: 'Device name' },
		device_model: { name: 'Device model' },
		android_version: { name: 'Android version' },
		app_version: { name: 'Fully Kiosk version' },
		ip: { name: 'IPv4 address' },
		wifi_ssid: { name: 'Wi-Fi SSID' },
		wifi_signal: { name: 'Wi-Fi signal level' },
		battery: { name: 'Battery level (%)' },
		plugged: { name: 'Plugged in' },
		screen_on: { name: 'Screen on' },
		brightness: { name: 'Screen brightness (0-255)' },
		screensaver: { name: 'Screensaver active' },
		kiosk_locked: { name: 'Kiosk locked' },
		current_page: { name: 'Current page URL' },
		current_tab: { name: 'Current tab index' },
		volume_music: { name: 'Volume: music / media (%)' },
		volume_tts: { name: 'Volume: text-to-speech (%)' },
		volume_system: { name: 'Volume: system (%)' },
		volume_alarm: { name: 'Volume: alarm (%)' },
		volume_notification: { name: 'Volume: notification (%)' },
		volume_ring: { name: 'Volume: ring (%)' },
	})
}
