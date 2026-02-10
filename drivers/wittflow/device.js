'use strict';

const Homey = require('homey');

module.exports = class MyDevice extends Homey.Device
{

	/**
	 * onInit is called when the device is initialized.
	 */
	async onInit()
	{
		this.log('MyDevice has been initialized');
		// Register capability listeners
		this.registerCapabilityListener('onoff', this.onOnOff.bind(this));

		this.updateTimer = this.homey.setTimeout(() =>
		{
			this.updateStatus();
		}, 5000);
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
		if (this.updateTimer) {
			this.homey.clearTimeout(this.updateTimer);
			this.updateTimer = null;
		}
	}

	async onOnOff(value)
	{
		this.log(`MyDevice onOff set to ${value}`);
		await this.homey.app.setIOTDeviceOnOff(this.getSettings().address, 1, this.getData().id, value);
	}

	async updateStatus()
	{
		try
		{
			const data = await this.homey.app.getIOTDeviceStatus(this.getSettings().address, 1, this.getData().id);
			const status = data.command[0];
			this.unsetWarning();
			this.setCapabilityValue('measure_temperature', parseFloat(status.water_temp));
			this.setCapabilityValue('onoff', status.water_status === 1);
			this.setCapabilityValue('measure_battery', status.wfc01batt * 20);
			this.setCapabilityValue('measure_signal_strength', status.rssi);
			this.setCapabilityValue('alarm_water', (status.warning & 2) === 2);
			this.setCapabilityValue('alarm_leak', (status.warning & 1) === 1);
			this.setCapabilityValue('measure_water', parseFloat(status.flow_velocity));
			this.setCapabilityValue('meter_water', parseFloat(status.happen_water));
		}
		catch (error)
		{
			this.error('Failed to update device status:', error);
			this.setWarning(`Failed to update device status ${error.message}`);
		}

		this.updateTimer = this.homey.setTimeout(() =>
		{
			this.updateStatus();
		}, 5000);
	}

};
