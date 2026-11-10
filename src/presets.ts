import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import type { CompanionPresetDefinitions, CompanionPresetSection } from '@companion-module/base'

export function UpdatePresets(self: ModuleInstance): void {
	const polling = self.config.polling
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}

	const simple = (
		id: string,
		text: string,
		action: { actionId: string; options?: Record<string, unknown> },
		bgcolor = 0x000000,
		feedbacks: never[] = [],
	): void => {
		presets[id] = {
			type: 'simple',
			name: text.replace(/\\n/g, ' '),
			style: { text, size: 'auto', color: 0xffffff, bgcolor },
			steps: [{ down: [{ actionId: action.actionId, options: action.options ?? {} } as never], up: [] }],
			feedbacks,
		}
	}

	simple('screen_on', 'Screen\\nON', { actionId: 'screenOn' })
	simple('screen_off', 'Screen\\nOFF', { actionId: 'screenOff' })
	simple('start_url', 'Load\\nstart URL', { actionId: 'loadStartUrl' })
	simple('refresh', 'Reload\\npage', { actionId: 'refreshTab' })
	simple('lock', 'Lock\\nkiosk', { actionId: 'lockKiosk' })
	simple('unlock', 'Unlock\\nkiosk', { actionId: 'unlockKiosk' })
	simple('screensaver', 'Start\\nscreensaver', { actionId: 'startScreensaver' })
	simple('restart', 'Restart\\napp', { actionId: 'restartApp' }, 0x800000)
	simple('tts', 'Say\\nHello', {
		actionId: 'textToSpeech',
		options: { text: 'Hello', locale: '', engine: '', queue: false },
	})
	simple('stop_video', 'Stop\\nvideo', { actionId: 'stopVideo' })
	simple('stop_sound', 'Stop\\nsound', { actionId: 'stopSound' })
	simple('stop_tts', 'Stop\\nspeech', { actionId: 'stopTextToSpeech' })

	if (polling) {
		simple('vol_up', 'Vol\\n+10', { actionId: 'volume_step', options: { step: 10, stream: 3 } })
		simple('vol_down', 'Vol\\n-10', { actionId: 'volume_step', options: { step: -10, stream: 3 } })
		simple('bright_up', 'Bright\\n+25', { actionId: 'brightness_step', options: { step: 25 } })
		simple('bright_down', 'Bright\\n-25', { actionId: 'brightness_step', options: { step: -25 } })
		simple('screen_toggle', 'Screen\\ntoggle', { actionId: 'screen_toggle' }, 0x000000, [
			{ feedbackId: 'state', options: { flag: 'screenOn', invert: false }, style: { bgcolor: 0x008000 } } as never,
			{ feedbackId: 'state', options: { flag: 'screenOn', invert: true }, style: { bgcolor: 0x800000 } } as never,
		])
		presets['battery'] = {
			type: 'simple',
			name: 'Battery level',
			style: {
				text: 'Battery\\n$(fullyfactory-fullykiosk:battery)%',
				size: 'auto',
				color: 0xffffff,
				bgcolor: 0x000000,
			},
			steps: [],
			feedbacks: [{ feedbackId: 'battery_low', options: { threshold: 20 }, style: { bgcolor: 0xff0000 } } as never],
		}
	}

	const group = (id: string, name: string, ids: string[]) => ({
		id,
		name,
		type: 'simple' as const,
		presets: ids,
	})

	const structure: CompanionPresetSection[] = [
		{
			id: 'screen',
			name: 'Screen',
			definitions: [
				group('screen_g', 'Screen & brightness', [
					'screen_on',
					'screen_off',
					'screensaver',
					...(polling ? ['bright_up', 'bright_down', 'screen_toggle'] : []),
				]),
			],
		},
		{
			id: 'browser',
			name: 'Browser & kiosk',
			definitions: [group('browser_g', 'Browser & kiosk', ['start_url', 'refresh', 'lock', 'unlock', 'restart'])],
		},
		{
			id: 'audio',
			name: 'Audio',
			definitions: [
				group('audio_g', 'Audio', [
					'tts',
					'stop_tts',
					'stop_sound',
					'stop_video',
					...(polling ? ['vol_up', 'vol_down'] : []),
				]),
			],
		},
		...(polling
			? [
					{
						id: 'status',
						name: 'Status',
						definitions: [group('status_g', 'Status', ['battery'])],
					},
				]
			: []),
	]

	self.setPresetDefinitions(structure, presets)
}
