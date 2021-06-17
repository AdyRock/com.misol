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
        this.measure_aq_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_aq_changed');
        this.measure_aq_changedTrigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            const argValue = parseInt(args.measure_aq);

            if (args.compare_type === '<=')
            {
                // Check <=
                return state.value <= argValue;
            }
            else if (args.compare_type === '==')
            {
                // Check <=
                return state.value == argValue;
            }
            else if (args.compare_type === '>=')
            {
                // Check <=
                return state.value >= argValue;
            }

            return false;
        });
    }

    async triggerAQChanged(device, tokens, state)
    {
        try
        {
            return this.measure_aq_changedTrigger.trigger(device, tokens, state);
        }
        catch(err)
        {
            
        }
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