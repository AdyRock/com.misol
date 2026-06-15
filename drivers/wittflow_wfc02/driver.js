'use strict';

const Homey = require('homey');

module.exports = class WFC02Driver extends Homey.Driver
{

	isWFC02Device(device)
	{
		const nickname = typeof device?.nickname === 'string' ? device.nickname.toUpperCase() : '';
		return nickname.startsWith('WFC02');
	}

	async onInit()
	{
		this.log('WFC02 Driver has been initialized');
	}

	async onPairListDevices()
	{
		const devices = await this.homey.app.getIOTDeviceList();

		const filteredDevices = devices
			.flatMap(deviceGroup => deviceGroup.command || [])
			.filter(device => this.isWFC02Device(device));

		return filteredDevices.map(device => ({
			name: device.nickname || `WFC02 : ${device.id}`,
			data: {
				id: device.id,
				model: Number.isFinite(device.model) ? device.model : 1,
				nickname: device.nickname || null,
			},
			settings: { address: device.gatewayIP },
		}));
	}

	async onRepair(session, device)
	{
		session.setHandler('showView', async (viewId) =>
		{
			if (viewId === 'loading')
			{
				const devices = await this.homey.app.getIOTDeviceList();
				const currentData = device.getData();
				const foundDevice = devices
					.flatMap(deviceGroup => deviceGroup.command || [])
					.find(candidate => candidate.id === currentData.id || (currentData.nickname && candidate.nickname === currentData.nickname));

				if (!foundDevice)
				{
					throw new Error(`Device with ID ${currentData.id} not found during repair.`);
				}

				await device.setSettings({ address: foundDevice.gatewayIP });

				const nextModel = Number.isFinite(foundDevice.model) ? foundDevice.model : currentData.model;
				const nextNickname = foundDevice.nickname || currentData.nickname || null;
				if (nextModel !== currentData.model || nextNickname !== currentData.nickname)
				{
					await device.setData({
						...currentData,
						model: nextModel,
						nickname: nextNickname,
					});
				}

				await session.done();
			}
		});
	}

};
