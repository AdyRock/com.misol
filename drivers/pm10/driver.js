'use strict';

const { Driver } = require('homey');

class PM10Driver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('PM10Driver has been initialized');

        this.measure_aq10_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_aq.pm10_changed');
        this.measure_aq10_changedTrigger.registerRunListener(async (args, state) =>
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

        this.measure_aq10_avg_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_aq.pm10_avg_changed');
        this.measure_aq10_avg_changedTrigger.registerRunListener(async (args, state) =>
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

        this.alarmPowerTrueTrigger = this.homey.flow.getDeviceTriggerCard('alarm_power_true');
        this.alarmPowerTrueTrigger.registerRunListener(async (args, state) =>
        {
            return state.value === true;
        });

        this.alarmPowerFalseTrigger = this.homey.flow.getDeviceTriggerCard('alarm_power_false');
        this.alarmPowerFalseTrigger.registerRunListener(async (args, state) =>
        {
            return state.value === false;
        });
    }

    async triggerCo2QChanged(device, tokens, state)
    {
        this.homey.app.triggerCo2QChanged(device, tokens, state).catch(this.error);
    }

    async triggerAQPM25Changed(device, tokens, state)
    {
		this.homey.app.measure_aq25_changedTrigger.trigger(device, tokens, state).catch(this.error);
    }

    async triggerAQPM25AvgChanged(device, tokens, state)
    {
		this.homey.app.measure_aq25_avg_changedTrigger.trigger(device, tokens, state).catch(this.error);
    }

    async triggerAQPM10Changed(device, tokens, state)
    {
		this.measure_aq10_changedTrigger.trigger(device, tokens, state).catch(this.error);
    }

    async triggerAQPM10AvgChanged(device, tokens, state)
    {
		this.measure_aq10Avg_changedTrigger.trigger(device, tokens, state).catch(this.error);
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
            const pm10Meter = "pm10_co2";
            if (gateway[pm10Meter])
            {
                const meter = { name: 'PM 10 & CO2', data: { id: gateway.PASSKEY, PASSKEY: gateway.PASSKEY } };
                devices.push(meter);
            }
        }

        return devices;
    }
}

module.exports = PM10Driver;