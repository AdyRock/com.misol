'use strict';

const { Driver } = require('homey');

class CO2Driver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('CO2Driver has been initialized');
    }

    async triggerCo2QChanged(device, tokens, state)
    {
		this.homey.app.triggerCo2QChanged(device, tokens, state).catch(this.error);
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
			const co2Meter = "co2in";
			if (gateway[co2Meter])
            {
                const meter = { name: 'CO2', data: { id: gateway.PASSKEY, PASSKEY: gateway.PASSKEY } };
                devices.push(meter);
            }
        }

        return devices;
    }
}

module.exports = CO2Driver;