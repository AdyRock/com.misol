'use strict';

const { Driver } = require('homey');

class LeafWetnessDriver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('LeafWetnessDriver has been initialized');
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
            for (var i = 1; i <= 16; i++)
            {
                const leafWetnessMeter = "leafwetness_ch" + i;
                if (gateway[leafWetnessMeter])
                {
                    const meter = { name: `Leaf Wetness: Channel ${i}`, data: { id: gateway.PASSKEY + "_" + i, PASSKEY: gateway.PASSKEY, meterNumber: i } };
                    devices.push(meter);
                }
            }
        }

        return devices;
    }
}

module.exports = LeafWetnessDriver;