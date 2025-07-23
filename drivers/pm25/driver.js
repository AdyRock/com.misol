'use strict';

const { Driver } = require('homey');

class PM25Driver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('PM25Driver has been initialized');
    }

    async triggerAQChanged(device, tokens, state)
    {
		this.homey.app.measure_aq25_changedTrigger.trigger(device, tokens, state).catch(this.error);
    }

    async triggerAQAvgChanged(device, tokens, state)
    {
		this.homey.app.measure_aq25_avg_changedTrigger.trigger(device, tokens, state).catch(this.error);
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
            for (var i = 1; i < 8; i++)
            {
                const pm25Meter = "pm25_ch" + i;
                if (gateway[pm25Meter])
                {
                    const meter = { name:  `PM 25: Channel ${i}`, data: { id: gateway.PASSKEY + "_" + i, PASSKEY: gateway.PASSKEY, meterNumber: i } };
                    devices.push(meter);
                }
            }
        }

        return devices;
    }
}

module.exports = PM25Driver;