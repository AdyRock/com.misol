'use strict';

const { Device } = require('homey');

const Co2QTable = [
    {"name": "good",        "ConcLo": 0,      "ConcHi": 400},
    {"name": "Moderate",    "ConcLo": 401,     "ConcHi": 1000},
    {"name": "UnhealthyLo", "ConcLo": 1001,    "ConcHi": 2000},
    {"name": "Unhealthy",   "ConcLo": 2001,    "ConcHi": 5000},
    {"name": "UnhealthyHi", "ConcLo": 5001,    "ConcHi": 40000},
    {"name": "Hazardous",   "ConcLo": 40000,    "ConcHi": 1000000},
];

class CO2Device extends Device
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
            this.setSettings({gatewayID: dd.id});
        }
        this.stationType = this.getSetting('stationType');

        this.log('CO2 has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
		this.log('CO2 has been added');
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
        this.log('CO2 settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.log('CO2 was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log('CO2 has been deleted');
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();
		if ((gateway.PASSKEY === dd.PASSKEY) && gateway.co2in)
        {
			let co2 = parseInt(gateway.co2in);
            if (!isNaN(co2))
            {
                this.setCapabilityValue('measure_co2', co2).catch(this.error);
                this.setCapabilityValue('alarm_co2', (co2 > 1200)).catch(this.error);

                let tableIdx = Co2QTable.findIndex( entry => entry.ConcHi > co2);
                if (tableIdx < 0)
                {
                    tableIdx = Co2QTable.length - 1;
                }

                let aqText = this.homey.__(Co2QTable[ tableIdx ].name);
                if (aqText !== this.getCapabilityValue('measure_co2_quality'))
                {
                    this.setCapabilityValue('measure_co2_quality', aqText).catch(this.error);

                    const tokens = {
                        "measure_aq_name": aqText,
                        "measure_aq_item": tableIdx
                    };

                    const state = {
                        "value": tableIdx
                    };

                    this.driver.triggerCo2QChanged(this, tokens, state);
                }
            }

			let co2avg = parseInt(gateway.co2in_24h);
            if (!isNaN(co2avg))
            {
                this.setCapabilityValue('measure_co2.avg', co2avg).catch(this.error);

                let tableIdx = Co2QTable.findIndex( entry => entry.ConcHi > co2avg);
                if (tableIdx < 0)
                {
                    tableIdx = Co2QTable.length - 1;
                }

                let aqText = this.homey.__(Co2QTable[ tableIdx ].name);
                if (aqText !== this.getCapabilityValue('measure_co2_quality.avg'))
                {
                    this.setCapabilityValue('measure_co2_quality.avg', aqText).catch(this.error);

                    const tokens = {
                        "measure_aq_name": aqText,
                        "measure_aq_item": tableIdx
                    };

                    const state = {
                        "value": tableIdx
                    };

                    this.driver.triggerCo2QChanged(this, tokens, state);
                }
            }

        }
    }
}

module.exports = CO2Device;