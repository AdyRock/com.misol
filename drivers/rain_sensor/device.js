'use strict';

const { Device } = require('homey');

class RainSensorDevice extends Device
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

        if (!this.hasCapability('measure_hours_since_rained'))
        {
            await this.addCapability('measure_hours_since_rained');
        }

		if (!this.hasCapability('measure_battery'))
		{
			await this.addCapability('measure_battery');
		}

        this.lastRained = this.homey.settings.get('lastRainedTime');
        if (this.lastRained === null)
        {
            const now = new Date(Date.now());
            this.lastRained = now.getTime();
            this.homey.settings.set('lastRainedTime', this.lastRained);
        }

		this.unitsChanged('RainfallUnits');

		this.log('RainSensorDevice has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
		this.unitsChanged('RainfallUnits');
        this.log('RainSensorDevice has been added');
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
        this.log('RainSensorDevice settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.log('RainSensorDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log('RainSensorDevice has been deleted');
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
			}

			if (gateway.totalrainin)
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
					this.removeCapability('measure_rain.total');
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

				let rain = Number(rainratein) * rainConversion;
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
					this.removeCapability('measure_rain.rate');
				}
				if (this.hasCapability('measure_hours_since_rained'))
				{
					this.removeCapability('measure_hours_since_rained');
				}
			}

			rain = Number(eventrainin) * rainConversion;
            if (rain != this.getCapabilityValue('measure_rain.event'))
            {
                this.setCapabilityValue('measure_rain.event', rain).catch(this.error);
                //this.driver.trigger_measure_rain_event(this, rain);
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

            if (this.hasCapability('measure_rain.total'))
			{
				rain = Number(totalrainin) * rainConversion
				if (rain != this.getCapabilityValue('measure_rain.total'))
				{
					this.setCapabilityValue('measure_rain.total', rain).catch(this.error);
				}
			}

			rain = Number(dailyrainin) * rainConversion;
            if (rain != this.getCapabilityValue('measure_rain.daily'))
            {
                this.setCapabilityValue('measure_rain.daily', rain).catch(this.error);
            }

			if (gateway.wh40batt !== undefined)
			{
				var batteryType = this.getSetting('batteryType');
				const batV = Number(gateway.wh40batt);
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
			}
        }
    }
}

module.exports = RainSensorDevice;