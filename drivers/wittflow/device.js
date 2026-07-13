'use strict';

const Homey = require('homey');

const NORMAL_POLL_MS = 5000;
const BACKOFF_POLL_MS = 120000;
const TRANSIENT_NETWORK_ERRORS = ['EHOSTUNREACH', 'ENETUNREACH', 'ECONNREFUSED', 'ETIMEDOUT'];

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

module.exports = class MyDevice extends Homey.Device
{

	async applyStatus(status)
	{
		const updates = [];

		const temperature = firstNumber(status, ['water_temp']);
		if (temperature !== null)
		{
			updates.push(this.setCapabilityValue('measure_temperature', temperature));
		}

		const onoffRaw = firstNumber(status, ['water_status']);
		if (onoffRaw !== null)
		{
			updates.push(this.setCapabilityValue('onoff', onoffRaw === 1));
		}

		const batteryRaw = firstNumber(status, ['wfc01batt', 'battery']);
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

		const flowVelocity = firstNumber(status, ['flow_velocity']);
		const meterWater = firstNumber(status, ['happen_water']);

		if (flowVelocity !== null)
		{
			updates.push(this.setCapabilityValue('measure_water', flowVelocity));
		}

		if (meterWater !== null)
		{
			updates.push(this.setCapabilityValue('meter_water', meterWater));
		}

		if (updates.length === 0)
		{
			throw new Error('Unexpected status response: no supported payload fields found');
		}

		await Promise.all(updates);
	}

	/**
	 * onInit is called when the device is initialized.
	 */
	async onInit()
	{
		this.homey.app.updateLog('MyDevice has been initialized');
		this.isDeleted = false;
		// Register capability listeners
		this.registerCapabilityListener('onoff', this.onOnOff.bind(this));

		this.updateTimer = this.homey.setTimeout(() =>
		{
			this.updateStatus();
		}, NORMAL_POLL_MS);
	}

	/**
	 * onAdded is called when the user adds the device, called just after pairing.
	 */
	async onAdded()
	{
		this.homey.app.updateLog('MyDevice has been added');
	}

	/**
	 * onSettings is called when the user updates the device's settings.
	 * @param {object} event the onSettings event data
	 * @param {object} event.oldSettings The old settings object
	 * @param {object} event.newSettings The new settings object
	 * @param {string[]} event.changedKeys An array of keys changed since the previous version
	 * @returns {Promise<string|void>} return a custom message that will be displayed
	 */
	async onSettings({ oldSettings, newSettings, changedKeys })
	{
		this.homey.app.updateLog('MyDevice settings where changed');
	}

	/**
	 * onRenamed is called when the user updates the device's name.
	 * This method can be used this to synchronise the name to the device.
	 * @param {string} name The new name
	 */
	async onRenamed(name)
	{
		this.homey.app.updateLog('MyDevice was renamed');
	}

	/**
	 * onDeleted is called when the user deleted the device.
	 */
	async onDeleted()
	{
		this.homey.app.updateLog('MyDevice has been deleted');
		this.isDeleted = true;
		if (this.updateTimer) {
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

	async onOnOff(value)
	{
		this.homey.app.updateLog(`MyDevice onOff set to ${value}`);
		await this.homey.app.setIOTDeviceOnOff(this.getSettings().address, 1, this.getData().id, value);
	}

	async refreshAddressFromIOTList()
	{
		const devices = await this.homey.app.getIOTDeviceList();
		const deviceID = this.getData().id;
		const foundDevice = devices
			.flatMap(deviceGroup => deviceGroup.command || [])
			.find(device => device.id === deviceID);

		if (!foundDevice || !foundDevice.gatewayIP)
		{
			return { found: false, changed: false };
		}

		const currentAddress = this.getSettings().address;
		if (currentAddress !== foundDevice.gatewayIP)
		{
			await this.setSettings({ address: foundDevice.gatewayIP });
			this.homey.app.updateLog(`WittFlow IP updated from ${currentAddress} to ${foundDevice.gatewayIP}`);
			return { found: true, changed: true };
		}

		return { found: true, changed: false };
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
			const data = await this.homey.app.getIOTDeviceStatus(this.getSettings().address, 1, this.getData().id);
			if (!data || !Array.isArray(data.command) || data.command.length === 0)
			{
				throw new Error('Unexpected status response: missing command payload');
			}

			const status = data.command[0];
			await this.clearDeviceWarning();
			await this.applyStatus(status);
		}
		catch (error)
		{
			if (TRANSIENT_NETWORK_ERRORS.includes(error.code))
			{
				this.homey.app.updateLog(`Transient network error (${error.code}) while polling WittFlow at ${this.getSettings().address}; trying IP rediscovery.`);

				try
				{
					const rediscoveryResult = await this.refreshAddressFromIOTList();
					if (!rediscoveryResult.found)
					{
						nextPollMs = BACKOFF_POLL_MS;
						await this.setDeviceWarning('Device unreachable and IP rediscovery failed. Retrying in 2 minutes.');
					}
					else if (!rediscoveryResult.changed)
					{
						nextPollMs = BACKOFF_POLL_MS;
						await this.setDeviceWarning('Device unreachable and IP is unchanged. Retrying in 2 minutes.');
					}
					else
					{
						await this.setDeviceWarning('Device unreachable; address rediscovered. Retrying shortly.');
					}
				}
				catch (rediscoveryError)
				{
					nextPollMs = BACKOFF_POLL_MS;
					this.homey.app.logError('Failed to rediscover WittFlow address:', rediscoveryError);
					await this.setDeviceWarning('Device unreachable and address check failed. Retrying in 2 minutes.');
				}
			}
			else
			{
				this.homey.app.logError('Failed to update device status:', error);
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
