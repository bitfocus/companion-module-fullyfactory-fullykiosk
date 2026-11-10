import type ModuleInstance from './main.js'
import type { DeviceInfo } from './api.js'

export type FeedbacksSchema = {
	state: { type: 'boolean'; options: { flag: StateFlag; invert: boolean } }
	battery_low: { type: 'boolean'; options: { threshold: number } }
}

type StateFlag = 'screenOn' | 'isInScreensaver' | 'kioskLocked' | 'isPlugged' | 'kioskMode' | 'maintenanceMode'

const flags: { id: StateFlag; label: string }[] = [
	{ id: 'screenOn', label: 'Screen is on' },
	{ id: 'isInScreensaver', label: 'Screensaver is active' },
	{ id: 'kioskLocked', label: 'Kiosk is locked' },
	{ id: 'isPlugged', label: 'Plugged in' },
	{ id: 'kioskMode', label: 'Kiosk mode enabled' },
	{ id: 'maintenanceMode', label: 'Maintenance mode' },
]

export function UpdateFeedbacks(self: ModuleInstance): void {
	// Feedbacks need polled data
	if (!self.config.polling) {
		self.setFeedbackDefinitions({} as never) // schema lists all feedbacks; none are offered without polling
		return
	}
	self.setFeedbackDefinitions({
		state: {
			name: 'Device state',
			description: 'True while the selected state flag reported by the device is set',
			type: 'boolean',
			defaultStyle: { bgcolor: 0x008000, color: 0xffffff },
			options: [
				{
					id: 'flag',
					type: 'dropdown',
					label: 'State',
					default: 'screenOn',
					choices: flags,
				},
				{ id: 'invert', type: 'checkbox', label: 'Invert (true while NOT set)', default: false },
			],
			callback: (fb) => {
				const v = self.info[fb.options.flag as keyof DeviceInfo]
				return typeof v === 'boolean' && v !== fb.options.invert
			},
		},
		battery_low: {
			name: 'Battery level below threshold',
			type: 'boolean',
			defaultStyle: { bgcolor: 0xff0000, color: 0xffffff },
			options: [{ id: 'threshold', type: 'number', label: 'Threshold (%)', default: 20, min: 0, max: 100 }],
			callback: (fb) => typeof self.info.batteryLevel === 'number' && self.info.batteryLevel < fb.options.threshold,
		},
	})
}
