'use strict';
if (process.env.DEBUG === '1')
{
    require('inspector').open(9222, '0.0.0.0', true);
}

const Homey = require('homey');
const http = require('http');
const dgram = require('dgram');
var net = require('net');
const nodemailer = require("nodemailer");

class MyApp extends Homey.App
{
    /**
     * onInit is called when the app is initialized.
     */
    async onInit()
    {
        this.log('MyApp has been initialized');
        this.diagLog = "";

        if (process.env.DEBUG === '1')
        {
            this.homey.settings.set('debugMode', true);
        }
        else
        {
            this.homey.settings.set('debugMode', false);
        }

        this.homeyID = await this.homey.cloud.getHomeyId();
        this.homeyHash = this.homeyID;
        this.homeyHash = this.hashCode(this.homeyHash).toString();

		try
		{
			const homeyLocalURL = await this.homey.cloud.getLocalAddress();
			this.homeyIP = homeyLocalURL.split(':')[0];
		}
		catch (err)
		{
			this.updateLog(`Error getting homey IP: ${err.message}`, 0);
		}

        this.pushServerPort = this.homey.settings.get('port');
        if (!this.pushServerPort)
        {
            this.pushServerPort = 7777;
            this.homey.settings.set('port', this.pushServerPort);
        }
        else if ((this.pushServerPort < 0) || (this.pushServerPort >= 65536))
        {
            this.pushServerPort = 7777;
        }

        this.SpeedUnits = this.homey.settings.get( 'SpeedUnits' );
        if ( this.SpeedUnits === null )
        {
            this.SpeedUnits = '0';
            this.homey.settings.set( 'SpeedUnits', this.SpeedUnits );
        }

        this.RainfallUnits = this.homey.settings.get( 'RainfallUnits' );
        if ( this.RainfallUnits === null )
        {
            this.RainfallUnits = '0';
            this.homey.settings.set( 'RainfallUnits', this.RainfallUnits );
        }

        this.runsListener();
        this.detectedGateways = [];

        this.homey.settings.on('set', key =>
        {
			if (key === 'autoConfigEnabled')
			{
				if (this.homey.settings.get('autoConfigEnabled'))
				{
					this.createBroadcastServer();
				}
				else
				{
					this.broadcastServer.close();
				}
			}

            if (key === 'port')
            {
                this.pushServerPort = this.homey.settings.get('port');
                if ((this.pushServerPort < 0) || (this.pushServerPort >= 65536))
                {
                    this.pushServerPort = 7777;
                }
                this.updateLog("Closing server");
                this.server.close();
                this.runsListener();
            }

            if ( key === 'SpeedUnits' )
            {
                this.SpeedUnits = this.homey.settings.get( 'SpeedUnits' );
                this.changeUnits( 'SpeedUnits' );
            }

            if ( key === 'RainfallUnits' )
            {
                this.RainfallUnits = this.homey.settings.get( 'RainfallUnits' );
                this.changeUnits( 'RainfallUnits' );
            }

            if (key === 'simData')
            {
                let simData = this.homey.settings.get('simData');
                if (simData)
                {
                    var gatewatEntry = -1;
                    try
                    {
                        gatewatEntry = this.detectedGateways.findIndex(x => x.PASSKEY === simData[0].PASSKEY);
                    }
                    catch( err )
                    {
                        gatewatEntry = -1;
                    }

                    if (gatewatEntry === -1)
                    {
                        this.detectedGateways.push(simData[0]);
                    }
                    else
                    {
                        this.detectedGateways[gatewatEntry] = simData[0];
                    }
                }
                else
                {
                    this.detectedGateways = [];
                }
            }
        });

        // Conditions for moisture sensor
        let measure_moisture_is_lessCondition = this.homey.flow.getConditionCard('measure_moisture_is_less');
        measure_moisture_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let moisture = args.device.getCapabilityValue('measure_moisture');
            return moisture < args.value;
        });

        let measure_moisture_is_equalCondition = this.homey.flow.getConditionCard('measure_moisture_equal');
        measure_moisture_is_equalCondition.registerRunListener(async (args, state) =>
        {
            let moisture = args.device.getCapabilityValue('measure_moisture');
            return moisture === args.value;
        });

        // Conditions for weather station
        let measure_temperature_feelsLike_is_lessCondition = this.homey.flow.getConditionCard('measure_temperature.feelsLike_is_less');
        measure_temperature_feelsLike_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_temperature.feelsLike');
            return value < args.value;
        });

        let measure_temperature_feelsLike_equalCondition = this.homey.flow.getConditionCard('measure_temperature.feelsLike_equal');
        measure_temperature_feelsLike_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_temperature.feelsLike');
            return value === args.value;
        });

        let measure_temperature_dewPoint_is_lessCondition = this.homey.flow.getConditionCard('measure_temperature.dewPoint_is_less');
        measure_temperature_dewPoint_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_temperature.dewPoint');
            return value < args.value;
        });

        let measure_temperature_dewPoint_equalCondition = this.homey.flow.getConditionCard('measure_temperature.dewPoint_equal');
        measure_temperature_dewPoint_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_temperature.dewPoint');
            return value === args.value;
        });

        let measure_rain_rate_is_lessCondition = this.homey.flow.getConditionCard('measure_rain.rate_is_less');
        measure_rain_rate_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.rate');
            return value < args.value;
        });

        let measure_rain_rate_equalCondition = this.homey.flow.getConditionCard('measure_rain.rate_equal');
        measure_rain_rate_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.rate');
            return value === args.value;
        });

		let measure_rain_event_is_lessCondition = this.homey.flow.getConditionCard('measure_rain.event_is_less');
        measure_rain_event_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.event');
            return value < args.value;
        });

        let measure_rain_event_equalCondition = this.homey.flow.getConditionCard('measure_rain.event_equal');
        measure_rain_event_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.event');
            return value === args.value;
        });

        let measure_rain_hourly_is_lessCondition = this.homey.flow.getConditionCard('measure_rain.hourly_is_less');
        measure_rain_hourly_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.hourly');
            return value < args.value;
        });

        let measure_rain_hourly_equalCondition = this.homey.flow.getConditionCard('measure_rain.hourly_equal');
        measure_rain_hourly_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_temperature.hourly');
            return value === args.value;
        });

        let measure_rain_daily_is_lessCondition = this.homey.flow.getConditionCard('measure_rain.daily_is_less');
        measure_rain_daily_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.daily');
            return value < args.value;
        });

        let measure_rain_daily_equalCondition = this.homey.flow.getConditionCard('measure_rain.daily_equal');
        measure_rain_daily_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.daily');
            return value === args.value;
        });

        let measure_rain_weekly_is_lessCondition = this.homey.flow.getConditionCard('measure_rain.weekly_is_less');
        measure_rain_weekly_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.weekly');
            return value < args.value;
        });

        let measure_rain_weekly_equalCondition = this.homey.flow.getConditionCard('measure_rain.weekly_equal');
        measure_rain_weekly_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.weekly');
            return value === args.value;
        });

        let measure_rain_monthly_is_lessCondition = this.homey.flow.getConditionCard('measure_rain.monthly_is_less');
        measure_rain_monthly_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.monthly');
            return value < args.value;
        });

        let measure_rain_monthly_equalCondition = this.homey.flow.getConditionCard('measure_rain.monthly_equal');
        measure_rain_monthly_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.monthly');
            return value === args.value;
        });

        let measure_rain_yearly_is_lessCondition = this.homey.flow.getConditionCard('measure_rain.yearly_is_less');
        measure_rain_yearly_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.yearly');
            return value < args.value;
        });

        let measure_rain_yearly_equalCondition = this.homey.flow.getConditionCard('measure_rain.yearly_equal');
        measure_rain_yearly_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.yearly');
            return value === args.value;
        });

        let measure_rain_total_is_lessCondition = this.homey.flow.getConditionCard('measure_rain.total_is_less');
        measure_rain_total_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.total');
            return value < args.value;
        });

        let measure_rain_total_equalCondition = this.homey.flow.getConditionCard('measure_rain.total_equal');
        measure_rain_total_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.total');
            return value === args.value;
        });

        let measure_hours_since_rained_is_lessCondition = this.homey.flow.getConditionCard('measure_hours_since_rained_is_less');
        measure_hours_since_rained_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_hours_since_rained');
            return value < args.value;
        });

        let measure_hours_since_rained_equalCondition = this.homey.flow.getConditionCard('measure_hours_since_rained_equal');
        measure_hours_since_rained_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_hours_since_rained');
            return value === args.value;
        });

        // Lightening conditions
        let measure_lightning_is_lessCondition = this.homey.flow.getConditionCard('measure_lightning_is_less');
        measure_lightning_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_lightning');
            return value < args.value;
        });

        let measure_lightning_equalCondition = this.homey.flow.getConditionCard('measure_lightning_equal');
        measure_lightning_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_lightning');
            return value === args.value;
        });

        let measure_lightning_num_is_lessCondition = this.homey.flow.getConditionCard('measure_lightning_num_is_less');
        measure_lightning_num_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_lightning_num');
            return value < args.value;
        });

        let measure_lightning_num_equalCondition = this.homey.flow.getConditionCard('measure_lightning_num_equal');
        measure_lightning_num_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_lightning_num');
            return value === args.value;
        });

        // PM2.5 conditions
        let measure_aqi_is_lessCondition = this.homey.flow.getConditionCard('measure_aqi_is_less');
        measure_aqi_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_aqi');
            return value < args.value;
        });

        let measure_aqi_equalCondition = this.homey.flow.getConditionCard('measure_aqi_equal');
        measure_aqi_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_aqi');
            return value === args.value;
        });

        let measure_aqi_avg_is_lessCondition = this.homey.flow.getConditionCard('measure_aqi.avg_is_less');
        measure_aqi_avg_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_aqi.avg');
            return value < args.value;
        });

        let measure_aqi_avg_equalCondition = this.homey.flow.getConditionCard('measure_aqi.avg_equal');
        measure_aqi_avg_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_aqi.avg');
            return value === args.value;
        });

        // PM10 conditions
        let measure_aqi10_is_lessCondition = this.homey.flow.getConditionCard('measure_aqi.pm10_is_less');
        measure_aqi10_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_aqi.pm10');
            return value < args.value;
        });

        let measure_aqi10_equalCondition = this.homey.flow.getConditionCard('measure_aqi.pm10_equal');
        measure_aqi10_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_aqi.pm10');
            return value === args.value;
        });

        let measure_aqi10_avg_is_lessCondition = this.homey.flow.getConditionCard('measure_aqi.pm10_avg_is_less');
        measure_aqi10_avg_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_aqi.pm10_avg');
            return value < args.value;
        });

        let measure_aqi10_avg_equalCondition = this.homey.flow.getConditionCard('measure_aqi.pm10_avg_equal');
        measure_aqi10_avg_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_aqi.pm10_avg');
            return value === args.value;
        });

        this.motionReadyCondition = this.homey.flow.getConditionCard('motionReadyCondition');
        this.motionReadyCondition.registerRunListener(async (args, state) =>
        {
            await args.device.nowImage.update();
            let remainingTime = args.waitTime * 10;
            while ((remainingTime > 0) && args.device.updatingEventImage)
            {
                // Wait for image to update
                await this.homey.app.asyncDelay(100);
                remainingTime--;
            }
            return !args.device.updatingEventImage;
        });

        // Actions
        this.updateImage = this.homey.flow.getActionCard('updateImage');
        this.updateImage.registerRunListener(async (args, state) =>
        {
            let err = await args.device.nowImage.update();
            if (!err)
            {
                let tokens = {
                    'image': args.device.nowImage
                };

                args.device.driver.snapshotReadyTrigger
                    .trigger(args.device, tokens)
                    .catch(args.device.error)
                    .then(args.device.log('Now Snapshot ready (' + args.device.id + ')'));
            }
            return err;
        });


        // Triggers
        let measure_aq25_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_aq_changed');
        measure_aq25_changedTrigger.registerRunListener(async (args, state) =>
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

        let measure_aq25_avg_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_aq.avg_changed');
        measure_aq25_avg_changedTrigger.registerRunListener(async (args, state) =>
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

        let measure_rain_daily_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_rain.daily_changed');
        measure_rain_daily_changedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });




        // let measure_aq_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_aq_changed');
        // measure_aq_changedTrigger.registerRunListener(async (args, state) =>
        // {
        //     return true;
        // });

        // let measure_aq_avg_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_aq.avg_changed');
        // measure_aq_avg_changedTrigger.registerRunListener(async (args, state) =>
        // {
        //     return true;
        // });

        let measure_aqi_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_aqi_changed');
        measure_aqi_changedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });

        let measure_aqi_avg_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_aqi.avg_changed');
        measure_aqi_avg_changedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });

        this.measure_co2g_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_co2q_changed');
        this.measure_co2g_changedTrigger.registerRunListener(async (args, state) =>
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

        let measure_rain_event_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_rain.event_changed');
        measure_rain_event_changedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });

        let measure_rain_hourly_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_rain.hourly_changed');
        measure_rain_hourly_changedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });

        let measure_rain_monthly_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_rain.monthly_changed');
        measure_rain_monthly_changedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });

        let measure_rain_totalchangedTrigger = this.homey.flow.getDeviceTriggerCard('measure_rain.total_changed');
        measure_rain_totalchangedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });

        let measure_rain_weekly_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_rain.weekly_changed');
        measure_rain_weekly_changedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });

        let measure_rain_yearly_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_rain.yearly_changed');
        measure_rain_yearly_changedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });

        let measure_temperature_dewPoint_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_temperature.dewPoint_changed');
        measure_temperature_dewPoint_changedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });

        let measure_temperature_feelsLike_changedTrigger = this.homey.flow.getDeviceTriggerCard('measure_temperature.feelsLike_changed');
        measure_temperature_feelsLike_changedTrigger.registerRunListener(async (args, state) =>
        {
            return true;
        });

		if (this.homey.settings.get('autoConfigEnabled') === null)
		{
			this.homey.settings.set('autoConfigEnabled', true);
		}

		if (this.homey.settings.get('autoConfigEnabled'))
		{
			this.createBroadcastServer();
		}
    }

	async triggerCo2QChanged(device, tokens, state)
	{
		this.measure_co2q_changedTrigger.trigger(device, tokens, state).catch(this.error);
	}

    async changeUnits( Units )
    {
        let promises = [];

        const drivers = this.homey.drivers.getDrivers();
        for ( const driver in drivers )
        {
            let devices = this.homey.drivers.getDriver( driver ).getDevices();
            let numDevices = devices.length;
            for ( var i = 0; i < numDevices; i++ )
            {
                let device = devices[ i ];
                if ( device.unitsChanged )
                {
                    promises.push( device.unitsChanged( Units ) );
                }
            }
        }

        // Wait for all the checks to complete
        await Promise.allSettled( promises );
    }

    hashCode(s)
    {
        let h = 0;
        for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
        return h;
    }

    async runsListener()
    {
        const requestListener = (request, response) =>
        {
            let body = '';
            request.on('data', chunk =>
            {
                body += chunk.toString(); // convert Buffer to string
                if (body.length > 10000)
                {
                    this.updateLog("Push data error: Payload too large", 0);
                    response.writeHead(413);
                    response.end('Payload Too Large');
                    body = '';
                    return;
                }
            });
            request.on('end', () =>
            {
                try
                {
                    let bodyMsg = body;
                    body = '';
                    response.writeHead(200);
                    response.end('ok');

                    let data = '';
                    if (bodyMsg.length === 0)
                    {
                        // Support for Ambient Weather format
                        var fullUrl = request.url.replace('/data/report/', '');
                        if (fullUrl.length === 0)
                        {
                            return;
                        }
                        var url = require('url');
                        var url_parts = url.parse(`?${fullUrl}`, true);
                        data = url_parts.query;
                    }
                    else
                    {
                        // Misol and Ecowitt format
                        data = JSON.parse('{"' + bodyMsg.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function(key, value) { return key === "" ? value : decodeURIComponent(value); });
                    }

//                    this.updateLog(this.varToString(data), 1);

                    // Update discovery array used to add devices
                    var gatewatEntry = this.detectedGateways.findIndex(x => x.PASSKEY === data.PASSKEY);
                    if (gatewatEntry === -1)
                    {
                        this.detectedGateways.push(data);
                    }
                    else
                    {
                        this.detectedGateways[gatewatEntry] = data;
                    }

                    this.homey.api.realtime('com.misol.detectedDevicesUpdated', JSON.stringify(this.detectedGateways, null, 2));

                    const drivers = this.homey.drivers.getDrivers();
                    for (const driver in drivers)
                    {
                        let devices = this.homey.drivers.getDriver(driver).getDevices();

                        for (let i = 0; i < devices.length; i++)
                        {
                            let device = devices[i];
                            if (device.updateCapabilities)
                            {
                                device.updateCapabilities(data);
                            }
                        }
                    }

//                    this.log(data);

                    // Use sim data if available
                    let simData = this.homey.settings.get('simData');
                    if (simData)
                    {
                        data = simData[0];
                        gatewatEntry = this.detectedGateways.findIndex(x => x.PASSKEY === data.PASSKEY);
                        if (gatewatEntry === -1)
                        {
                            this.detectedGateways.push(data);
                        }
                        else
                        {
                            this.detectedGateways[gatewatEntry] = data;
                        }

                        this.homey.api.realtime('com.misol.detectedDevicesUpdated', JSON.stringify(this.detectedGateways, null, 2));

                        const drivers = this.homey.drivers.getDrivers();
                        for (const driver in drivers)
                        {
                            let devices = this.homey.drivers.getDriver(driver).getDevices();

                            for (let i = 0; i < devices.length; i++)
                            {
                                let device = devices[i];
                                if (device.updateCapabilities)
                                {
                                    device.updateCapabilities(data);
                                }
                            }
                        }
                    }
                }
                catch (err)
                {
                    this.updateLog(this.varToString(err), 0);
                }
            });
        };

        this.server = http.createServer(requestListener);
        if ((this.pushServerPort < 0) || (this.pushServerPort >= 65536))
        {
            this.pushServerPort = 7777;
        }

        this.server.listen(this.pushServerPort, () =>
        {
            this.updateLog("Server listening on port: " + this.pushServerPort);
        });

        this.server.on('error', (err) =>
        {
            if (err.code === 'EADDRINUSE')
            {
                this.updateLog('Address in use, retrying...');
                setTimeout(() =>
                {
                    this.server.close();
                    this.server.listen(this.pushServerPort);
                }, 1000);
            }
            else
            {
                this.updateLog(err.message, 0);
            }
        });

    }

    varToString(source)
    {
        try
        {
            if (source === null)
            {
                return "null";
            }
            if (source === undefined)
            {
                return "undefined";
            }
            if (source instanceof Error)
            {
                let stack = source.stack.replace('/\\n/g', '\n');
                return source.message + '\n' + stack;
            }
            if (typeof(source) === "object")
            {
                const getCircularReplacer = () =>
                {
                    const seen = new WeakSet();
                    return (key, value) =>
                    {
                        if (typeof value === "object" && value !== null)
                        {
                            if (seen.has(value))
                            {
                                return;
                            }
                            seen.add(value);
                        }
                        return value;
                    };
                };

                return JSON.stringify(source, getCircularReplacer(), 2);
            }
            if (typeof(source) === "string")
            {
                return source;
            }
        }
        catch (err)
        {
            this.log("VarToString Error: ", err);
        }

        return source.toString();
    }

    updateLog(newMessage, errorLevel = 1)
    {
        if ((errorLevel == 0) || this.homey.settings.get('logEnabled'))
        {
            console.log(newMessage);

            const nowTime = new Date(Date.now());

            this.diagLog += "\r\n* ";
            this.diagLog += (nowTime.getHours());
            this.diagLog += ":";
            this.diagLog += nowTime.getMinutes();
            this.diagLog += ":";
            this.diagLog += nowTime.getSeconds();
            this.diagLog += ".";
            let milliSeconds = nowTime.getMilliseconds().toString();
            if (milliSeconds.length == 2)
            {
                this.diagLog += '0';
            }
            else if (milliSeconds.length == 1)
            {
                this.diagLog += '00';
            }
            this.diagLog += milliSeconds;
            this.diagLog += ": ";
            this.diagLog += "\r\n";

            this.diagLog += newMessage;
            this.diagLog += "\r\n";
            if (this.diagLog.length > 60000)
            {
                this.diagLog = this.diagLog.substr(this.diagLog.length - 60000);
            }
            this.homey.api.realtime('com.misol.logupdated', { 'log': this.diagLog });
        }
    }

    async sendLog(body)
    {
        let tries = 5;

        let logData;
        if (body.logType == "diag")
        {
            logData = this.diagLog;
        }
        else
        {
            logData = this.varToString(this.detectedGateways);
        }

        while (tries-- > 0)
        {
            try
            {
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport(
                {
                    host: Homey.env.MAIL_HOST, //Homey.env.MAIL_HOST,
                    port: 465,
                    ignoreTLS: false,
                    secure: true, // true for 465, false for other ports
                    auth:
                    {
                        user: Homey.env.MAIL_USER, // generated ethereal user
                        pass: Homey.env.MAIL_SECRET // generated ethereal password
                    },
                    tls:
                    {
                        // do not fail on invalid certs
                        rejectUnauthorized: false
                    }
                });

                // send mail with defined transport object
                let info = await transporter.sendMail(
                {
                    from: '"Homey User" <' + Homey.env.MAIL_USER + '>', // sender address
                    to: Homey.env.MAIL_RECIPIENT, // list of receivers
                    subject: `Misol and Ecowitt (${this.homeyHash} : ${Homey.manifest.version})` + body.logType + " log", // Subject line
                    text: logData // plain text body
                });

                this.updateLog("Message sent: " + info.messageId);
                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

                // Preview only available when sending through an Ethereal account
                console.log("Preview URL: ", nodemailer.getTestMessageUrl(info));
                return this.homey.__('settings.logSent');
            }
            catch (err)
            {
                this.updateLog("Send log error: " + err.stack, 0);
            }
        }

        return (this.homey.__('settings.logSendFailed'));
    }

	createBroadcastServer()
	{
	    function sendBroadcast(appInstance)
	    {
	        if (appInstance.homey.settings.get('autoConfigEnabled'))
	        {
	            appInstance.updateLog(`Sending Broadcast`);
	            let request = new Uint8Array(6);
	            request[0] = 0xFF;
	            request[1] = 0xFF;
	            request[2] = 0x12;
	            request[3] = 0x00;
	            request[4] = 0x04;
	            request[5] = 0x12 + 0x04; // Checksum
	            appInstance.broadcastServer.send(request, 46000, '192.168.1.255');
	            appInstance.homey.setTimeout(() =>
	            {
	                sendBroadcast(appInstance);
	            }, 60000);
	        }
	    }

	    // Create a server to listen for data from gateways
	    this.broadcastServer = dgram.createSocket('udp4');

		this.broadcastServer.on('error', (err) =>
	    {
	        this.updateLog(`server error:\n${err.stack}`, 0);
	        this.broadcastServer.close();
	    });

	    this.broadcastServer.on('listening', () =>
	    {
	        // try
	        // {
	        //     this.broadcastServer.setBroadcast(true);
	        // }
	        // catch (err)
	        // {
	        //     this.updateLog(`Error setting broadcast: ${err.message}`, 0);
	        //     this.broadcastServer.close();
	        //     return;
	        // }

	        const address = this.broadcastServer.address();
	        this.homey.app.updateLog(`Broadcast server listening ${address.address}:${address.port}`);

	        this.homey.setTimeout(() =>
	        {
	            sendBroadcast(this);
	        }, 15000);
	    });

	    this.broadcastServer.on('message', (msg, rinfo) =>
	    {
			// Convert the message to a string with non-printable characters as \hex values
			let formattedMsg = '';
			for (let i = 0; i < msg.length; i++)
			{
				const charCode = msg[i];
				if (charCode >= 32 && charCode <= 126)
				{
					// Printable characters (ASCII range 32-126)
					formattedMsg += String.fromCharCode(charCode);
				}
				else
				{
					// Non-printable characters
					formattedMsg += `\\${charCode.toString(16).padStart(2, '0')}`;
					if (i < msg.length - 1)
					{
						formattedMsg += ' ';
					}
				}
			}

			this.updateLog(`server got: "${formattedMsg}" from ${rinfo.address}:${rinfo.port}`);

	        // Convert the message to a byte array

	        const byteArray = new Uint8Array(msg);

	        // Validate the message to confirm it is from a hub
	        if ((byteArray.length >= 15) &&  (byteArray[ 0 ] === 0xFF) && (byteArray[ 1 ] == 0xFF) && (byteArray[ 2 ] === 0x12))
	        {
	            // byteArray 3 and 4 are the length of the message
	            let length = byteArray[ 3 ] * 256 + byteArray[ 4 ];

	            // byteArray 5 to 11 is the MAC address of the hub
	            let macAddress = '';
	            for (let i = 5; i < 10; i++)
	            {
	                macAddress += byteArray[ i ].toString(16).padStart(2, '0');
	            }

	            // byteArray 12 to 15 is the IP address of the hub
	            let ipAddress = '';
	            for (let i = 11; i < 15; i++)
	            {
	                ipAddress += byteArray[ i ];
	                if (i < 14)
	                {
	                    ipAddress += '.';
	                }
	            }

	            this.updateLog(`Gateway: ${macAddress} on IP: ${ipAddress}`);

	            const client = new net.Socket();
	            client.connect(45000, ipAddress , () =>
	            {
	                // format byte array to read the custom server settings from the gateway
	                let request = new Uint8Array(5);
	                request[0] = 0xFF;
	                request[1] = 0xFF;
	                request[2] = 0x2A;
	                request[3] = 0x03;
	                request[4] = 0x2A + 0x03;

					this.updateLog("TCP Connected. Sending request for custom server settings");
	                client.write(request); //This will send the byte buffer over TCP
	            });

	            client.on('error', (err) =>
	            {
	                this.updateLog(`Client error: ${err.message}`, 0);
	            });

	            client.on('data', (data) =>
	            {
	                // Convert the data to a hex string of the byte array with bytes separated by a space
	                let hexString = '';
	                for (let i = 0; i < data.length; i++)
	                {
	                    hexString += data[i].toString(16).padStart(2, '0');
	                    if (i < data.length - 1) hexString += ' ';
	                }
	                this.updateLog(`Received data from ${ipAddress}: ${hexString}`);

	                // Validate the data to confirm it is the custom server settings
	                if ((data.length > 5) && (data[0] === 0xFF) && (data[1] === 0xFF) && (data[2] === 0x2A))
	                {
	                    // data 3 is the packet size
	                    let packetSize = data[3];

	                    // data 4 is the ID size
	                    let idSize = data[4];

	                    // data 5 to 5 + idSize is the ID of the gateway in ASCII
	                    let gatewayID = '';
	                    for (let i = 5; i < 5 + idSize; i++)
	                    {
	                        gatewayID += String.fromCharCode(data[i]);
	                    }

	                    // data 5 + idSize is the password size
	                    let passwordSize = data[5 + idSize];

	                    // data 6 + idSize to 6 + idSize + passwordSize is the password of the gateway in ASCII
	                    let password = '';

	                    for (let i = 6 + idSize; i < 6 + idSize + passwordSize; i++)
	                    {
	                        password += String.fromCharCode(data[i]);
	                    }

	                    // data 6 + idSize + passwordSize is the server address size
	                    let serverAddressSize = data[6 + idSize + passwordSize];

	                    // data 7 + idSize + passwordSize to 7 + idSize + passwordSize + serverAddressSize is the server address of the gateway in ASCII
	                    let serverAddress = '';
	                    for (let i = 7 + idSize + passwordSize; i < 7 + idSize + passwordSize + serverAddressSize; i++)
	                    {
	                        serverAddress += String.fromCharCode(data[i]);
	                    }

	                    // data 7 + idSize + passwordSize + serverAddressSize is the server port
	                    let port = data[7 + idSize + passwordSize + serverAddressSize] * 256 + data[8 + idSize + passwordSize + serverAddressSize];

	                    // data 9 + idSize + passwordSize + serverAddressSize + 1 is the 2 byte interval
	                    let interval = (data[9 + idSize + passwordSize + serverAddressSize] << 8) + data[10 + idSize + passwordSize + serverAddressSize];

	                    // data 11 + idSize + passwordSize + serverAddressSize + 1 is the format type
	                    let format = data[11 + idSize + passwordSize + serverAddressSize];

	                    // data 12 + idSize + passwordSize + serverAddressSize + 1 is the enabled flag
	                    let enabled = data[12 + idSize + passwordSize + serverAddressSize];

	                    // data 13 + idSize + passwordSize + serverAddressSize + 1 is the checksum
	                    let checksum = data[13 + idSize + passwordSize + serverAddressSize];

	                    // Compute the checksum which is the sum of all the bytes from 2 to packetSize + 2
	                    let computedChecksum = 0;
	                    for (let i = 2; i <= packetSize; i++)
	                    {
	                        computedChecksum += data[i];
	                    }

	                    // make the computedChecksum 8 bits
	                    computedChecksum = computedChecksum & 0xFF;

	                    if (checksum !== computedChecksum)
	                    {
	                        this.updateLog('Invalid checksum');

	                        // Close the TCP connection
	                        client.end();
	                        return;
	                    }

	                    // compare the gateway IP with this.homeyIP, ensure the port matches the integer of pushServerPort string, and ensure the format is 0
	                    if ((serverAddress !== this.homeyIP) || (port !== parseInt(this.pushServerPort, 10)) || (format !== 0) || (enabled !== 1))
	                    {
	                        this.updateLog('Updating the gateway settings', 0);
	                        // format byte array to write the custom server settings to the gateway
	                        let request = new Uint8Array(30);
	                        request[0] = 0xFF;
	                        request[1] = 0xFF;
	                        request[2] = 0x2B;
	                        request[4] = idSize;	// ID size

	                        // copy the gateway ID to the request
	                        for (let i = 0; i < idSize; i++)
	                        {
	                            request[5 + i] = data[5 + i];
	                        }

	                        request[5 + idSize] = 0;	// password size

	                        // copy Homey's IP address to the request as ascii bytes
	                        request[6 + idSize] = this.homeyIP.length;	// server address size
	                        for (let i = 0; i < this.homeyIP.length; i++)
	                        {
	                            request[7 + idSize + i] = this.homeyIP.charCodeAt(i);
	                        }

	                        // copy the push server port to the request as 2 bytes
	                        request[7 + idSize + this.homeyIP.length] = this.pushServerPort >> 8;
	                        request[8 + idSize + this.homeyIP.length] = this.pushServerPort & 0xFF;

	                        interval = 16;	// 16 seconds
	                        // copy the interval to the request as 2 bytes
	                        request[9 + idSize + this.homeyIP.length] = interval >> 8; // updated to use this.homeyIP.length
	                        request[10 + idSize + this.homeyIP.length] = interval & 0xFF; // updated to use this.homeyIP.length

	                        // Set the format to 0
	                        request[11 + idSize + this.homeyIP.length] = 0; // updated to use this.homeyIP.length

	                        // Enable the custom server
	                        request[12 + idSize + this.homeyIP.length] = 1; // updated to use this.homeyIP.length

	                        // set the packet size to 12 + idSize + this.homeyIP.length + 1
	                        request[3] = 12 + idSize + this.homeyIP.length; // updated to use this.homeyIP.length

	                        // Compute the checksum which is the sum of all the bytes from 2 to packetSize
	                        let checksum = 0;
	                        for (let i = 2; i < request.length - 1; i++) // adjusted loop to use request.length
	                        {
	                            checksum += request[i];
	                        }
	                        request[13 + idSize + this.homeyIP.length] = checksum; // updated to set checksum in the last position of the request array

	                        // Reaize the request to the correct size
	                        request = request.slice(0, request[3] + 2);

	                        client.write(request);
	                    }

	                    // Close the TCP connection
	                    client.end();
	                }

	            });

	            client.on('close', () =>
	            {
	                this.updateLog('Connection closed');
	            });
	        }
	    });

		this.broadcastServer.bind(46000, () =>
		{
			this.updateLog(`Broadcast server bind to port 46000. Setting broadcast...`);
			try
			{
				this.broadcastServer.setBroadcast(true);
			}
			catch (err)
			{
				this.updateLog(`Error setting broadcast: ${err.message}`, 0);
				this.broadcastServer.close();
				return;
			}

			this.updateLog(`Broadcast server ready to receive data`);
		});

	}

}

module.exports = MyApp;