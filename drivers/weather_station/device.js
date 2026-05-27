'use strict';

const { Device } = require('homey');
const Sector = {
    'en': ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'],
    'nl': ['N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO', 'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW', 'N'],
    'de': ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N']
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

		const ignorePiezo = this.getSetting('ignorePiezo');
		if (ignorePiezo === undefined)
		{
			this.setSettings({ignorePiezo: false}).catch(this.error);
		}

        // if (!this.hasCapability('measure_hours_since_rained'))
        // {
        //     this.addCapability('measure_hours_since_rained');
        // }

        if (!this.hasCapability('measure_wind_direction'))
        {
            await this.addCapability('measure_wind_direction');
        }

        if (!this.hasCapability('measure_luminance'))
        {
            await this.addCapability('measure_luminance');
        }

        if (!this.hasCapability('measure_vpd'))
        {
            await this.addCapability('measure_vpd');
        }

        if (!this.hasCapability('measure_wind_angle.avg10m'))
        {
            await this.addCapability('measure_wind_angle.avg10m');
        }

        if (!this.hasCapability('measure_rain.last24h'))
        {
            await this.addCapability('measure_rain.last24h');
        }

        if (!this.hasCapability('measure_voltage.ws90cap'))
        {
            await this.addCapability('measure_voltage.ws90cap');
        }

        if (!this.hasCapability('measure_voltage.wh68'))
        {
            await this.addCapability('measure_voltage.wh68');
        }

		if (this.hasCapability('measure_rain'))
		{
			await this.removeCapability('measure_rain').catch(this.error);
		}

		if (!this.hasCapability('measure_rain.rate'))
		{
			await this.addCapability('measure_rain.rate');
		}

        this.lastRained = this.homey.settings.get('lastRainedTime');
        if (this.lastRained === null)
        {
            const now = new Date(Date.now());
            this.lastRained = now.getTime();
            this.homey.settings.set('lastRainedTime', this.lastRained);
        }
        this.unitsChanged('SpeedUnits');
		this.unitsChanged('RainfallUnits');

		this.log('WeatherStationDevice has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.unitsChanged('SpeedUnits');
		this.unitsChanged('RainfallUnits');

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
			let timeText = this.homey.__('hourAbbr');
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

			this.setUnitsOptions('measure_rain.rate', { "units": `${unitsText}/${timeText}`, "decimals": decimals });
			this.setUnitsOptions('measure_rain.event', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.hourly', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.daily', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.weekly', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.monthly', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.yearly', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.total', { "units": unitsText, "decimals": decimals });
			this.setUnitsOptions('measure_rain.last24h', { "units": unitsText, "decimals": decimals });
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
                this.setSettings({stationType: this.stationType}).catch(this.error);
            }

			const ignorePiezo = this.getSetting('ignorePiezo');

            var temperatureF = null

			if (gateway.humidity !== undefined)
			{
            	var relativeHumidity = parseInt(gateway.humidity);
            	this.setCapabilityValue('measure_humidity', relativeHumidity).catch(this.error);
			}

			const pressure = Number(gateway.baromrelin);
			if (!isNaN(pressure))
			{
				this.setCapabilityValue('measure_pressure', pressure * 33.8639).catch(this.error);
			}

			if (gateway.tempf !== undefined)
			{
				temperatureF = Number(gateway.tempf);
				this.setCapabilityValue('measure_temperature', (temperatureF - 32) * 5 / 9).catch(this.error);
			}

			if (gateway.windspeedmph !== undefined)
			{
				var windSpeed = Number(gateway.windspeedmph);
				// Speed data is in MPH, convert to the selected units
				if (this.homey.app.SpeedUnits === '1')
				{
					// MPS
					this.setCapabilityValue('measure_wind_strength', (windSpeed * 1.609344) * 1000 / 3600).catch(this.error);
					this.setCapabilityValue('measure_gust_strength', (Number(gateway.windgustmph) * 1.609344) * 1000 / 3600).catch(this.error);
					this.setCapabilityValue('measure_gust_strength.daily', (Number(gateway.maxdailygust) * 1.609344) * 1000 / 3600).catch(this.error);
				}
				else if (this.homey.app.SpeedUnits === '2')
				{
					// MPH
					this.setCapabilityValue('measure_wind_strength', windSpeed).catch(this.error);
					this.setCapabilityValue('measure_gust_strength', Number(gateway.windgustmph)).catch(this.error);
					this.setCapabilityValue('measure_gust_strength.daily', Number(gateway.maxdailygust)).catch(this.error);
				}
				else if (this.homey.app.SpeedUnits === '3')
				{
					// Knots
					this.setCapabilityValue('measure_wind_strength', windSpeed / 1.15078).catch(this.error);
					this.setCapabilityValue('measure_gust_strength', Number(gateway.windgustmph) / 1.15078).catch(this.error);
					this.setCapabilityValue('measure_gust_strength.daily', Number(gateway.maxdailygust) / 1.15078).catch(this.error);
				}
				else
				{
					// KPH
					this.setCapabilityValue('measure_wind_strength', windSpeed * 1.609344).catch(this.error);
					this.setCapabilityValue('measure_gust_strength', Number(gateway.windgustmph) * 1.609344).catch(this.error);
					this.setCapabilityValue('measure_gust_strength.daily', Number(gateway.maxdailygust) * 1.609344).catch(this.error);
				}
			}

            if (gateway.winddir !== undefined)
			{
				this.setCapabilityValue('measure_wind_angle', parseInt(gateway.winddir)).catch(this.error);

				var index = parseInt(gateway.winddir / 22.5);
				let langCode = this.homey.i18n.getLanguage();

				if (!(Object.getOwnPropertyNames(Sector)).includes(langCode))
				{
					langCode = 'en';
				}
				let windDir = Sector[langCode][index];
				this.setCapabilityValue('measure_wind_direction', windDir).catch(this.error);
			}

            if (gateway.solarradiation !== undefined)
			{
				const solarRadiation = Number(gateway.solarradiation);
				if (solarRadiation != this.getCapabilityValue('measure_radiation'))
				{
					this.setCapabilityValue('measure_radiation', solarRadiation).catch(this.error);
					this.homey.app.measure_radiation_changedTrigger
						.trigger(this, { measure_radiation: solarRadiation }, { value: solarRadiation })
						.catch(this.error);
				}
				this.setCapabilityValue('measure_luminance', solarRadiation * 126.7).catch(this.error);
			}

            if (gateway.uv !== undefined)
			{
				this.setCapabilityValue('measure_ultraviolet', Number(gateway.uv)).catch(this.error);
			}

			if (gateway.vpd !== undefined)
			{
				if (!this.hasCapability('measure_vpd'))
				{
					await this.addCapability('measure_vpd');
				}
				this.setCapabilityValue('measure_vpd', Number(gateway.vpd)).catch(this.error);
			}
			else if (this.hasCapability('measure_vpd'))
			{
				await this.removeCapability('measure_vpd').catch(this.error);
			}

            if (gateway.winddir_avg10m !== undefined)
			{
				if (!this.hasCapability('measure_wind_angle.avg10m'))
				{
					await this.addCapability('measure_wind_angle.avg10m');
				}
				this.setCapabilityValue('measure_wind_angle.avg10m', parseInt(gateway.winddir_avg10m)).catch(this.error);
			}
			else if (this.hasCapability('measure_wind_angle.avg10m'))
			{
				await this.removeCapability('measure_wind_angle.avg10m').catch(this.error);
			}

            let rainConversion = 25.4;
			if (this.homey.app.RainfallUnits === '1')
			{
				rainConversion = 1;
			}

			let rainratein = null;
            let eventrainin = 0;
            let hourlyrainin = 0;
            let dailyrainin = 0;
            let weeklyrainin = 0;
            let monthlyrainin = 0;
            let yearlyrainin = 0;
            let totalrainin = null;
            let last24hrainin = 0;

			if (gateway.rrain_piezo !== undefined && !ignorePiezo)
            {
                rainratein = gateway.rrain_piezo;
                eventrainin = gateway.erain_piezo;
                hourlyrainin = gateway.hrain_piezo;
                dailyrainin = gateway.drain_piezo;
                weeklyrainin = gateway.wrain_piezo;
                monthlyrainin = gateway.mrain_piezo;
                yearlyrainin = gateway.yrain_piezo;
                last24hrainin = gateway.last24hrain_piezo;

				if (gateway.srain_piezo !== undefined)
				{
					if (!this.hasCapability('alarm_rain'))
					{
						await this.addCapability('alarm_rain');
					}

					this.setCapabilityValue('alarm_rain', gateway.srain_piezo === '1').catch(this.error);
				}
            }
			else
			{
				if (gateway.rainratein !== undefined)
				{
					rainratein = gateway.rainratein;
				}
				if (gateway.eventrainin !== undefined)
				{
					eventrainin = gateway.eventrainin;
				}
				if (gateway.hourlyrainin !== undefined)
				{
					hourlyrainin = gateway.hourlyrainin;
				}
				if (gateway.dailyrainin !== undefined)
				{
					dailyrainin = gateway.dailyrainin;
				}
				if (gateway.weeklyrainin !== undefined)
				{
					weeklyrainin = gateway.weeklyrainin;
				}
				if (gateway.monthlyrainin !== undefined)
				{
					monthlyrainin = gateway.monthlyrainin;
				}
				if (gateway.yearlyrainin !== undefined)
				{
					yearlyrainin = gateway.yearlyrainin;
				}
			}

			if (gateway.totalrainin !== undefined)
			{
				totalrainin = gateway.totalrainin;
			}

			if (totalrainin !== null)
			{
				if (!this.hasCapability('measure_rain.total'))
				{
					await this.addCapability('measure_rain.total');
				}

				let rain = Number(totalrainin) * rainConversion;
				if (rain != this.getCapabilityValue('measure_rain.total'))
				{
					this.setCapabilityValue('measure_rain.total', rain).catch(this.error);
				}
			}
			else
			{
				if (this.hasCapability('measure_rain.total'))
				{
					await this.removeCapability('measure_rain.total').catch(this.error);
				}
			}

            let rain = 0;
            if (rainratein !== null)
            {
                if (!this.hasCapability('measure_rain.rate'))
                {
                    await this.addCapability('measure_rain.rate');

                }
                if (!this.hasCapability('measure_hours_since_rained'))
                {
                    await this.addCapability('measure_hours_since_rained');

                }

                rain = Number(rainratein) * rainConversion;
                this.setCapabilityValue('measure_rain.rate', rain).catch(this.error);

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
                if (this.hasCapability('measure_rain.rate'))
                {
					await this.removeCapability('measure_rain.rate').catch(this.error);
                }
                if (this.hasCapability('measure_hours_since_rained'))
                {
					await this.removeCapability('measure_hours_since_rained').catch(this.error);
                }
            }

            rain = Number(eventrainin) * rainConversion;
            if (rain != this.getCapabilityValue('measure_rain.event'))
            {
                this.setCapabilityValue('measure_rain.event', rain).catch(this.error);
            }

            rain = Number(hourlyrainin) * rainConversion;
            if (rain != this.getCapabilityValue('measure_rain.hourly'))
            {
                this.setCapabilityValue('measure_rain.hourly', rain).catch(this.error);
            }

            rain = Number(dailyrainin) * rainConversion;
            if (rain != this.getCapabilityValue('measure_rain.daily'))
            {
                this.setCapabilityValue('measure_rain.daily', rain).catch(this.error);
            }

            rain = Number(weeklyrainin) * rainConversion;
            if (rain != this.getCapabilityValue('measure_rain.weekly'))
            {
                this.setCapabilityValue('measure_rain.weekly', rain).catch(this.error);
            }

            rain = Number(monthlyrainin) * rainConversion;
            if (rain != this.getCapabilityValue('measure_rain.monthly'))
            {
                this.setCapabilityValue('measure_rain.monthly', rain).catch(this.error);
            }

            rain = Number(yearlyrainin) * rainConversion;
            if (rain != this.getCapabilityValue('measure_rain.yearly'))
            {
                this.setCapabilityValue('measure_rain.yearly', rain).catch(this.error);
            }

            rain = Number(dailyrainin) * rainConversion;
            if (rain != this.getCapabilityValue('measure_rain.daily'))
            {
                this.setCapabilityValue('measure_rain.daily', rain).catch(this.error);
            }

			if (last24hrainin !== 0 || (gateway.rrain_piezo !== undefined && !ignorePiezo))
			{
				if (!this.hasCapability('measure_rain.last24h'))
				{
					await this.addCapability('measure_rain.last24h');
				}
				rain = Number(last24hrainin) * rainConversion;
				if (rain != this.getCapabilityValue('measure_rain.last24h'))
				{
					this.setCapabilityValue('measure_rain.last24h', rain).catch(this.error);
				}
			}
			else if (this.hasCapability('measure_rain.last24h'))
			{
				await this.removeCapability('measure_rain.last24h').catch(this.error);
			}

			if (gateway.ws90cap_volt !== undefined)
			{
				if (!this.hasCapability('measure_voltage.ws90cap'))
				{
					await this.addCapability('measure_voltage.ws90cap');
				}
				this.setCapabilityValue('measure_voltage.ws90cap', Number(gateway.ws90cap_volt)).catch(this.error);
			}
			else if (this.hasCapability('measure_voltage.ws90cap'))
			{
				await this.removeCapability('measure_voltage.ws90cap').catch(this.error);
			}

			if (gateway.ws85cap_volt !== undefined)
			{
				if (!this.hasCapability('measure_voltage.ws85cap'))
				{
					await this.addCapability('measure_voltage.ws85cap');
				}
				this.setCapabilityValue('measure_voltage.ws85cap', Number(gateway.ws85cap_volt)).catch(this.error);
			}
			else if (this.hasCapability('measure_voltage.ws85cap'))
			{
				await this.removeCapability('measure_voltage.ws85cap').catch(this.error);
			}

			if (gateway.wh68batt !== undefined)
			{
				if (!this.hasCapability('measure_voltage.wh68'))
				{
					await this.addCapability('measure_voltage.wh68');
				}
				this.setCapabilityValue('measure_voltage.wh68', Number(gateway.wh68batt)).catch(this.error);
			}
			else if (this.hasCapability('measure_voltage.wh68'))
			{
				await this.removeCapability('measure_voltage.wh68').catch(this.error);
			}

			if (gateway.wh85batt !== undefined)
			{
				if (!this.hasCapability('measure_voltage.wh85'))
				{
					await this.addCapability('measure_voltage.wh85');
				}
				this.setCapabilityValue('measure_voltage.wh85', Number(gateway.wh85batt)).catch(this.error);
			}
			else if (this.hasCapability('measure_voltage.wh85'))
			{
				await this.removeCapability('measure_voltage.wh85').catch(this.error);
			}

            if (gateway.wh65batt)
            {
                if (this.hasCapability('measure_battery'))
                {
					await this.removeCapability('measure_battery').catch(this.error);
                }
                this.setCapabilityValue('alarm_battery', gateway.wh65batt === '1').catch(this.error);
            }
            else if (gateway.wh90batt)
            {
                if (this.hasCapability('alarm_battery'))
                {
					await this.removeCapability('alarm_battery').catch(this.error);
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
					await this.removeCapability('measure_battery').catch(this.error);
                }
                this.setCapabilityValue('alarm_battery', gateway.battout === '0').catch(this.error);
            }

			if (temperatureF !== null || relativeHumidity !== undefined)
			{
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

				// Convert to Celsius
				feelsLike = (feelsLike - 32) * 5 / 9;
				feelsLike = Math.round(feelsLike * 10 + Number.EPSILON) / 10;
				if (feelsLike != this.getCapabilityValue('measure_temperature.feelsLike'))
				{
					this.setCapabilityValue('measure_temperature.feelsLike', feelsLike).catch(this.error);
				}

				// Calculate Dew Point
				relativeHumidity /= 100;
				var temperature = (temperatureF - 32) * 5 / 9;
				var dewPoint = 0;

				if (relativeHumidity > 0.01 && relativeHumidity <= 1)
				{
					var a = 17.625;
					var b = 243.04;
					var alpha = Math.log(relativeHumidity) + (a * temperature) / (b + temperature);
					dewPoint = (b * alpha) / (a - alpha);
				}

				dewPoint = Math.round(dewPoint * 10 + Number.EPSILON) / 10;

				if (dewPoint != this.getCapabilityValue('measure_temperature.dewPoint'))
				{
					this.setCapabilityValue('measure_temperature.dewPoint', dewPoint).catch(this.error);
				}
			}
        }
    }
}

module.exports = WeatherStationDevice;