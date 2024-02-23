'use strict';

const { Device } = require('homey');
const Sector = {
    'en': ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'],
    'nl': ['N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO', 'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW', 'N']
};

class WeatherStationDevice extends Device
{
    /**
     * onInit is called when the device is initialized.
     */
    async onInit()
    {
        let id = this.getSetting('gatewayID');
        if (!id)
        {
            const dd = this.getData();
            this.setSettings({gatewayID: dd.id}).catch(this.error);;
        }
        this.stationType = this.getSetting('stationType');

        // if (!this.hasCapability('measure_hours_since_rained'))
        // {
        //     this.addCapability('measure_hours_since_rained');
        // }

        if (!this.hasCapability('measure_wind_direction'))
        {
            this.addCapability('measure_wind_direction');
        }

        if (!this.hasCapability('measure_luminance'))
        {
            this.addCapability('measure_luminance');
        }

        this.lastRained = this.homey.settings.get('lastRainedTime');
        if (this.lastRained === null)
        {
            const now = new Date(Date.now());
            this.lastRained = now.getTime();
            this.homey.settings.set('lastRainedTime', this.lastRained);
        }
        this.log('WeatherStationDevice has been initialized');
        this.unitsChanged('SpeedUnits');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        let unitsText = this.homey.app.SpeedUnits === '0' ? this.homey.__('speedUnits.km') : this.homey.__('speedUnits.m');

        this.setCapabilityOptions('measure_wind_strength', { "units": unitsText }).catch(this.error);
        this.setCapabilityOptions('measure_gust_strength', { "units": unitsText }).catch(this.error);

        var opts = this.getCapabilityOptions('measure_gust_strength.daily');
        opts.units = unitsText;
        this.setCapabilityOptions('measure_gust_strength.daily', opts).catch(this.error);

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

    async unitsChanged(Units)
    {
        if (Units === 'SpeedUnits')
        {
            let unitsText = '';
            
            switch (this.homey.app.SpeedUnits)
            {
                case '0':
                    unitsText = this.homey.__('speedUnits.km');
                    break;
                case '1':
                    unitsText = this.homey.__('speedUnits.m');
                    break;
                case '2':
                    unitsText = this.homey.__('speedUnits.mph');
                    break;
                default:
                    unitsText = this.homey.__('speedUnits.km');
                    break;
            }

            this.setCapabilityOptions('measure_wind_strength', { "units": unitsText }).catch(this.error);
            this.setCapabilityOptions('measure_gust_strength', { "units": unitsText }).catch(this.error);

            var opts = this.getCapabilityOptions('measure_gust_strength.daily');
            opts.units = unitsText;
            this.setCapabilityOptions('measure_gust_strength.daily', opts).catch(this.error);

            this.setCapabilityValue('measure_wind_strength', null).catch(this.error);
            this.setCapabilityValue('measure_gust_strength', null).catch(this.error);
            this.setCapabilityValue('measure_gust_strength.daily', null).catch(this.error);
        }
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();
        if (gateway.PASSKEY === dd.id)
        {
            if (!this.stationType)
            {
                this.stationType = gateway.stationtype;
                this.setSettings({stationType: this.stationType}).catch(this.error);;
            }

            var temperatureF = Number(gateway.tempf);
            var windSpeed = Number(gateway.windspeedmph);
            var relativeHumidity = parseInt(gateway.humidity);

            this.setCapabilityValue('measure_humidity', relativeHumidity).catch(this.error);
            this.setCapabilityValue('measure_pressure', Number(gateway.baromrelin) * 33.8639).catch(this.error);
            this.setCapabilityValue('measure_temperature', (temperatureF - 32) * 5 / 9).catch(this.error);

            if (this.homey.app.SpeedUnits === '0')
            {
                this.setCapabilityValue('measure_wind_strength', windSpeed * 1.609344).catch(this.error);
                this.setCapabilityValue('measure_gust_strength', Number(gateway.windgustmph) * 1.609344).catch(this.error);
                this.setCapabilityValue('measure_gust_strength.daily', Number(gateway.maxdailygust) * 1.609344).catch(this.error);
            }
            else if (this.homey.app.SpeedUnits === '1')
            {
                this.setCapabilityValue('measure_wind_strength', (windSpeed * 1.609344) * 1000 / 3600).catch(this.error);
                this.setCapabilityValue('measure_gust_strength', (Number(gateway.windgustmph) * 1.609344) * 1000 / 3600).catch(this.error);
                this.setCapabilityValue('measure_gust_strength.daily', (Number(gateway.maxdailygust) * 1.609344) * 1000 / 3600).catch(this.error);
            }
            else
            {
                this.setCapabilityValue('measure_wind_strength', windSpeed).catch(this.error);
                this.setCapabilityValue('measure_gust_strength', Number(gateway.windgustmph)).catch(this.error);
                this.setCapabilityValue('measure_gust_strength.daily', Number(gateway.maxdailygust)).catch(this.error);
            }

            this.setCapabilityValue('measure_wind_angle', parseInt(gateway.winddir)).catch(this.error);

            var index = parseInt(gateway.winddir / 22.5);
            let langCode = this.homey.i18n.getLanguage();
            if ((langCode !== 'en') && (langCode !== 'nl'))
            {
                langCode = 'en';
            }
            let windDir = Sector[langCode][index];
            this.setCapabilityValue('measure_wind_direction', windDir).catch(this.error);

            this.setCapabilityValue('measure_radiation', Number(gateway.solarradiation)).catch(this.error);
            this.setCapabilityValue('measure_luminance', Number(gateway.solarradiation) * 126.7).catch(this.error);
            this.setCapabilityValue('measure_ultraviolet', Number(gateway.uv)).catch(this.error);

            let rainratein = null;
            let eventrainin = 0;
            let hourlyrainin = 0;
            let dailyrainin = 0;
            let weeklyrainin = 0;
            let monthlyrainin = 0;
            let yearlyrainin = 0;
            let totalrainin = 0;

            if (gateway.rainratein)
            {
                rainratein = gateway.rainratein;
            }

            if (gateway.eventrainin)
            {
                eventrainin = gateway.eventrainin;
                hourlyrainin = gateway.hourlyrainin;
                dailyrainin = gateway.dailyrainin;
                weeklyrainin = gateway.weeklyrainin;
                monthlyrainin = gateway.monthlyrainin;
                yearlyrainin = gateway.yearlyrainin;
                totalrainin = gateway.totalrainin;

                let rain = Number(totalrainin) * 25.4;
                if (rain != this.getCapabilityValue('measure_rain.total'))
                {
                    this.setCapabilityValue('measure_rain.total', rain).catch(this.error);
                }
            }
            else if (gateway.rrain_piezo)
            {
                rainratein = gateway.rrain_piezo;
                eventrainin = gateway.erain_piezo;
                hourlyrainin = gateway.hrain_piezo;
                dailyrainin = gateway.drain_piezo;
                weeklyrainin = gateway.wrain_piezo;
                monthlyrainin = gateway.mrain_piezo;
                yearlyrainin = gateway.yrain_piezo;

                if (this.hasCapability('measure_rain.total'))
                {
                    this.removeCapability('measure_rain.total');
                }
            }

            let rain = 0;
            if (rainratein !== null)
            {
                if (!this.hasCapability('measure_rain'))
                {
                    await this.addCapability('measure_rain');

                }
                if (!this.hasCapability('measure_hours_since_rained'))
                {
                    await this.addCapability('measure_hours_since_rained');

                }

                rain = Number(rainratein) * 25.4;
                this.setCapabilityValue('measure_rain', rain).catch(this.error);

                if (rain > 0)
                {
                    const now = new Date(Date.now());
                    this.lastRained = now.getTime();
                    this.homey.settings.set('lastRainedTime', this.lastRained);
                    this.setCapabilityValue('measure_hours_since_rained', 0).catch(this.error);
                }
                else
                {
                    const now = new Date(Date.now());
                    const diff = now.getTime() - this.lastRained;
                    const noRainHours = Math.floor(diff / 1000 / 60 / 60);
                    this.setCapabilityValue('measure_hours_since_rained', noRainHours).catch(this.error);
                }
            }
            else
            {
                if (this.hasCapability('measure_rain'))
                {
                    this.removeCapability('measure_rain');
                }
                if (this.hasCapability('measure_hours_since_rained'))
                {
                    this.removeCapability('measure_hours_since_rained');
                }
            }

            rain = Number(eventrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.event'))
            {
                this.setCapabilityValue('measure_rain.event', rain).catch(this.error);
            }

            rain = Number(hourlyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.hourly'))
            {
                this.setCapabilityValue('measure_rain.hourly', rain).catch(this.error);
            }

            rain = Number(dailyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.daily'))
            {
                this.setCapabilityValue('measure_rain.daily', rain).catch(this.error);
            }

            rain = Number(weeklyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.weekly'))
            {
                this.setCapabilityValue('measure_rain.weekly', rain).catch(this.error);
            }

            rain = Number(monthlyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.monthly'))
            {
                this.setCapabilityValue('measure_rain.monthly', rain).catch(this.error);
            }

            rain = Number(yearlyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.yearly'))
            {
                this.setCapabilityValue('measure_rain.yearly', rain).catch(this.error);
            }

            rain = Number(dailyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.daily'))
            {
                this.setCapabilityValue('measure_rain.daily', rain).catch(this.error);
            }

            if (gateway.wh65batt)
            {
                if (this.hasCapability('measure_battery'))
                {
                    this.removeCapability('measure_battery');
                }
                this.setCapabilityValue('alarm_battery', gateway.wh65batt === '1').catch(this.error);
            }
            else if (gateway.wh90batt)
            {
                if (this.hasCapability('alarm_battery'))
                {
                    this.removeCapability('alarm_battery');
                }
                var batV = Number(gateway.wh90batt);
                if (batV > 0)
                {
                    if (!this.hasCapability('measure_battery'))
                    {
                        await this.addCapability('measure_battery').catch(this.error);
                    }

                    var batteryType = this.getSetting('batteryType');
                    var batP = 0;

                    if (batteryType === '0')
                    {
                        batP = (batV - 0.9) / (1.6 - 0.9) * 100;
                    }
                    else
                    {
                        batP = (batV - 0.9) / (1.3 - 0.9) * 100;
                    }

                    if (batP > 100)
                    {
                        batP = 100;
                    }
                    if (batP < 0)
                    {
                        batP = 0;
                    }
                    this.setCapabilityValue('measure_battery', batP).catch(this.error);
                }
            }
            else if (gateway.battout)
            {
                if (this.hasCapability('measure_battery'))
                {
                    this.removeCapability('measure_battery');
                }
                this.setCapabilityValue('alarm_battery', gateway.battout === '0').catch(this.error);
            }

            var feelsLike = 0;

            // Try Wind Chill first
            if ((temperatureF <= 50) && (windSpeed >= 3))
            {
                feelsLike = 35.74 + (0.6215 * temperatureF) - 35.75 * (windSpeed ** 0.16) + ((0.4275 * temperatureF) * (windSpeed ** 0.16));
            }
            else
            {
                feelsLike = temperatureF;
            }

            // Replace it with the Heat Index, if necessary
            if ((feelsLike === temperatureF) && (temperatureF >= 80))
            {
                feelsLike = 0.5 * (temperatureF + 61.0 + ((temperatureF - 68.0) * 1.2) + (relativeHumidity * 0.094));

                if (feelsLike >= 80)
                {
                    feelsLike = -42.379 + 2.04901523 * temperatureF + 10.14333127 * relativeHumidity - 0.22475541 * temperatureF * relativeHumidity - 0.00683783 * temperatureF * temperatureF - 0.05481717 * relativeHumidity * relativeHumidity + 0.00122874 * temperatureF * temperatureF * relativeHumidity + 0.00085282 * temperatureF * relativeHumidity * relativeHumidity - 0.00000199 * temperatureF * temperatureF * relativeHumidity * relativeHumidity;
                    if ((relativeHumidity < 13) && (temperatureF >= 80) && (temperatureF <= 112))
                    {
                        feelsLike = feelsLike - ((13 - relativeHumidity) / 4) * Math.sqrt((17 - Math.abs(temperatureF - 95)) / 17);
                        if ((relativeHumidity > 85) && (temperatureF >= 80) && (temperatureF <= 87))
                        {
                            feelsLike = feelsLike + ((relativeHumidity - 85) / 10) * ((87 - temperatureF) / 5);
                        }
                    }
                }
            }

            let temperature = (feelsLike - 32) * 5 / 9;
            temperature = Math.round(temperature * 10 + Number.EPSILON) / 10;
            if (temperature != this.getCapabilityValue('measure_temperature.feelsLike'))
            {
                this.setCapabilityValue('measure_temperature.feelsLike', temperature).catch(this.error);
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
                    dewPoint = Tr;
                }
            }

            dewPoint = Math.round(dewPoint * 10 + Number.EPSILON) / 10;

            if (dewPoint != this.getCapabilityValue('measure_temperature.dewPoint'))
            {
                this.setCapabilityValue('measure_temperature.dewPoint', dewPoint).catch(this.error);
            }
        }
    }
}

module.exports = WeatherStationDevice;