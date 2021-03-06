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
        const devices = this.homey.app.detectedGateways.map(device => (
        {
            name: device.model,
            data:
            {
                id: device.PASSKEY
            }
        }));

        return devices;
    }
}

module.exports = MyDriver;