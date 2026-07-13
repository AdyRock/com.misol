'use strict';

const Homey = require('homey');

module.exports = class MyDriver extends Homey.Driver
{

	isWFC01Device(device)
	{
		const nickname = typeof device?.nickname === 'string' ? device.nickname.toUpperCase() : '';
		return nickname.startsWith('WFC01') || device?.model === 1;
	}

	/**
	 * onInit is called when the driver is initialized.
	 */
	async onInit()
	{
		this.homey.app.updateLog('MyDriver has been initialized');
	}

	/**
	 * onPairListDevices is called when a user is adding a device
	 * and the 'list_devices' view is called.
	 * This should return an array with the data of devices that are available for pairing.
	 */
	async onPairListDevices()
	{
		const devices = await this.homey.app.getIOTDeviceList();

		// WFC01-only pairing.
		const filteredDevices = devices
			.flatMap(deviceGroup => deviceGroup.command || [])
			.filter(device => this.isWFC01Device(device));

		return filteredDevices.map(device => ({
			name: device.nickname || `WFC01 : ${device.id}`,
			data: {
				id: device.id,
				model: 1,
			},
			settings: { address: device.gatewayIP }
		}));
	}

	async onRepair(session, device)
	{
		// Argument session is a PairSocket, similar to Driver.onPair
		// Argument device is a Homey.Device that's being repaired
		session.setHandler('showView', async (viewId) =>
		{
			if (viewId === 'loading')
			{
				const devices = await this.homey.app.getIOTDeviceList();
				const deviceID = device.getData().id;

				// Find the device in the list of devices
				const foundDevice = devices
					.flatMap(deviceGroup => deviceGroup.command || [])
					.find(device => device.id === deviceID);

				if (foundDevice)
				{
					// If the device is found, update its settings with the new gateway IP
					await device.setSettings({ address: foundDevice.gatewayIP });
				}
				else
				{
					// If the device is not found, throw an error to indicate repair failure
					throw new Error(`Device with ID ${deviceID} not found during repair.`);
				}

				// 3. This MUST be called to trigger the "Success" state and auto-close
				await session.done();
			}
		});
	}

};
