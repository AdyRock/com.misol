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


        this.measure_pm10_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_pm10_changed');
        this.measure_pm10_changedTrigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return (args.measure_pm10 != state.measure_pm10);
        });

        this.measure_pm10avg_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_pm10.avg_changed');
        this.measure_pm10avg_changedTrigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return (args.measure_pm10.avg != state.measure_pm10.avg);
        });

        this.measure_aq25_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_aq_changed');
        this.measure_aq25_changedTrigger.registerRunListener(async (args, state) =>
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
        try
        {
            return this.measure_co2q_changedTrigger.trigger(device, tokens, state);
        }
        catch(err)
        {
            
        }
    }

    async triggerAQPM25Changed(device, tokens, state)
    {
        try
        {
            return this.measure_aq25_changedTrigger.trigger(device, tokens, state);
        }
        catch(err)
        {
            
        }
    }

    async triggerAQPM10Changed(device, tokens, state)
    {
        try
        {
            return this.measure_aq10_changedTrigger.trigger(device, tokens, state);
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