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
                    const meter = { name: pm25Meter, data: { id: gateway.PASSKEY + "_" + i, PASSKEY: gateway.PASSKEY, meterNumber: i } };
                    devices.push(meter);
                }
            }
        }

        return devices;
    }
}

module.exports = PM25Driver;