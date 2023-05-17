'use strict';

const { Driver } = require('homey');

class CameraDriver extends Driver
{

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('MyDriver has been initialized');
        this.snapshotReadyTrigger = this.homey.flow.getDeviceTriggerCard('snapshotReadyTrigger');

    }

    async onPair(session)
    {
        session.setHandler('manual_connection', async (data) =>
        {
            this.lastHostName = data.ip;
            const mac = await this.homey.arp.getMAC(this.lastHostName);

            let device = (
            {
                'name': mac,
                data:
                {
                    'id': mac ? mac : this.lastURN
                },
                settings:
                {
                    // Store username & password in settings
                    // so the user can change them later
                    'ip': data.ip,
                    'mac': mac ? mac : 'Unknown',
                }
            });
            this.homey.app.updateLog('Adding ' + this.homey.app.varToString(device), 1);

            return device;
        });
    }

}

module.exports = CameraDriver;