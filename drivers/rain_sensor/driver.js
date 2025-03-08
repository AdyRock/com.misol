'use strict';

const { Driver } = require('homey');

class RainSensorDriver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('RainSensorDriver has been initialized');
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
			 if (((gateway.wh40batt !== undefined)) && (gateway.rainratein !== undefined))
             {
                 const meter = { name: "Rain Sensor", data: { id: gateway.PASSKEY, PASSKEY: gateway.PASSKEY, meterNumber: 0 } };
                 devices.push(meter);
             }
         }

         return devices;
     }

}

module.exports = RainSensorDriver;