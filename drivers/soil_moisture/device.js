'use strict';

const { Device } = require('homey');

class MyDevice extends Device
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

        if (this.hasCapability('measure_temperature'))
        {
            await this.setCapabilityOptions('measure_temperature', {
                title: {
                    en: 'Soil Temperature',
                    nl: 'Bodemtemperatuur',
                    de: 'Bodentemperatur'
                }
            }).catch(this.error);
        }

        this.log('MyDevice has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.log('MyDevice has been added');
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
        this.log('MyDevice settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.log('MyDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log('MyDevice has been deleted');
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();

        // Check for old-style soil sensor (soilmoisture + soilbatt)
        if ((gateway.PASSKEY === dd.PASSKEY) && gateway['soilmoisture' + dd.meterNumber])
        {
            if (!this.stationType)
            {
                this.stationType = gateway.stationtype;
                this.setSettings({stationType: this.stationType}).catch(this.error);;
            }

            // Remove new-style capabilities if they exist
            if (this.hasCapability('measure_temperature'))
            {
                await this.removeCapability('measure_temperature').catch(this.error);
            }
            if (this.hasCapability('measure_ec'))
            {
                await this.removeCapability('measure_ec').catch(this.error);
            }

            const moisture = parseInt(gateway['soilmoisture' + dd.meterNumber]);
            if (moisture != this.getCapabilityValue('measure_moisture'))
            {
                this.setCapabilityValue('measure_moisture', moisture).catch(this.error);
            }

            var batteryType = this.getSetting( 'batteryType' );
            const batV = Number(gateway['soilbatt' + dd.meterNumber]);
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

        // Check for new-style soil sensor (WH52 - soil_ec_hum + soil_ec_temp + soil_ec + soil_ec_batt)
        if ((gateway.PASSKEY === dd.PASSKEY) && gateway['soil_ec_hum' + dd.meterNumber])
        {
            if (!this.stationType)
            {
                this.stationType = gateway.stationtype;
                this.setSettings({stationType: this.stationType}).catch(this.error);;
            }

            // Add new-style capabilities if they don't exist
            if (!this.hasCapability('measure_temperature'))
            {
                await this.addCapability('measure_temperature').catch(this.error);
                await this.setCapabilityOptions('measure_temperature', {
                    title: {
                        en: 'Soil Temperature',
                        nl: 'Bodemtemperatuur',
                        de: 'Bodentemperatur'
                    }
                }).catch(this.error);
            }
            if (!this.hasCapability('measure_ec'))
            {
                await this.addCapability('measure_ec').catch(this.error);
            }

            // Soil Moisture from soil_ec_humX
            const moisture = parseInt(gateway['soil_ec_hum' + dd.meterNumber]);
            if (moisture != this.getCapabilityValue('measure_moisture'))
            {
                this.setCapabilityValue('measure_moisture', moisture).catch(this.error);
            }

            // Soil Temperature from soil_ec_tempX (convert from °F to °C)
            if (gateway['soil_ec_temp' + dd.meterNumber] !== undefined)
            {
                const tempF = Number(gateway['soil_ec_temp' + dd.meterNumber]);
                const tempC = (tempF - 32) * 5 / 9;
                if (tempC != this.getCapabilityValue('measure_temperature'))
                {
                    this.setCapabilityValue('measure_temperature', Math.round(tempC * 100) / 100).catch(this.error);
                }
            }

            // Soil EC from soil_ecX (electrical conductivity in μS/cm)
            if (gateway['soil_ec' + dd.meterNumber] !== undefined)
            {
                const ec = Number(gateway['soil_ec' + dd.meterNumber]);
                if (ec != this.getCapabilityValue('measure_ec'))
                {
                    this.setCapabilityValue('measure_ec', ec).catch(this.error);
                }
            }

            // Battery from soil_ec_battX
            var batteryType = this.getSetting( 'batteryType' );
            const batV = Number(gateway['soil_ec_batt' + dd.meterNumber]);
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

module.exports = MyDevice;