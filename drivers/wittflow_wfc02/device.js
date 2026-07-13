'use strict';

const Homey = require('homey');

const NORMAL_POLL_MS = 5000;
const BACKOFF_POLL_MS = 120000;
const TRANSIENT_NETWORK_ERRORS = ['EHOSTUNREACH', 'ENETUNREACH', 'ECONNREFUSED', 'ETIMEDOUT'];
const FLOW_RATE_CAPABILITY = 'measure_water';
const FLOW_TOTAL_CAPABILITY = 'meter_water';

function isFiniteNumber(value)
{
	const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
	return Number.isFinite(parsed);
}

function toNumberOrNull(value)
{
	if (!isFiniteNumber(value))
	{
		return null;
	}

	return Number.parseFloat(value);
}

function firstNumber(status, keys)
{
	for (const key of keys)
	{
		if (status[key] === undefined || status[key] === null)
		{
			continue;
		}

		const parsed = toNumberOrNull(status[key]);
		if (parsed !== null)
		{
			return parsed;
		}
	}

	return null;
}

function summarizeControlStatus(status)
{
	if (!status || typeof status !== 'object')
	{
		return 'no status payload';
	}

	return JSON.stringify({
		model: status.model,
		water_status: status.water_status,
		iot_running: status.iot_running,
		wfc02_position: status.wfc02_position,
		warning: status.warning,
	});
}

module.exports = class WFC02Device extends Homey.Device
{

	async ensureFlowCapabilities(flowVelocity, meterWater)
	{
		if (flowVelocity !== null && flowVelocity > 0 && !this.hasCapability(FLOW_RATE_CAPABILITY))
		{
			await this.addCapability(FLOW_RATE_CAPABILITY);
		}

		if (meterWater !== null && meterWater > 0 && !this.hasCapability(FLOW_TOTAL_CAPABILITY))
		{
			await this.addCapability(FLOW_TOTAL_CAPABILITY);
		}
	}

	getDeviceModel()
	{
		const model = Number.parseInt(this.getData().model, 10);
		return Number.isFinite(model) ? model : 3;
	}

	getDeviceNickname()
	{
		const nickname = this.getData().nickname;
		return typeof nickname === 'string' ? nickname : null;
	}

	async updateDataModelIfNeeded(reportedModel)
	{
		const parsedModel = Number.parseInt(reportedModel, 10);
		if (!Number.isFinite(parsedModel) || parsedModel === this.getDeviceModel())
		{
			return;
		}

		await this.setData({
			...this.getData(),
			model: parsedModel,
		});
		this.homey.app.updateLog(`WFC02 model updated to ${parsedModel}`);
	}

	async onInit()
	{
		this.homey.app.updateLog('WFC02 Device has been initialized');
		this.isDeleted = false;

		this.registerCapabilityListener('onoff', this.onOnOff.bind(this));

		this.updateTimer = this.homey.setTimeout(() =>
		{
			this.updateStatus();
		}, NORMAL_POLL_MS);
	}

	async onDeleted()
	{
		this.homey.app.updateLog('WFC02 Device has been deleted');
		this.isDeleted = true;
		if (this.updateTimer)
		{
			this.homey.clearTimeout(this.updateTimer);
			this.updateTimer = null;
		}
	}

	async setDeviceWarning(message)
	{
		try
		{
			await this.setWarning(message);
		}
		catch (warningError)
		{
			this.homey.app.logError('Failed to set device warning:', warningError);
		}
	}

	async clearDeviceWarning()
	{
		try
		{
			await this.unsetWarning();
		}
		catch (warningError)
		{
			this.homey.app.logError('Failed to clear device warning:', warningError);
		}
	}

	async logControlStatus(label, address, model, id)
	{
		try
		{
			const data = await this.homey.app.getIOTDeviceStatus(address, model, id);
			const status = Array.isArray(data?.command) ? data.command[0] : null;
			this.homey.app.updateLog(`WFC02 ${label} status: ${summarizeControlStatus(status)}`);
		}
		catch (error)
		{
			this.homey.app.logError(`Failed to read WFC02 ${label} status:`, error);
		}
	}

	async onOnOff(value)
	{
		const address = this.getSettings().address;
		const model = this.getDeviceModel();
		const id = this.getData().id;

		this.homey.app.updateLog(`Sending WFC02 on/off command: value=${value}, model=${model}, id=${id}, address=${address}`);
		await this.homey.app.setIOTDeviceOnOff(address, model, id, value);
		await this.logControlStatus('immediate post-command', address, model, id);

		if (!this.isDeleted)
		{
			this.homey.setTimeout(() =>
			{
				this.logControlStatus('delayed post-command', address, model, id).catch(this.homey.app.logError);
			}, 3000);
		}
	}

	async refreshAddressFromIOTList()
	{
		const devices = await this.homey.app.getIOTDeviceList();
		const currentData = this.getData();
		const foundDevice = devices
			.flatMap(deviceGroup => deviceGroup.command || [])
			.find(candidate => candidate.id === currentData.id || (currentData.nickname && candidate.nickname === currentData.nickname));

		if (!foundDevice || !foundDevice.gatewayIP)
		{
			return { found: false, changed: false };
		}

		const currentAddress = this.getSettings().address;
		const changed = currentAddress !== foundDevice.gatewayIP;
		if (changed)
		{
			await this.setSettings({ address: foundDevice.gatewayIP });
			this.homey.app.updateLog(`WFC02 IP updated from ${currentAddress} to ${foundDevice.gatewayIP}`);
		}

		const nextModel = Number.isFinite(foundDevice.model) ? foundDevice.model : currentData.model;
		const nextNickname = foundDevice.nickname || currentData.nickname || null;
		if (nextModel !== currentData.model || nextNickname !== currentData.nickname)
		{
			await this.setData({
				...currentData,
				model: nextModel,
				nickname: nextNickname,
			});
		}

		return { found: true, changed };
	}

	async applyStatus(status)
	{
		const updates = [];

		const temperature = firstNumber(status, ['water_temp', 'data_water_t']);
		if (temperature !== null)
		{
			updates.push(this.setCapabilityValue('measure_temperature', temperature));
		}

		const onoffRaw = firstNumber(status, ['water_status', 'iot_running']);
		if (onoffRaw !== null)
		{
			updates.push(this.setCapabilityValue('onoff', onoffRaw === 1));
		}

		const batteryRaw = firstNumber(status, ['iotbatt', 'battery', 'wfc02batt']);
		if (batteryRaw !== null)
		{
			const batteryPercent = batteryRaw <= 5 ? batteryRaw * 20 : batteryRaw;
			updates.push(this.setCapabilityValue('measure_battery', Math.max(0, Math.min(100, batteryPercent))));
		}

		const signal = firstNumber(status, ['rssi', 'signal']);
		if (signal !== null)
		{
			updates.push(this.setCapabilityValue('measure_signal_strength', signal));
		}

		const warning = firstNumber(status, ['warning']);
		if (warning !== null)
		{
			updates.push(this.setCapabilityValue('alarm_water', (warning & 2) === 2));
			updates.push(this.setCapabilityValue('alarm_leak', (warning & 1) === 1));
		}

		const flowVelocity = firstNumber(status, ['wfc02_flow_velocity', 'flow_velocity']);
		const meterWater = firstNumber(status, ['velocity_total', 'happen_water']);

		await this.ensureFlowCapabilities(flowVelocity, meterWater);

		if (flowVelocity !== null && this.hasCapability(FLOW_RATE_CAPABILITY))
		{
			updates.push(this.setCapabilityValue(FLOW_RATE_CAPABILITY, flowVelocity));
		}

		if (meterWater !== null && this.hasCapability(FLOW_TOTAL_CAPABILITY))
		{
			updates.push(this.setCapabilityValue(FLOW_TOTAL_CAPABILITY, meterWater));
		}

		const valvePosition = firstNumber(status, ['wfc02_position']);
		if (valvePosition !== null)
		{
			const normalizedValvePosition = Math.max(0, Math.min(100, Math.round(valvePosition)));
			const currentValvePosition = this.getCapabilityValue('measure_valve_position');

			if (currentValvePosition !== normalizedValvePosition)
			{
				updates.push(this.setCapabilityValue('measure_valve_position', normalizedValvePosition));

				this.homey.app.measure_valve_position_changedTrigger
					?.trigger(this, { measure_valve_position: normalizedValvePosition }, { value: normalizedValvePosition })
					.catch(this.homey.app.logError);

				this.homey.app.measure_valve_position_threshold_changedTrigger
					?.trigger(this, { measure_valve_position: normalizedValvePosition }, { value: normalizedValvePosition })
					.catch(this.homey.app.logError);
			}
		}

		if (updates.length === 0)
		{
			throw new Error('Unexpected status response: no supported payload fields found');
		}

		await Promise.all(updates);
	}

	async updateStatus()
	{
		if (this.isDeleted)
		{
			return;
		}

		let nextPollMs = NORMAL_POLL_MS;

		try
		{
			const data = await this.homey.app.getIOTDeviceStatus(this.getSettings().address, this.getDeviceModel(), this.getData().id);
			if (!data || !Array.isArray(data.command) || data.command.length === 0)
			{
				throw new Error('Unexpected status response: missing command payload');
			}

			const status = data.command[0];
			await this.updateDataModelIfNeeded(status.model);
			await this.clearDeviceWarning();
			await this.applyStatus(status);
		}
		catch (error)
		{
			if (TRANSIENT_NETWORK_ERRORS.includes(error.code))
			{
				try
				{
					const rediscoveryResult = await this.refreshAddressFromIOTList();
					if (!rediscoveryResult.found || !rediscoveryResult.changed)
					{
						nextPollMs = BACKOFF_POLL_MS;
						await this.setDeviceWarning('Device unreachable. Retrying in 2 minutes.');
					}
					else
					{
						await this.setDeviceWarning('Device unreachable; address rediscovered. Retrying shortly.');
					}
				}
				catch (rediscoveryError)
				{
					nextPollMs = BACKOFF_POLL_MS;
					this.homey.app.logError('Failed to rediscover WFC02 address:', rediscoveryError);
					await this.setDeviceWarning('Device unreachable and address check failed. Retrying in 2 minutes.');
				}
			}
			else
			{
				this.homey.app.logError('Failed to update WFC02 status:', error);
				await this.setDeviceWarning(`Failed to update device status ${error.message}`);
			}
		}

		if (!this.isDeleted)
		{
			this.updateTimer = this.homey.setTimeout(() =>
			{
				this.updateStatus();
			}, nextPollMs);
		}
	}

};
