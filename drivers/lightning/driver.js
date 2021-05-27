'use strict';

const { Driver } = require('homey');

class LightningDriver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('Lightning Driver has been initialized');

        // Device Triggers
        this.measure_lightning_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_lightning_changed');
        this.measure_lightning_is_lessTrigger = this.homey.flow.getDeviceTriggerCard('measure_lightning_is_less');
        this.measure_lightning_is_lessTrigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });

        this.measure_lightning_is_greaterTrigger = this.homey.flow.getDeviceTriggerCard('measure_lightning_is_greater');
        this.measure_lightning_is_greaterTrigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });

        this.measure_lightning_num_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_lightning_num_changed');
        this.measure_lightning_num_is_lessTrigger = this.homey.flow.getDeviceTriggerCard('measure_lightning_num_is_less');
        this.measure_lightning_num_is_lessTrigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });
        this.measure_lightning_num_is_greaterTrigger = this.homey.flow.getDeviceTriggerCard('measure_lightning_num_is_greater');
        this.measure_lightning_num_is_greaterTrigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });
    }

    trigger_measure_lightning(device, lightning)
    {
        let tokens = {
            value: lightning
        };

        let state = {
            value: lightning
        };

        this.measure_lightning_changedTrigger.trigger(device, tokens)
            .catch(this.error);
            
        this.measure_lightning_is_lessTrigger.trigger(device, tokens, state)
            .catch(this.error);
            
        this.measure_lightning_is_greaterTrigger.trigger(device, tokens, state)
            .catch(this.error);
    }

    trigger_measure_lightning_num(device, lightning_num)
    {
        let tokens = {
            value: lightning_num
        };

        let state = {
            value: lightning_num
        };

        this.measure_lightning_num_changedTrigger.trigger(device, tokens)
            .catch(this.error);
            
        this.measure_lightning_num_is_lessTrigger.trigger(device, tokens, state)
            .catch(this.error);
            
        this.measure_lightning_num_is_greaterTrigger.trigger(device, tokens, state)
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
            if (gateway.lightning != undefined)
            {
                const meter = { name: "Lightning", data: { id: gateway.PASSKEY, PASSKEY: gateway.PASSKEY, meterNumber: 0 } };
                devices.push(meter);
            }
        }

        return devices;
    }
}

module.exports = LightningDriver;