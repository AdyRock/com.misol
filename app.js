'use strict';
if (process.env.DEBUG === '1')
{
    require('inspector').open(9222, '0.0.0.0', true);
}

const Homey = require('homey');
const http = require('http');
const nodemailer = require("nodemailer");

class MyApp extends Homey.App
{
    /**
     * onInit is called when the app is initialized.
     */
    async onInit()
    {
        this.log('MyApp has been initialized');
        this.pushServerPort = this.homey.settings.get('port');
        if (!this.pushServerPort)
        {
            this.pushServerPort = 7777;
            this.homey.settings.set('port', this.pushServerPort);
        }

        this.runsListener();
        this.detectedGateways = [];

        this.homey.settings.on('set', (key) =>
        {
            if (key === 'port')
            {
                this.pushServerPort = this.homey.settings.get('port');
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
            return value === args.value;
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
            return value === args.value;
        });

        let measure_temperature_dewPoint_equalCondition = this.homey.flow.getConditionCard('measure_temperature.dewPoint_equal');
        measure_temperature_dewPoint_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_temperature.dewPoint');
            return value === args.value;
        });

        let measure_rain_event_is_lessCondition = this.homey.flow.getConditionCard('measure_rain.event_is_less');
        measure_rain_event_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.event');
            return value === args.value;
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
            return value === args.value;
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
            return value === args.value;
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
            return value === args.value;
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
            return value === args.value;
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
            return value === args.value;
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
            return value === args.value;
        });

        let measure_rain_total_equalCondition = this.homey.flow.getConditionCard('measure_rain.total_equal');
        measure_rain_total_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_rain.total');
            return value === args.value;
        });

        // Lightening conditions
        let measure_lightning_is_lessCondition = this.homey.flow.getConditionCard('measure_lightning_is_less');
        measure_lightning_is_lessCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_lightning');
            return value === args.value;
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
            return value === args.value;
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
            return value === args.value;
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
            return value === args.value;
        });

        let measure_aqi_avg_equalCondition = this.homey.flow.getConditionCard('measure_aqi.avg_equal');
        measure_aqi_avg_equalCondition.registerRunListener(async (args, state) =>
        {
            let value = args.device.getCapabilityValue('measure_aqi.avg');
            return value === args.value;
        });
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
                let bodyMsg = body;
                body = '';
                response.writeHead(200);
                response.end('ok');
                try
                {
                    const data = JSON.parse('{"' + bodyMsg.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function(key, value) { return key === "" ? value : decodeURIComponent(value); });
                    this.updateLog(this.varToString(data), 1);

                    // Update discovery array used to add devices
                    var gatewatEntry = this.detectedGateways.findIndex(x => x.PASSKEY === data.PASSKEY);
                    if (gatewatEntry === -1)
                    {
                        this.detectedGateways.push(data);
                    }
                    else
                    {
                        this.detectedGateways[ gatewatEntry ] =  data;
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
    
                    this.log(data);
                }
                catch(err)
                {
                    this.updateLog(this.varToString(err), 0);
                }
            });
        };

        const server = http.createServer(requestListener);
        server.listen(this.pushServerPort);
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
                    subject: "LinkTap " + body.logType + " log", // Subject line
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
}

module.exports = MyApp;