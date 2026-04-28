'use strict';

const { Driver } = require('homey');

class MyDriver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('MyDriver has been initialized');
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
                // Check for old-style soil moisture sensors
                const soilMeter = "soilmoisture" + i;
                if (gateway[soilMeter])
                {
                    const meter = { name: `Soil Moisture: Channel ${i}`, data: { id: gateway.PASSKEY + "_" + i, PASSKEY: gateway.PASSKEY, meterNumber: i } };
                    devices.push(meter);
                }

                // Check for new-style soil EC sensors (WH52)
                const soilEcHumMeter = "soil_ec_hum" + i;
                if (gateway[soilEcHumMeter] && !gateway[soilMeter])
                {
                    const meter = { name: `Soil Sensor (EC): Channel ${i}`, data: { id: gateway.PASSKEY + "_ec_" + i, PASSKEY: gateway.PASSKEY, meterNumber: i } };
                    devices.push(meter);
                }
            }
        }

        return devices;
    }
}

module.exports = MyDriver;