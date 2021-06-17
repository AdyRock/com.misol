'use strict';

const { Device } = require('homey');

const AQITable = [
    {"name": "good",        "ConcLo": 0,      "ConcHi": 12,      "AQIlo": 0,     "AQIhi": 50},
    {"name": "Moderate",    "ConcLo": 12.1,   "ConcHi": 35.5,    "AQIlo": 51,    "AQIhi": 100},
    {"name": "UnhealthyLo", "ConcLo": 35.5,   "ConcHi": 55.4,    "AQIlo": 101,    "AQIhi": 150},
    {"name": "Unhealthy",   "ConcLo": 55.5,   "ConcHi": 150.4,   "AQIlo": 151,    "AQIhi": 200},
    {"name": "UnhealthyHi", "ConcLo": 150.5,  "ConcHi": 250.4,   "AQIlo": 201,    "AQIhi": 300},
    {"name": "Hazardous",   "ConcLo": 250.5,  "ConcHi": 500.4,   "AQIlo": 301,    "AQIhi": 500},
]

class PM25Device extends Device
{
    /**
     * onInit is called when the device is initialized.
     */
    async onInit()
    {
        this.log('PM25 has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.log('PM25 has been added');
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
        this.log('PM25 settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.log('PM25 was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log('PM25 has been deleted');
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();
        if ((gateway.PASSKEY === dd.PASSKEY) && gateway['pm25_ch' + dd.meterNumber])
        {
            const pm25 = parseInt(gateway['pm25_ch' + dd.meterNumber]);
            await this.setCapabilityValue('measure_pm25', pm25);

            const pm25Avg = parseInt(gateway['pm25_avg_24h_ch' + dd.meterNumber]);
            await this.setCapabilityValue('measure_pm25.avg', pm25Avg);

            // Calculate AQI
            let tableIdx = AQITable.findIndex( entry => entry.ConcHi > pm25);
            let AQI = ((AQITable[ tableIdx ].AQIhi - AQITable[ tableIdx ].AQIlo) / (AQITable[ tableIdx ].ConcHi - AQITable[ tableIdx ].ConcLo)) * (pm25 - AQITable[ tableIdx ].ConcLo)  + AQITable[ tableIdx ].AQIlo;

            await this.setCapabilityValue('measure_aqi', AQI);
            let aqText = this.homey.__(AQITable[ tableIdx ].name);
            if (aqText !== this.getCapabilityValue('measure_aq'))
            {
                await this.setCapabilityValue('measure_aq', aqText);

                const tokens = {
                    "measure_aq_name": aqText,
                    "measure_aq_item": tableIdx
                };

                const state = {
                    "value": tableIdx
                };

                this.driver.triggerAQChanged(this, tokens, state);
            }
            
            // Calculate AQI Ag
            tableIdx = AQITable.findIndex( entry => entry.ConcHi > pm25Avg);
            AQI = ((AQITable[ tableIdx ].AQIhi - AQITable[ tableIdx ].AQIlo) / (AQITable[ tableIdx ].ConcHi - AQITable[ tableIdx ].ConcLo)) * (pm25Avg - AQITable[ tableIdx ].ConcLo)  + AQITable[ tableIdx ].AQIlo;

            await this.setCapabilityValue('measure_aqi.avg', AQI);
            await this.setCapabilityValue('measure_aq.avg', this.homey.__(AQITable[ tableIdx ].name));

            // The battery level appears to be 0 to 5 in steps of 1 representing the bar to light up
            const bat = parseInt(gateway['pm25batt' + dd.meterNumber]) * 20;
            await this.setCapabilityValue('measure_battery', bat);
        }
    }
}

module.exports = PM25Device;