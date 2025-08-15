'use strict';

const Homey = require('homey');

module.exports = class MyDriver extends Homey.Driver
{

	/**
	 * onInit is called when the driver is initialized.
	 */
	async onInit()
	{
		this.log('MyDriver has been initialized');
	}

	/**
	 * onPairListDevices is called when a user is adding a device
	 * and the 'list_devices' view is called.
	 * This should return an array with the data of devices that are available for pairing.
	 */
	async onPairListDevices()
	{
		const devices = await this.homey.app.getIOTDeviceList();

		// Extract each device object from the command arrays that have "model": 1
		const filteredDevices = devices
			.flatMap(deviceGroup => deviceGroup.command || [])
			.filter(device => device.model === 1);

		// return an array of devices that has { name: `WittFlow : ${device.id}`, data: { id: device.id }, settings: { address: device.gatewayIP } };
		return filteredDevices.map(device => ({
			name: `WittFlow : ${device.id}`,
			data: { id: device.id },
			settings: { address: device.gatewayIP }
		}));
	}

};
