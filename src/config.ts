import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export type ModuleConfig = {
	host: string
	port: number
	polling: boolean
	pollInterval: number
}

export type ModuleSecrets = {
	password: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			label: 'Setup',
			width: 12,
			value:
				'In Fully Kiosk Browser enable <b>Settings → Remote Administration (PLUS) → Enable Remote Administration</b> and set a password. Plain HTTP only.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Tablet IP / hostname',
			width: 8,
			regex: Regex.SOMETHING,
		},
		{
			type: 'number',
			id: 'port',
			label: 'Remote Admin port',
			width: 4,
			min: 1,
			max: 65535,
			default: 2323,
		},
		{
			type: 'secret-text',
			id: 'password',
			label: 'Remote Admin password',
			width: 12,
		},
		{
			type: 'checkbox',
			id: 'polling',
			label: 'Poll device status',
			description: 'Enables variables and feedbacks (battery, screen, current page, ...).',
			width: 4,
			default: true,
		},
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Poll interval (s)',
			width: 4,
			min: 1,
			max: 3600,
			default: 5,
			isVisibleExpression: '$(options:polling)',
		},
	]
}
