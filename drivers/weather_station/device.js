'use strict';

const { Device } = require('homey');

class WeatherStationDevice extends Device
{
    /**
     * onInit is called when the device is initialized.
     */
    async onInit()
    {
        this.log('WeatherStationDevice has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.log('WeatherStationDevice has been added');
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({ oldSettings, newSettings, changedKeys })
    {
        this.log('WeatherStationDevice settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.log('WeatherStationDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log('WeatherStationDevice has been deleted');
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();
        if (gateway.PASSKEY === dd.id)
        {
            var temperatureF = Number(gateway.tempf);
            var windSpeed = Number(gateway.windspeedmph);
            var relativeHumidity = parseInt(gateway.humidity);

            await this.setCapabilityValue('measure_humidity', relativeHumidity);
            await this.setCapabilityValue('measure_pressure', Number(gateway.baromabsin) * 33.8639);
            await this.setCapabilityValue('measure_temperature', (temperatureF - 32) * 5 / 9);
            await this.setCapabilityValue('measure_wind_angle', parseInt(gateway.winddir));
            await this.setCapabilityValue('measure_wind_strength', windSpeed * 1.609344);
            await this.setCapabilityValue('measure_gust_strength', Number(gateway.windgustmph) * 1.609344);
            await this.setCapabilityValue('measure_gust_strength.daily', Number(gateway.maxdailygust) * 1.609344);
            await this.setCapabilityValue('measure_radiation', Number(gateway.solarradiation));
            await this.setCapabilityValue('measure_ultraviolet', Number(gateway.uv));
            await this.setCapabilityValue('measure_rain', Number(gateway.rainratein) * 25.4);


            let rain = Number(gateway.eventrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.event'))
            {
                await this.setCapabilityValue('measure_rain.event', rain);
                this.driver.trigger_measure_rain_event(this, rain);
            }

            rain = Number(gateway.hourlyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.hourly'))
            {
                await this.setCapabilityValue('measure_rain.hourly', rain);
                this.driver.trigger_measure_rain_hourly(this, rain);
            }

            rain = Number(gateway.dailyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.daily'))
            {
                await this.setCapabilityValue('measure_rain.daily', rain);
                this.driver.trigger_measure_rain_daily(this, rain);
            }

            rain = Number(gateway.weeklyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.weekly'))
            {
                await this.setCapabilityValue('measure_rain.weekly', rain);
                this.driver.trigger_measure_rain_weekly(this, rain);
            }

            rain = Number(gateway.monthlyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.monthly'))
            {
                await this.setCapabilityValue('measure_rain.monthly', rain);
                this.driver.trigger_measure_rain_monthly(this, rain);
            }

            rain = Number(gateway.yearlyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.yearly'))
            {
                await this.setCapabilityValue('measure_rain.yearly', rain);
                this.driver.trigger_measure_rain_yearly(this, rain);
            }

            rain = Number(gateway.totalrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.total'))
            {
                await this.setCapabilityValue('measure_rain.total', rain);
                this.driver.trigger_measure_rain_total(this, rain);
            }

            rain = Number(gateway.dailyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.daily'))
            {
                await this.setCapabilityValue('measure_rain.daily', rain);
                this.driver.trigger_measure_rain_daily(this, rain);
            }

            await this.setCapabilityValue('alarm_battery', gateway.wh65batt === '1');


            var feelsLike = 0;

            // Try Wind Chill first
            if ((temperatureF <= 50) && (windSpeed >= 3))
            {
                feelsLike = 35.74 + (0.6215*temperatureF) - 35.75*(windSpeed**0.16) + ((0.4275*temperatureF)*(windSpeed**0.16));
            }
            else
            {
                feelsLike = temperatureF;
            }
            
            // Replace it with the Heat Index, if necessary
            if ((feelsLike == temperatureF) && (temperatureF >= 80))
            {
                feelsLike = 0.5 * (temperatureF + 61.0 + ((temperatureF - 68.0) * 1.2) + (relativeHumidity * 0.094))
            
                if (feelsLike >= 80)
                {
                    feelsLike = -42.379 + 2.04901523 * temperatureF + 10.14333127 * relativeHumidity - 0.22475541 * temperatureF*relativeHumidity - 0.00683783 * temperatureF * temperatureF - 0.05481717 * relativeHumidity*relativeHumidity + 0.00122874 * temperatureF*temperatureF * relativeHumidity + 0.00085282 * temperatureF*relativeHumidity*relativeHumidity - .00000199 * temperatureF * temperatureF * relativeHumidity * relativeHumidity;
                    if ((relativeHumidity < 13) && (temperatureF >= 80) && (temperatureF <= 112))
                    {
                        feelsLike = feelsLike - ((13 - relativeHumidity) /4) * Math.sqrt((17 - Math.fabs(temperatureF - 95)) / 17);
                        if ((relativeHumidity > 85) && (temperatureF >= 80) && (temperatureF <= 87))
                        {
                            feelsLike = feelsLike + ((relativeHumidity -85 ) / 10) * ((87 - temperatureF) / 5);
                        }
                    }
                }
            }

            let temperature = (feelsLike - 32) * 5 / 9;
            temperature = Math.round( temperature * 10 + Number.EPSILON ) / 10;
            if (temperature != this.getCapabilityValue('measure_temperature.feelsLike'))
            {
                await this.setCapabilityValue('measure_temperature.feelsLike', temperature);
                this.driver.trigger_measure_temperature_feelsLike(this, temperature);
            }

            relativeHumidity /= 100;
            var dewPoint = (temperatureF - 32) * 5 / 9;
            if (dewPoint > 0 && dewPoint < 60)
            {
                if ((relativeHumidity) > 0.01 && (relativeHumidity < 1))
                {
                    var a = 17.27;
                    var b = 237.7;
                    var alphaTR = ((a * dewPoint) / (b + dewPoint)) + Math.log(relativeHumidity);
                    var Tr = (b * alphaTR) / (a - alphaTR);
                    if (Tr >= 0 && Tr <= 50)
                    {
                        dewPoint = Tr;
                    }
                }
            }

            dewPoint = Math.round( dewPoint * 10 + Number.EPSILON ) / 10;

            if (dewPoint != this.getCapabilityValue('measure_temperature.dewPoint'))
            {
                await this.setCapabilityValue('measure_temperature.dewPoint', dewPoint);
                this.driver.trigger_measure_temperature_dewPoint(this, dewPoint);
            }
        }
    }
}

module.exports = WeatherStationDevice;