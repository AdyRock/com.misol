'use strict';

const Homey = require('homey');

const NORMAL_POLL_MS = 5000;
const BACKOFF_POLL_MS = 120000;
const TRANSIENT_NETWORK_ERRORS = ['EHOSTUNREACH', 'ENETUNREACH', 'ECONNREFUSED', 'ETIMEDOUT'];

module.exports = class MyDevice extends Homey.Device
{

	/**
	 * onInit is called when the device is initialized.
	 */
	async onInit()
	{
		this.log('MyDevice has been initialized');
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
		this.log('MyDevice has been added');
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
		this.log('MyDevice settings where changed');
	}

	/**
	 * onRenamed is called when the user updates the device's name.
	 * This method can be used this to synchronise the name to the device.
	 * @param {string} name The new name
	 */
	async onRenamed(name)
	{
		this.log('MyDevice was renamed');
	}

	/**
	 * onDeleted is called when the user deleted the device.
	 */
	async onDeleted()
	{
		this.log('MyDevice has been deleted');
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
			this.error('Failed to set device warning:', warningError);
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
			this.error('Failed to clear device warning:', warningError);
		}
	}

	async onOnOff(value)
	{
		this.log(`MyDevice onOff set to ${value}`);
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
			this.log(`WittFlow IP updated from ${currentAddress} to ${foundDevice.gatewayIP}`);
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
			await Promise.all([
				this.setCapabilityValue('measure_temperature', parseFloat(status.water_temp)),
				this.setCapabilityValue('onoff', status.water_status === 1),
				this.setCapabilityValue('measure_battery', status.wfc01batt * 20),
				this.setCapabilityValue('measure_signal_strength', status.rssi),
				this.setCapabilityValue('alarm_water', (status.warning & 2) === 2),
				this.setCapabilityValue('alarm_leak', (status.warning & 1) === 1),
				this.setCapabilityValue('measure_water', parseFloat(status.flow_velocity)),
				this.setCapabilityValue('meter_water', parseFloat(status.happen_water)),
			]);
		}
		catch (error)
		{
			if (TRANSIENT_NETWORK_ERRORS.includes(error.code))
			{
				this.log(`Transient network error (${error.code}) while polling WittFlow at ${this.getSettings().address}; trying IP rediscovery.`);

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
					this.error('Failed to rediscover WittFlow address:', rediscoveryError);
					await this.setDeviceWarning('Device unreachable and address check failed. Retrying in 2 minutes.');
				}
			}
			else
			{
				this.error('Failed to update device status:', error);
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
