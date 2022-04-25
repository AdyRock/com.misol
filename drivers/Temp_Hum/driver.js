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
            // look for either the weather station built in meter or a separate meter if no weather station.
            const tempfMeter = "tempf";
            if (gateway[tempfMeter])
            {
                const meter = { name: 'T & H: Channel 0', data: { id: gateway.PASSKEY, PASSKEY: gateway.PASSKEY } };
                devices.push(meter);
            }


            // Look for extra chanels
            for (var i = 1; i <= 8; i++)
            {
                const tempXMeter = "temp" + i + "f";
                if (gateway[tempXMeter])
                {
                    const meter = { name: `T & H: Channel ${i}`, data: { id: gateway.PASSKEY + "_" + i, PASSKEY: gateway.PASSKEY, meterNumber: i } };
                    devices.push(meter);
                }
            }
        }

        return devices;
    }
}

module.exports = TempHumDriver;