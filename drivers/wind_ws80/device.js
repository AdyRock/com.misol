'use strict';
const Sector = {
    'en': ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'],
    'nl': ['N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO', 'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW', 'N'],
    'de': ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N']
};

const { Device } = require('homey');

class WindWS80Device extends Device
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
            this.setSettings({gatewayID: dd.id}).catch(this.error);
        }
        this.stationType = this.getSetting('stationType');

        if (!this.hasCapability('measure_wind_direction'))
        {
            this.addCapability('measure_wind_direction');
        }

        if (!this.hasCapability('measure_luminance'))
        {
            this.addCapability('measure_luminance');
        }

		if (this.hasCapability('measure_rain'))
		{
			this.removeCapability('measure_rain');
		}

		if (!this.hasCapability('measure_rain.rate'))
		{
			this.addCapability('measure_rain.rate');
		}

        this.unitsChanged('SpeedUnits');
		this.unitsChanged('RainfallUnits');

		this.log('WindWS80Device has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
			this.unitsChanged('SpeedUnits');
			this.unitsChanged('RainfallUnits');

            this.log('WindWS80Device has been added');
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
        let id = this.getSetting('gatewayID');
        if (!id)
        {
            const dd = this.getData();
            this.setSetting('gatewayID', dd.id);
        }

        this.log('WindWS80Device settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.log('WindWS80Device was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log('WindWS80Device has been deleted');
    }

	// Merge the new units with the current options
	setUnitsOptions(capability, newUnits)
	{
		if (this.hasCapability(capability))
		{
			let options = {};
			try
			{
				options = this.getCapabilityOptions(capability);
			}
			catch (error)
			{
				// No options set yet
				const drivers = this.homey.app.manifest.drivers;
				const driver = drivers.find(driver => driver.id === this.driver.id);
				const capabilityOpt = driver.capabilitiesOptions[capability];
				if (capabilityOpt && capabilityOpt.title)
				{
					const title = capabilityOpt.title;
					options = { title: title };
				}
			}

			const combinedOptions = Object.assign(options, newUnits);
			this.setCapabilityOptions(capability, combinedOptions).catch(this.error);
			this.setCapabilityValue(capability, null).catch(this.error);
		}
	}

    async unitsChanged( Units )
    {
        if ( Units === 'SpeedUnits' )
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
				case '3':
					unitsText = this.homey.__('speedUnits.knots');
					break;
				default:
                    unitsText = this.homey.__('speedUnits.km');
                    break;
            }

			this.setUnitsOptions('measure_wind_strength', { "units": unitsText });
			this.setUnitsOptions('measure_gust_strength', { "units": unitsText });
			this.setUnitsOptions('measure_gust_strength.daily', { "units": unitsText });
        }

		if (Units === 'RainfallUnits')
		{
			let unitsText = '';
			let decimals = 2;
			switch (this.homey.app.RainfallUnits)
			{
				case '0':
					unitsText = this.homey.__('rainfallUnits.mm');
					break;
				case '1':
					unitsText = this.homey.__('rainfallUnits.in');
					decimals = 3;
					break;
				default:
					unitsText = this.homey.__('rainfallUnits.mm');
					break;

			}

			this.setUnitsOptions('measure_rain.rate', { "units": `${unitsText}/hr` });
			this.setUnitsOptions('measure_rain.event', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.hourly', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.daily', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.weekly', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.monthly', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.yearly', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.total', { "units": unitsText, "decimals": decimals });
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

           // Wind Speed is in MPH, convert to the selected unit
			if ( this.homey.app.SpeedUnits === '0' )
            {
				// km/h
                this.setCapabilityValue('measure_wind_strength', windSpeed * 1.609344).catch(this.error);
                this.setCapabilityValue('measure_gust_strength', Number(gateway.windgustmph) * 1.609344).catch(this.error);
                this.setCapabilityValue('measure_gust_strength.daily', Number(gateway.maxdailygust) * 1.609344).catch(this.error);
            }
            else if ( this.homey.app.SpeedUnits === '1' )
            {
				// m/s
                this.setCapabilityValue('measure_wind_strength', (windSpeed * 1.609344) * 1000 / 3600).catch(this.error);
                this.setCapabilityValue('measure_gust_strength', (Number(gateway.windgustmph) * 1.609344) * 1000 / 3600).catch(this.error);
                this.setCapabilityValue('measure_gust_strength.daily', (Number(gateway.maxdailygust) * 1.609344) * 1000 / 3600).catch(this.error);
            }
			else if ( this.homey.app.SpeedUnits === '2' )
			{
				// mph
				this.setCapabilityValue('measure_wind_strength', windSpeed).catch(this.error);
				this.setCapabilityValue('measure_gust_strength', Number(gateway.windgustmph)).catch(this.error);
				this.setCapabilityValue('measure_gust_strength.daily', Number(gateway.maxdailygust)).catch(this.error);
			}
			else if ( this.homey.app.SpeedUnits === '3' )
			{
				// knots
				this.setCapabilityValue('measure_wind_strength', windSpeed / 1.15078).catch(this.error);
				this.setCapabilityValue('measure_gust_strength', Number(gateway.windgustmph) / 1.15078).catch(this.error);
				this.setCapabilityValue('measure_gust_strength.daily', Number(gateway.maxdailygust) / 1.15078).catch(this.error);
			}

            this.setCapabilityValue('measure_wind_angle', parseInt(gateway.winddir)).catch(this.error);

            var index = parseInt(gateway.winddir / 22.5);
            let langCode = this.homey.i18n.getLanguage();

            if (!(Object.getOwnPropertyNames(Sector)).includes(langCode))
            {
                langCode = 'en';
            }
            let windDir = Sector[langCode][index];
            this.setCapabilityValue('measure_wind_direction', windDir).catch(this.error);

            this.setCapabilityValue('measure_radiation', Number(gateway.solarradiation)).catch(this.error);
            this.setCapabilityValue('measure_ultraviolet', Number(gateway.uv)).catch(this.error);
            this.setCapabilityValue('measure_rain.rate', Number(gateway.rainratein) * 25.4).catch(this.error);

            var batteryType = this.getSetting( 'batteryType' );
            const batV = Number(gateway.wh80batt);
            var batP = 0;

            if (batteryType === '0')
            {
                batP = (batV - 0.9) / (1.7 - 0.9) * 100;
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
                feelsLike = 0.5 * (temperatureF + 61.0 + ((temperatureF - 68.0) * 1.2) + (relativeHumidity * 0.094));

                if (feelsLike >= 80)
                {
                    feelsLike = -42.379 + 2.04901523 * temperatureF + 10.14333127 * relativeHumidity - 0.22475541 * temperatureF*relativeHumidity - 0.00683783 * temperatureF * temperatureF - 0.05481717 * relativeHumidity*relativeHumidity + 0.00122874 * temperatureF*temperatureF * relativeHumidity + 0.00085282 * temperatureF*relativeHumidity*relativeHumidity - 0.00000199 * temperatureF * temperatureF * relativeHumidity * relativeHumidity;
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

            dewPoint = Math.round( dewPoint * 10 + Number.EPSILON ) / 10;

            if (dewPoint != this.getCapabilityValue('measure_temperature.dewPoint'))
            {
                this.setCapabilityValue('measure_temperature.dewPoint', dewPoint).catch(this.error);
            }
        }
    }
}

module.exports = WindWS80Device;