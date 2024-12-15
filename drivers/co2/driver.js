'use strict';

const { Driver } = require('homey');

class CO2Driver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('CO2Driver has been initialized');

        this.measure_co2q_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_co2q_changed');
        this.measure_co2q_changedTrigger.registerRunListener(async (args, state) =>
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

    async triggerCo2QChanged(device, tokens, state)
    {
        this.measure_co2q_changedTrigger.trigger(device, tokens, state).catch(this.error);
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
			const co2Meter = "co2in";
			if (gateway[co2Meter])
            {
                const meter = { name: 'CO2', data: { id: gateway.PASSKEY, PASSKEY: gateway.PASSKEY } };
                devices.push(meter);
            }
        }

        return devices;
    }
}

module.exports = CO2Driver;