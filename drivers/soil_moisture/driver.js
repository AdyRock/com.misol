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
        this.measure_moisture_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_moisture_changed');
        this.measure_moisture_is_lessTrigger = this.homey.flow.getDeviceTriggerCard('measure_moisture_is_less');
        this.measure_moisture_is_lessTrigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return state.value < args.value;
        });

        this.measure_moisture_is_greaterTrigger = this.homey.flow.getDeviceTriggerCard('measure_moisture_is_greater');
        this.measure_moisture_is_greaterTrigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return state.value > args.value;
        });
    }

    trigger_measure_moisture_changed(device, moisture)
    {
        const tokens = {
            value: moisture
        };
        const state = {
            value: moisture
        };

        this.measure_moisture_changedTrigger.trigger(device, tokens)
            .catch(this.error);
            
        this.measure_moisture_is_lessTrigger.trigger(device, tokens, state)
            .catch(this.error);
            
        this.measure_moisture_is_greaterTrigger.trigger(device, tokens, state)
            .catch(this.error);
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
            for (var i = 1; i <= 8; i++)
            {
                const soilMeter = "soilmoisture" + i;
                if (gateway[soilMeter])
                {
                    const meter = { name: soilMeter, data: { id: gateway.PASSKEY + "_" + i, PASSKEY: gateway.PASSKEY, meterNumber: i } };
                    devices.push(meter);
                }
            }
        }

        return devices;
    }
}

module.exports = MyDriver;