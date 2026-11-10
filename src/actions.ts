import type { CompanionActionDefinitions } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { streamVolume, type Params } from './api.js'

/** Commands without parameters: id doubles as the REST `cmd` name. */
const simpleCommands = {
	loadStartUrl: 'Browser: load start URL',
	refreshTab: 'Browser: reload current tab',
	clearCache: 'Browser: clear cache',
	clearWebstorage: 'Browser: clear web storage',
	clearCookies: 'Browser: clear cookies',
	resetWebview: 'Browser: reset WebView',
	screenOn: 'Screen: turn on',
	screenOff: 'Screen: turn off',
	forceSleep: 'Screen: force sleep (device admin only)',
	triggerMotion: 'Screen: simulate motion (wake up)',
	startScreensaver: 'Screensaver: start',
	stopScreensaver: 'Screensaver: stop',
	lockKiosk: 'Kiosk: lock',
	unlockKiosk: 'Kiosk: unlock',
	enableLockedMode: 'Kiosk: enable locked mode',
	disableLockedMode: 'Kiosk: disable locked mode',
	toForeground: 'App: bring Fully to foreground',
	toBackground: 'App: send Fully to background',
	restartApp: 'App: restart Fully',
	exitApp: 'App: exit Fully',
	stopTextToSpeech: 'Audio: stop text-to-speech',
	stopSound: 'Audio: stop sound',
	stopVideo: 'Audio: stop video',
	rebootDevice: 'Device: reboot (rooted/provisioned only)',
	shutdownDevice: 'Device: shut down (rooted only)',
} as const

type SimpleId = keyof typeof simpleCommands

export type ActionsSchema = {
	[K in SimpleId]: { options: Record<string, never> }
} & {
	loadUrl: { options: { url: string; newtab: boolean; focus: boolean } }
	focusTab: { options: { tab: number } }
	closeTab: { options: { tab: number } }
	injectJavascript: { options: { code: string } }
	startApplication: { options: { package: string } }
	startIntent: { options: { url: string } }
	setOverlayMessage: { options: { text: string } }
	textToSpeech: { options: { text: string; locale: string; engine: string; queue: boolean } }
	volume_step: { options: { step: number; stream: number } }
	setAudioVolume: { options: { level: number; stream: number } }
	playSound: { options: { url: string; loop: boolean; stream: number } }
	playVideo: {
		options: { url: string; loop: boolean; showControls: boolean; exitOnTouch: boolean; exitOnCompletion: boolean }
	}
	setBrightness: { options: { level: number } }
	screen_toggle: { options: Record<string, never> }
	brightness_step: { options: { step: number } }
	setBooleanSetting: { options: { key: string; value: boolean } }
	setStringSetting: { options: { key: string; value: string } }
	customCommand: { options: { cmd: string; params: string } }
}

const streams = [
	{ id: 0, label: 'Voice call' },
	{ id: 1, label: 'System' },
	{ id: 2, label: 'Ring' },
	{ id: 3, label: 'Music / media' },
	{ id: 4, label: 'Alarm' },
	{ id: 5, label: 'Notification' },
	{ id: 6, label: 'Bluetooth' },
	{ id: 8, label: 'DTMF' },
	{ id: 9, label: 'Text-to-speech' },
	{ id: 10, label: 'Accessibility' },
]

const text = <K extends string>(id: K, label: string, def = '', extra: Partial<{ multiline: boolean }> = {}) =>
	({ id, type: 'textinput', label, default: def, useVariables: true, ...extra }) as const
const bool = <K extends string>(id: K, label: string, def = false) =>
	({ id, type: 'checkbox', label, default: def }) as const

/** Fully expects "true"/"false" strings. */
const b = (v: boolean): string => (v ? 'true' : 'false')

export function UpdateActions(self: ModuleInstance): void {
	const run = async (cmd: string, params: Params = {}) => self.send(cmd, params)

	const defs: Record<string, unknown> = {}

	for (const [id, name] of Object.entries(simpleCommands)) {
		defs[id] = { name, options: [], callback: async () => void (await run(id)) }
	}

	const custom: Omit<CompanionActionDefinitions<ActionsSchema>, SimpleId> = {
		loadUrl: {
			name: 'Browser: load URL',
			options: [text('url', 'URL', 'https://'), bool('newtab', 'Open in new tab'), bool('focus', 'Focus the tab')],
			callback: async (e) =>
				void (await run('loadUrl', { url: e.options.url, newtab: b(e.options.newtab), focus: b(e.options.focus) })),
		},
		focusTab: {
			name: 'Browser: focus tab',
			options: [{ id: 'tab', type: 'number', label: 'Tab index (0-based)', default: 0, min: 0, max: 99 }],
			callback: async (e) => void (await run('focusTab', { tab: e.options.tab })),
		},
		closeTab: {
			name: 'Browser: close tab',
			options: [{ id: 'tab', type: 'number', label: 'Tab index (0-based)', default: 0, min: 0, max: 99 }],
			callback: async (e) => void (await run('closeTab', { tab: e.options.tab })),
		},
		injectJavascript: {
			name: 'Browser: inject JavaScript',
			options: [text('code', 'JavaScript code', '', { multiline: true })],
			callback: async (e) => void (await run('injectJavascript', { code: e.options.code })),
		},
		startApplication: {
			name: 'App: start Android application',
			options: [text('package', 'Package name', 'com.android.settings')],
			callback: async (e) => void (await run('startApplication', { package: e.options.package })),
		},
		startIntent: {
			name: 'App: start intent',
			options: [text('url', 'Intent URL', 'intent:#Intent;...;end')],
			callback: async (e) => void (await run('startIntent', { url: e.options.url })),
		},
		setOverlayMessage: {
			name: 'Screen: set overlay message',
			description: 'Shows text over the page. An empty text removes the message.',
			options: [text('text', 'Text')],
			callback: async (e) => void (await run('setOverlayMessage', { text: e.options.text })),
		},
		textToSpeech: {
			name: 'Audio: text-to-speech',
			options: [
				text('text', 'Text', 'Hello'),
				text('locale', 'Locale (optional, e.g. en_US)'),
				text('engine', 'TTS engine package (optional)'),
				bool('queue', 'Add to queue instead of replacing'),
			],
			callback: async (e) =>
				void (await run('textToSpeech', {
					text: e.options.text,
					locale: e.options.locale,
					engine: e.options.engine,
					queue: e.options.queue ? 1 : 0,
				})),
		},
		setAudioVolume: {
			name: 'Audio: set volume',
			options: [
				{ id: 'level', type: 'number', label: 'Level (%)', default: 50, min: 0, max: 100 },
				{ id: 'stream', type: 'dropdown', label: 'Stream', default: 3, choices: streams },
			],
			callback: async (e) => void (await run('setAudioVolume', { level: e.options.level, stream: e.options.stream })),
		},
		volume_step: {
			name: 'Audio: change volume by step',
			description: 'Needs "Poll device status" to know the current volume.',
			options: [
				{ id: 'step', type: 'number', label: 'Step (%)', default: 10, min: -100, max: 100 },
				{ id: 'stream', type: 'dropdown', label: 'Stream', default: 3, choices: streams },
			],
			callback: async (e) => {
				const cur = streamVolume(self.info, e.options.stream)
				if (cur === undefined) {
					self.log('warn', 'Volume of this stream unknown; enable polling')
					return
				}
				const level = Math.max(0, Math.min(100, cur + e.options.step))
				await run('setAudioVolume', { level, stream: e.options.stream })
				void self.poll()
			},
		},
		playSound: {
			name: 'Audio: play sound',
			options: [
				text('url', 'Sound URL', 'https://'),
				bool('loop', 'Loop'),
				{ id: 'stream', type: 'dropdown', label: 'Stream', default: 3, choices: streams },
			],
			callback: async (e) =>
				void (await run('playSound', { url: e.options.url, loop: b(e.options.loop), stream: e.options.stream })),
		},
		playVideo: {
			name: 'Audio: play video',
			options: [
				text('url', 'Video URL', 'https://'),
				bool('loop', 'Loop'),
				bool('showControls', 'Show controls', true),
				bool('exitOnTouch', 'Exit on touch', true),
				bool('exitOnCompletion', 'Exit on completion', true),
			],
			callback: async (e) =>
				void (await run('playVideo', {
					url: e.options.url,
					loop: e.options.loop ? 1 : 0,
					showControls: e.options.showControls ? 1 : 0,
					exitOnTouch: e.options.exitOnTouch ? 1 : 0,
					exitOnCompletion: e.options.exitOnCompletion ? 1 : 0,
				})),
		},
		setBrightness: {
			name: 'Screen: set brightness',
			options: [{ id: 'level', type: 'number', label: 'Brightness (0-255)', default: 128, min: 0, max: 255 }],
			callback: async (e) => void (await run('setStringSetting', { key: 'screenBrightness', value: e.options.level })),
		},
		screen_toggle: {
			name: 'Screen: toggle on/off',
			description: 'Switches the screen based on the polled screen state.',
			options: [],
			callback: async () => {
				if (typeof self.info.screenOn !== 'boolean') {
					self.log('warn', 'Screen state unknown; waiting for the first poll')
					return
				}
				await run(self.info.screenOn ? 'screenOff' : 'screenOn')
				// Reflect the change immediately; the next poll confirms it
				self.info.screenOn = !self.info.screenOn
				self.checkFeedbacks('state')
				void self.poll()
			},
		},
		brightness_step: {
			name: 'Screen: change brightness by step',
			description: 'Needs "Poll device status" to know the current brightness.',
			options: [{ id: 'step', type: 'number', label: 'Step (-255..255)', default: 25, min: -255, max: 255 }],
			callback: async (e) => {
				const cur = self.info.screenBrightness
				if (typeof cur !== 'number') {
					self.log('warn', 'Brightness unknown; enable polling')
					return
				}
				const level = Math.max(0, Math.min(255, cur + e.options.step))
				await run('setStringSetting', { key: 'screenBrightness', value: level })
				self.info.screenBrightness = level
				void self.poll()
			},
		},
		setBooleanSetting: {
			name: 'Settings: set boolean setting',
			description: 'Keys are listed in Fully\'s Remote Admin > Settings (e.g. "motionDetection").',
			options: [text('key', 'Key'), bool('value', 'Value')],
			callback: async (e) => void (await run('setBooleanSetting', { key: e.options.key, value: b(e.options.value) })),
		},
		setStringSetting: {
			name: 'Settings: set string setting',
			description: 'Keys are listed in Fully\'s Remote Admin > Settings (e.g. "startURL").',
			options: [text('key', 'Key'), text('value', 'Value')],
			callback: async (e) => void (await run('setStringSetting', { key: e.options.key, value: e.options.value })),
		},
		customCommand: {
			name: 'Custom command',
			description: 'Any REST command, e.g. cmd "loadUrl" with parameters "url=https://example.com&newtab=true".',
			options: [text('cmd', 'Command (cmd=)'), text('params', 'Parameters (key=value&key=value)')],
			callback: async (e) => {
				const params: Params = {}
				for (const [k, v] of new URLSearchParams(e.options.params)) params[k] = v
				await run(e.options.cmd, params)
			},
		},
	}
	Object.assign(defs, custom)

	// These actions need polled data, so only offer them when polling is on
	if (!self.config.polling) {
		delete defs['screen_toggle']
		delete defs['brightness_step']
		delete defs['volume_step']
	}

	self.setActionDefinitions(defs as CompanionActionDefinitions<ActionsSchema>)
}
