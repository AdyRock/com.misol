'use strict';

const { Driver } = require('homey');

class LaserDriver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('Lightning Driver has been initialized');
    }

    /**
     * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
     * This should return an array with the data of devices that are available for pairing.
     */
    async onPairListDevices()
    {
        var devices = [];
		for (const gateway of this.homey.app.detectedGateways)
		{
			for (var i = 1; i <= 8; i++)
			{
				const laserDistance = "air_ch" + i;
				if (gateway[laserDistance])
				{
					const meter = { name: `Laser Distance Sensor: Channel ${i}`, data: { id: gateway.PASSKEY + "_" + i, PASSKEY: gateway.PASSKEY, meterNumber: i } };
					devices.push(meter);
				}
			}
		}

        return devices;
    }
}

module.exports = LaserDriver;