'use strict';

const { Driver } = require('homey');

class MyDriver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.homey.app.updateLog('MyDriver has been initialized');
    }

    /**
     * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
     * This should return an array with the data of devices that are available for pairing.
     */
    async onPairListDevices()
    {
        // Filter out entries missing a usable id/name so the pairing template never
        // receives a null/empty value it can't render.
        const devices = this.homey.app.detectedGateways
            .filter(device => !!device && !!device.PASSKEY)
            .map(device => (
            {
                name: this.homey.app.getGatewayDisplayName(device),
                data:
                {
                    id: device.PASSKEY
                }
            }));

        // TEMP diagnostics: dump exactly what is sent to the pairing list template,
        // and the raw detectedGateways, to track down the "reading length" crash.
        this.homey.app.updateLog(`onPairListDevices devices: ${this.homey.app.varToString(devices)}`, 0);
        this.homey.app.updateLog(`onPairListDevices raw detectedGateways: ${this.homey.app.varToString(this.homey.app.detectedGateways)}`, 0);

        return devices;
    }

    async onPair(session)
    {
        // TEMP diagnostics: confirm onPair is actually invoked for this pairing session.
        this.homey.app.updateLog('Gateway driver onPair() called', 0);
        session.setHandler('list_devices', this.onPairListDevices.bind(this));
        session.setHandler('list_my_devices', this.onPairListDevices.bind(this));
        this.homey.app.registerGatewayPairHandlers(session);
    }
}

module.exports = MyDriver;