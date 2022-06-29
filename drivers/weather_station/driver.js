'use strict';

const { Driver } = require('homey');

class WeatherStationDriver extends Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log('WeatherStationDriver has been initialized');

        // Device Triggers
        this.measure_temperature_feelsLike_changed_trigger = this.homey.flow.getDeviceTriggerCard('measure_temperature.feelsLike_changed');
        this.measure_temperature_feelsLike_is_less_trigger = this.homey.flow.getDeviceTriggerCard('measure_temperature.feelsLike_is_less');
        this.measure_temperature_feelsLike_is_less_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });

        this.measure_temperature_feelsLike_is_greater_trigger = this.homey.flow.getDeviceTriggerCard('measure_temperature.feelsLike_is_greater');
        this.measure_temperature_feelsLike_is_greater_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });
        
        this.measure_temperature_dewPoint_changed_trigger = this.homey.flow.getDeviceTriggerCard('measure_temperature.dewPoint_changed');
        this.measure_temperature_dewPoint_is_less_trigger = this.homey.flow.getDeviceTriggerCard('measure_temperature.dewPoint_is_less');
        this.measure_temperature_dewPoint_is_less_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });

        this.measure_temperature_dewPoint_is_greater_trigger = this.homey.flow.getDeviceTriggerCard('measure_temperature.dewPoint_is_greater');
        this.measure_temperature_dewPoint_is_greater_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });

        this.measure_rain_event_changed_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.event_changed');
        this.measure_rain_event_is_less_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.event_is_less');
        this.measure_rain_event_is_less_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });

        this.measure_rain_event_is_greater_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.event_is_greater');
        this.measure_rain_event_is_greater_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });

        this.measure_rain_hourly_changed_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.hourly_changed');
        this.measure_rain_hourly_is_less_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.hourly_is_less');
        this.measure_rain_hourly_is_less_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });

        this.measure_rain_hourly_is_greater_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.hourly_is_greater');
        this.measure_rain_hourly_is_greater_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });

        this.measure_rain_daily_changed_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.daily_changed');
        this.measure_rain_daily_is_less_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.daily_is_less');
        this.measure_rain_daily_is_less_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });

        this.measure_rain_daily_is_greater_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.daily_is_greater');
        this.measure_rain_daily_is_greater_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });

        this.measure_rain_weekly_changed_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.weekly_changed');
        this.measure_rain_weekly_is_less_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.weekly_is_less');
        this.measure_rain_weekly_is_less_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });

        this.measure_rain_weekly_is_greater_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.weekly_is_greater');
        this.measure_rain_weekly_is_greater_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });

        this.measure_rain_monthly_changed_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.monthly_changed');
        this.measure_rain_monthly_is_less_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.monthly_is_less');
        this.measure_rain_monthly_is_less_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });

        this.measure_rain_monthly_is_greater_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.monthly_is_greater');
        this.measure_rain_monthly_is_greater_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });

        this.measure_rain_yearly_changed_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.yearly_changed');
        this.measure_rain_yearly_is_less_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.yearly_is_less');
        this.measure_rain_yearly_is_less_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });

        this.measure_rain_yearly_is_greater_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.yearly_is_greater');
        this.measure_rain_yearly_is_greater_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });


        this.measure_rain_total_changed_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.total_changed');
        this.measure_rain_total_is_less_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.total_is_less');
        this.measure_rain_total_is_less_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value < state.value;
        });

        this.measure_rain_total_is_greater_trigger = this.homey.flow.getDeviceTriggerCard('measure_rain.total_is_greater');
        this.measure_rain_yearly_is_greater_trigger.registerRunListener(async (args, state) =>
        {
            // If true, this flow should run
            return args.value > state.value;
        });
    }

    trigger_measure_temperature_feelsLike(device, temperature)
    {
        let tokens = {
            value: temperature
        };

        let state = {
            value: temperature
        };

        this.measure_temperature_feelsLike_changed_trigger.trigger(device, tokens).catch(this.error);
            
        this.measure_temperature_feelsLike_is_less_trigger.trigger(device, tokens, state).catch(this.error);
            
        this.measure_temperature_feelsLike_is_less_trigger.trigger(device, tokens, state).catch(this.error);
    }

    trigger_measure_temperature_dewPoint(device, temperature)
    {
        let tokens = {
            value: temperature
        };

        let state = {
            value: temperature
        };

        this.measure_temperature_dewPoint_changed_trigger.trigger(device, tokens).catch(this.error);
            
        this.measure_temperature_dewPoint_is_less_trigger.trigger(device, tokens, state).catch(this.error);
            
        this.measure_temperature_dewPoint_is_less_trigger.trigger(device, tokens, state).catch(this.error);
    }

    trigger_measure_rain_event(device, rain)
    {
        let tokens = {
            value: rain
        };

        let state = {
            value: rain
        };

        this.measure_rain_event_changed_trigger.trigger(device, tokens).catch(this.error);
            
        this.measure_rain_event_is_less_trigger.trigger(device, tokens, state).catch(this.error);
            
        this.measure_rain_event_is_less_trigger.trigger(device, tokens, state).catch(this.error);
    }

    trigger_measure_rain_hourly(device, rain)
    {
        let tokens = {
            value: rain
        };

        let state = {
            value: rain
        };

        this.measure_rain_hourly_changed_trigger.trigger(device, tokens).catch(this.error);
            
        this.measure_rain_hourly_is_less_trigger.trigger(device, tokens, state).catch(this.error);
            
        this.measure_rain_hourly_is_less_trigger.trigger(device, tokens, state).catch(this.error);
    }

    trigger_measure_rain_daily(device, rain)
    {
        let tokens = {
            value: rain
        };

        let state = {
            value: rain
        };

        this.measure_rain_daily_changed_trigger.trigger(device, tokens).catch(this.error);
            
        this.measure_rain_daily_is_less_trigger.trigger(device, tokens, state).catch(this.error);
            
        this.measure_rain_daily_is_less_trigger.trigger(device, tokens, state).catch(this.error);
    }

    trigger_measure_rain_weekly(device, rain)
    {
        let tokens = {
            value: rain
        };

        let state = {
            value: rain
        };

        this.measure_rain_weekly_changed_trigger.trigger(device, tokens).catch(this.error);
            
        this.measure_rain_weekly_is_less_trigger.trigger(device, tokens, state).catch(this.error);
            
        this.measure_rain_weekly_is_less_trigger.trigger(device, tokens, state).catch(this.error);
    }

    trigger_measure_rain_monthly(device, rain)
    {
        let tokens = {
            value: rain
        };

        let state = {
            value: rain
        };

        this.measure_rain_monthly_changed_trigger.trigger(device, tokens).catch(this.error);
            
        this.measure_rain_monthly_is_less_trigger.trigger(device, tokens, state).catch(this.error);
            
        this.measure_rain_monthly_is_less_trigger.trigger(device, tokens, state).catch(this.error);
    }

    trigger_measure_rain_yearly(device, rain)
    {
        let tokens = {
            value: rain
        };

        let state = {
            value: rain
        };

        this.measure_rain_yearly_changed_trigger.trigger(device, tokens).catch(this.error);
            
        this.measure_rain_yearly_is_less_trigger.trigger(device, tokens, state).catch(this.error);
            
        this.measure_rain_yearly_is_less_trigger.trigger(device, tokens, state).catch(this.error);
    }

    trigger_measure_rain_total(device, rain)
    {
        let tokens = {
            value: rain
        };

        let state = {
            value: rain
        };

        this.measure_rain_total_changed_trigger.trigger(device, tokens).catch(this.error);
            
        this.measure_rain_total_is_less_trigger.trigger(device, tokens, state).catch(this.error);
            
        this.measure_rain_total_is_less_trigger.trigger(device, tokens, state).catch(this.error);
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
            if (gateway.winddir != undefined)
            {
                const meter = { name: "Weather Station", data: { id: gateway.PASSKEY, PASSKEY: gateway.PASSKEY, meterNumber: 0 } };
                devices.push(meter);
            }
        }

        return devices;
    }
}

module.exports = WeatherStationDriver;