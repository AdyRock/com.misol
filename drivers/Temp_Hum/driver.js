'use strict';

const { Driver } = require('homey');

class TempHumDriver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('TempHumDriver has been initialized');
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
            const pm10Meter = "tempf";
            if (gateway[pm10Meter])
            {
                const meter = { name: pm10Meter, data: { id: gateway.PASSKEY, PASSKEY: gateway.PASSKEY } };
                devices.push(meter);
            }
        }

        return devices;
    }
}

module.exports = TempHumDriver;