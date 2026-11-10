import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig, type ModuleSecrets } from './config.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { callApi, replyError, streamVolume, type DeviceInfo, type Params } from './api.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: ModuleSecrets
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // Setup in init()
	secrets: ModuleSecrets | undefined

	/** Latest `deviceInfo` reply (only filled while polling is enabled) */
	info: DeviceInfo = {}
	private timer?: NodeJS.Timeout
	private polling = false

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()
		this.start()
	}

	async destroy(): Promise<void> {
		this.stop()
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets
		this.stop()
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()
		this.start()
	}

	private start(): void {
		if (!this.config.host || !this.config.port) {
			this.updateStatus(InstanceStatus.BadConfig, 'Host and port required')
			return
		}
		this.updateStatus(InstanceStatus.Connecting)
		if (this.config.polling) {
			this.timer = setInterval(() => void this.poll(), Math.max(1, this.config.pollInterval) * 1000)
			void this.poll()
		} else {
			// Without polling there is no status to read; do one check so bad settings are noticed.
			void this.poll()
		}
	}

	private stop(): void {
		clearInterval(this.timer)
		this.timer = undefined
		this.info = {}
	}

	/** Send a command; failures are logged and reflected in the instance status. */
	async send(cmd: string, params: Params = {}): Promise<unknown> {
		try {
			const reply = await callApi(this.config, this.secrets, cmd, params)
			const err = replyError(reply)
			if (err) {
				this.log('warn', `${cmd}: ${err}`)
				return reply
			}
			this.updateStatus(InstanceStatus.Ok)
			return reply
		} catch (e) {
			this.fail(e)
			return undefined
		}
	}

	private fail(e: unknown): void {
		const msg = e instanceof Error ? e.message : String(e)
		this.log('error', msg)
		this.updateStatus(InstanceStatus.ConnectionFailure, msg)
	}

	/** Refresh device info, then update variables/feedbacks if polling is enabled. */
	async poll(): Promise<void> {
		if (this.polling) return
		this.polling = true
		try {
			const reply = await callApi(this.config, this.secrets, 'deviceInfo')
			const err = replyError(reply)
			if (err || typeof reply !== 'object' || reply === null) {
				this.updateStatus(InstanceStatus.ConnectionFailure, err ?? 'Unexpected reply (is Remote Admin enabled?)')
				return
			}
			this.updateStatus(InstanceStatus.Ok)
			if (!this.config.polling) return
			this.info = reply as DeviceInfo
			this.setVariableValues(variableValues(this.info))
			this.checkFeedbacks('state', 'battery_low')
		} catch (e) {
			this.fail(e)
		} finally {
			this.polling = false
		}
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}
}

function variableValues(i: DeviceInfo): Partial<VariablesSchema> {
	const s = (v: unknown): string => (typeof v === 'string' || typeof v === 'number' ? String(v) : '')
	const yn = (v: unknown): string => (v === undefined ? '' : v ? 'Yes' : 'No')
	return {
		device_name: s(i.deviceName),
		device_model: s(i.model),
		android_version: s(i.androidVersion),
		app_version: s(i.version),
		ip: s(i.ip4),
		wifi_ssid: s(i.SSID).replace(/^"|"$/g, ''),
		wifi_signal: s(i.wifiSignalLevel),
		battery: s(i.batteryLevel),
		plugged: yn(i.isPlugged),
		screen_on: yn(i.screenOn),
		brightness: s(i.screenBrightness),
		screensaver: yn(i.isInScreensaver),
		kiosk_locked: yn(i.kioskLocked),
		current_page: s(i.currentPageUrl),
		current_tab: s(i.currentTabIndex),
		volume_music: s(streamVolume(i, 3)),
		volume_tts: s(streamVolume(i, 9)),
		volume_system: s(streamVolume(i, 1)),
		volume_alarm: s(streamVolume(i, 4)),
		volume_notification: s(streamVolume(i, 5)),
		volume_ring: s(streamVolume(i, 2)),
	}
}
