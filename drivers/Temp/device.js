'use strict';

const { Device } = require('homey');

class TempDevice extends Device
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

        this.log('TempDevice has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.log('TempDevice has been added');
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
        this.log('TempDevice settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.log('TempDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log('TempDevice has been deleted');
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();
        if (dd.meterNumber)
        {
            if ((gateway.PASSKEY === dd.PASSKEY) && gateway['temp' + dd.meterNumber] + 'f')
            {
                if (!this.stationType)
                {
                    this.stationType = gateway.stationtype;
                    this.setSettings({stationType: this.stationType}).catch(this.error);;
                }

                this.setCapabilityValue('measure_temperature', (Number(gateway['temp' + dd.meterNumber + 'f']) -32) * 5 / 9).catch(this.error);

                if (gateway['batt' + dd.meterNumber])
                {
                    const batV = Number(gateway['batt' + dd.meterNumber]);
                    if (batV > 0)
                    {
                        if (!this.hasCapability('measure_battery'))
                        {
                            await this.addCapability('measure_battery').catch(this.error);
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
                        this.setCapabilityValue('measure_battery', batP).catch(this.error);
                    }
                    else
                    {
                        if (this.hasCapability('measure_battery'))
                        {
                            await this.removeCapability('measure_battery').catch(this.error);
                        }
                    }
                }
                else
                {
                    if (this.hasCapability('measure_battery'))
                    {
                        await this.removeCapability('measure_battery').catch(this.error);
                    }
                }
            }
        }
    }
}

module.exports = TempDevice;