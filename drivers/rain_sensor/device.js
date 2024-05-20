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
            this.addCapability('measure_hours_since_rained');
        }

        this.lastRained = this.homey.settings.get('lastRainedTime');
        if (this.lastRained === null)
        {
            const now = new Date(Date.now());
            this.lastRained = now.getTime();
            this.homey.settings.set('lastRainedTime', this.lastRained);
        }
        this.log('RainSensorDevice has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
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

            let rain = Number(gateway.rainratein) * 25.4;
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

            rain = Number(gateway.eventrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.event'))
            {
                this.setCapabilityValue('measure_rain.event', rain).catch(this.error);
                //this.driver.trigger_measure_rain_event(this, rain);
            }

            rain = Number(gateway.hourlyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.hourly'))
            {
                this.setCapabilityValue('measure_rain.hourly', rain).catch(this.error);
                //this.driver.trigger_measure_rain_hourly(this, rain);
            }

            rain = Number(gateway.dailyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.daily'))
            {
                this.setCapabilityValue('measure_rain.daily', rain).catch(this.error);
                //this.driver.trigger_measure_rain_daily(this, rain);
            }

            rain = Number(gateway.weeklyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.weekly'))
            {
                this.setCapabilityValue('measure_rain.weekly', rain).catch(this.error);
                //this.driver.trigger_measure_rain_weekly(this, rain);
            }

            rain = Number(gateway.monthlyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.monthly'))
            {
                this.setCapabilityValue('measure_rain.monthly', rain).catch(this.error);
                //this.driver.trigger_measure_rain_monthly(this, rain);
            }

            rain = Number(gateway.yearlyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.yearly'))
            {
                this.setCapabilityValue('measure_rain.yearly', rain).catch(this.error);
                //this.driver.trigger_measure_rain_yearly(this, rain);
            }

            rain = Number(gateway.totalrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.total'))
            {
                this.setCapabilityValue('measure_rain.total', rain).catch(this.error);
                //this.driver.trigger_measure_rain_total(this, rain);
            }

            rain = Number(gateway.dailyrainin) * 25.4;
            if (rain != this.getCapabilityValue('measure_rain.daily'))
            {
                this.setCapabilityValue('measure_rain.daily', rain).catch(this.error);
                //this.driver.trigger_measure_rain_daily(this, rain);
            }

        }
    }
}

module.exports = RainSensorDevice;