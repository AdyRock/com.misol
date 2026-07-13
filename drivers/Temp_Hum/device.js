'use strict';

const { Device } = require('homey');

class TempHumDevice extends Device
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
            this.setSettings({gatewayID: dd.id}).catch(this.homey.app.logError);;
        }
        this.stationType = this.getSetting('stationType');

        this.homey.app.updateLog('TempHumDevice has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.homey.app.updateLog('TempHumDevice has been added');
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
        this.homey.app.updateLog('TempHumDevice settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.homey.app.updateLog('TempHumDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.homey.app.updateLog('TempHumDevice has been deleted');
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();
        if (dd.meterNumber)
        {
            if ((gateway.PASSKEY === dd.PASSKEY) && (gateway['temp' + dd.meterNumber + 'f'] !== undefined))
            {
                if (!this.stationType)
                {
                    this.stationType = gateway.stationtype;
                    this.setSettings({stationType: this.stationType}).catch(this.homey.app.logError);;
                }

                this.setCapabilityValue('measure_humidity', parseInt(gateway['humidity' + dd.meterNumber])).catch(this.homey.app.logError);
                this.setCapabilityValue('measure_temperature', (Number(gateway['temp' + dd.meterNumber + 'f']) -32) * 5 / 9).catch(this.homey.app.logError);

                if (gateway['batt' + dd.meterNumber])
                {
                    const batV = Number(gateway['batt' + dd.meterNumber]);
                    if (batV > 0)
                    {
                        if (!this.hasCapability('measure_battery'))
                        {
                            await this.addCapability('measure_battery').catch(this.homey.app.logError);
                        }
                        var batteryType = this.getSetting( 'batteryType' );
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
                        this.setCapabilityValue('measure_battery', batP).catch(this.homey.app.logError);
                    }
                    else
                    {
                        if (this.hasCapability('measure_battery'))
                        {
                            await this.removeCapability('measure_battery').catch(this.homey.app.logError);
                        }
                    }
                }
                else
                {
                    if (this.hasCapability('measure_battery'))
                    {
                        await this.removeCapability('measure_battery').catch(this.homey.app.logError);
                    }
                }
            }
        }
        else
        {
            if ((gateway.PASSKEY === dd.id))
            {
                this.setCapabilityValue('measure_humidity', parseInt(gateway.humidity)).catch(this.homey.app.logError);
                this.setCapabilityValue('measure_temperature', (Number(gateway.tempf) -32) * 5 / 9).catch(this.homey.app.logError);
            }
        }
    }
}

module.exports = TempHumDevice;