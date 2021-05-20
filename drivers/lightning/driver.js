'use strict';

const { Driver } = require('homey');

class LightningDriver extends Driver
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
            if (gateway.lightning != undefined)
            {
                const meter = { name: "Lightning", data: { id: gateway.PASSKEY, PASSKEY: gateway.PASSKEY, meterNumber: 0 } };
                devices.push(meter);
            }
        }

        return devices;
    }
}

module.exports = LightningDriver;