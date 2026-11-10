import type { ModuleConfig, ModuleSecrets } from './config.js'

export type Params = Record<string, string | number | boolean | undefined>

/** Subset of the JSON returned by `cmd=deviceInfo`. Fully adds fields over time, so everything is optional. */
export type DeviceInfo = {
	deviceName?: string
	model?: string
	manufacturer?: string
	androidVersion?: string
	version?: string
	ip4?: string
	Mac?: string
	SSID?: string
	wifiSignalLevel?: number
	batteryLevel?: number
	isPlugged?: boolean
	screenOn?: boolean
	screenBrightness?: number
	isInScreensaver?: boolean
	kioskMode?: boolean
	kioskLocked?: boolean
	maintenanceMode?: boolean
	currentPageUrl?: string
	currentTabIndex?: number
	startUrl?: string
	motionDetectorStarted?: boolean
	/** One single-key object per stream, e.g. [{"3": 73}, {"4": 50}] */
	audioVolumes?: Record<string, number>[]
	[key: string]: unknown
}

/** Current volume (0-100) of an Android audio stream, if reported. */
export function streamVolume(info: DeviceInfo, stream: number): number | undefined {
	for (const entry of info.audioVolumes ?? []) {
		const v = entry[String(stream)]
		if (typeof v === 'number') return v
	}
	return undefined
}

export function buildUrl(
	config: ModuleConfig,
	secrets: ModuleSecrets | undefined,
	cmd: string,
	params: Params = {},
): URL {
	const url = new URL(`http://${config.host}:${config.port}/`)
	url.searchParams.set('cmd', cmd)
	url.searchParams.set('type', 'json')
	if (secrets?.password) url.searchParams.set('password', secrets.password)
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
	}
	return url
}

/** Calls the Fully Kiosk REST API. Throws on network errors, timeouts and non-2xx replies. */
export async function callApi(
	config: ModuleConfig,
	secrets: ModuleSecrets | undefined,
	cmd: string,
	params: Params = {},
): Promise<unknown> {
	const res = await fetch(buildUrl(config, secrets, cmd, params), { signal: AbortSignal.timeout(5000) })
	const text = await res.text()
	if (!res.ok) {
		throw new Error(
			res.status === 403 ? 'Wrong Remote Admin password (HTTP 403)' : `HTTP ${res.status} ${res.statusText}`,
		)
	}
	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}

/** Fully answers failed commands with HTTP 200 and `{"status":"Error","statustext":"..."}`. */
export function replyError(reply: unknown): string | undefined {
	if (reply && typeof reply === 'object' && 'status' in reply && reply.status === 'Error') {
		return 'statustext' in reply && typeof reply.statustext === 'string' ? reply.statustext : 'Unknown error'
	}
	return undefined
}
