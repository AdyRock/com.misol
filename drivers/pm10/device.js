'use strict';

const { Device } = require('homey');

const AQITablePM25 = [
    {"name": "good",        "ConcLo": 0,      "ConcHi": 12,      "AQIlo": 0,     "AQIhi": 50},
    {"name": "Moderate",    "ConcLo": 12.1,   "ConcHi": 35.5,    "AQIlo": 51,    "AQIhi": 100},
    {"name": "UnhealthyLo", "ConcLo": 35.5,   "ConcHi": 55.4,    "AQIlo": 101,    "AQIhi": 150},
    {"name": "Unhealthy",   "ConcLo": 55.5,   "ConcHi": 150.4,   "AQIlo": 151,    "AQIhi": 200},
    {"name": "UnhealthyHi", "ConcLo": 150.5,  "ConcHi": 250.4,   "AQIlo": 201,    "AQIhi": 300},
    {"name": "Hazardous",   "ConcLo": 250.5,  "ConcHi": 500.4,   "AQIlo": 301,    "AQIhi": 500},
]

const AQITablePM10 = [
    {"name": "good",        "ConcLo": 0,      "ConcHi": 54,      "AQIlo": 0,     "AQIhi": 50},
    {"name": "Moderate",    "ConcLo": 55,     "ConcHi": 154,     "AQIlo": 51,    "AQIhi": 100},
    {"name": "UnhealthyLo", "ConcLo": 155,    "ConcHi": 254,     "AQIlo": 101,    "AQIhi": 150},
    {"name": "Unhealthy",   "ConcLo": 255,    "ConcHi": 354,     "AQIlo": 151,    "AQIhi": 200},
    {"name": "UnhealthyHi", "ConcLo": 355,    "ConcHi": 424,     "AQIlo": 201,    "AQIhi": 300},
    {"name": "Hazardous",   "ConcLo": 425,    "ConcHi": 604,     "AQIlo": 301,    "AQIhi": 500},
]

const Co2QTable = [
    {"name": "good",        "ConcLo": 0,      "ConcHi": 400},
    {"name": "Moderate",    "ConcLo": 401,     "ConcHi": 1000},
    {"name": "UnhealthyLo", "ConcLo": 1001,    "ConcHi": 2000},
    {"name": "Unhealthy",   "ConcLo": 2001,    "ConcHi": 5000},
    {"name": "UnhealthyHi", "ConcLo": 5001,    "ConcHi": 40000},
    {"name": "Hazardous",   "ConcLo": 40000,    "ConcHi": 1000000},
]

class PM10Device extends Device
{
    /**
     * onInit is called when the device is initialized.
     */
    async onInit()
    {
        this.log('PM10 has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.log('PM10 has been added');
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
        this.log('PM10 settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.log('PM10 was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log('PM10 has been deleted');
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();
        if ((gateway.PASSKEY === dd.PASSKEY) && gateway.pm25_co2)
        {
            let co2 = parseInt(gateway.co2);
            await this.setCapabilityValue('measure_co2', co2);
            await this.setCapabilityValue('alarm_co2', (co2 > 1200));

            let co2avg = parseInt(gateway.co2_24h);
            await this.setCapabilityValue('measure_co2.avg', co2avg);

            let tableIdx = Co2QTable.findIndex( entry => entry.ConcHi > co2);
            let aqText = this.homey.__(Co2QTable[ tableIdx ].name);
            if (aqText !== this.getCapabilityValue('measure_co2_quality'))
            {
                await this.setCapabilityValue('measure_co2_quality', aqText);

                const tokens = {
                    "measure_aq_name": aqText,
                    "measure_aq_item": tableIdx
                };

                const state = {
                    "value": tableIdx
                };

                this.driver.triggerCo2QChanged(this, tokens, state);
            }

            tableIdx = Co2QTable.findIndex( entry => entry.ConcHi > co2avg);
            aqText = this.homey.__(Co2QTable[ tableIdx ].name);
            if (aqText !== this.getCapabilityValue('measure_co2_quality.avg'))
            {
                await this.setCapabilityValue('measure_co2_quality.avg', aqText);

                const tokens = {
                    "measure_aq_name": aqText,
                    "measure_aq_item": tableIdx
                };

                const state = {
                    "value": tableIdx
                };

                this.driver.triggerCo2QChanged(this, tokens, state);
            }
            

            const pm10 = parseInt(gateway.pm10_co2);
            await this.setCapabilityValue('measure_pm10', pm10);
            await this.setCapabilityValue('alarm_pm10', (pm10 > 255));

            const pm10Avg = parseInt(gateway.pm10_24h_co2);
            await this.setCapabilityValue('measure_pm10.avg', pm10Avg);

            // Calculate PM10 AQI
            tableIdx = AQITablePM10.findIndex( entry => entry.ConcHi > pm10);
            let AQI = ((AQITablePM10[ tableIdx ].AQIhi - AQITablePM10[ tableIdx ].AQIlo) / (AQITablePM10[ tableIdx ].ConcHi - AQITablePM10[ tableIdx ].ConcLo)) * (pm10 - AQITablePM10[ tableIdx ].ConcLo)  + AQITablePM10[ tableIdx ].AQIlo;

            await this.setCapabilityValue('measure_aqi.pm10', AQI);
            aqText = this.homey.__(AQITablePM10[ tableIdx ].name);
            if (aqText !== this.getCapabilityValue('measure_aq.pm10'))
            {
                await this.setCapabilityValue('measure_aq.pm10', aqText);

                const tokens = {
                    "measure_aq_name": aqText,
                    "measure_aq_item": tableIdx
                };

                const state = {
                    "value": tableIdx
                };

                this.driver.triggerAQPM10Changed(this, tokens, state);
            }
            
            // Calculate PM10 AQI Ag
            tableIdx = AQITablePM10.findIndex( entry => entry.ConcHi > pm10Avg);
            AQI = ((AQITablePM10[ tableIdx ].AQIhi - AQITablePM10[ tableIdx ].AQIlo) / (AQITablePM10[ tableIdx ].ConcHi - AQITablePM10[ tableIdx ].ConcLo)) * (pm10Avg - AQITablePM10[ tableIdx ].ConcLo)  + AQITablePM10[ tableIdx ].AQIlo;

            await this.setCapabilityValue('measure_aqi.pm10.avg', AQI);
            await this.setCapabilityValue('measure_aq.pm10.avg', this.homey.__(AQITablePM10[ tableIdx ].name));


            // PM2.5
            const pm25 = parseInt(gateway.pm25_co2);
            await this.setCapabilityValue('measure_pm25', pm25);
            await this.setCapabilityValue('alarm_pm25', (pm25 > 56));

            const pm25Avg = parseInt(gateway.pm25_24h_co2);
            await this.setCapabilityValue('measure_pm25.avg', pm25Avg);

            // Calculate PM2.5 AQI
            tableIdx = AQITablePM25.findIndex( entry => entry.ConcHi > pm25);
            AQI = ((AQITablePM25[ tableIdx ].AQIhi - AQITablePM25[ tableIdx ].AQIlo) / (AQITablePM25[ tableIdx ].ConcHi - AQITablePM25[ tableIdx ].ConcLo)) * (pm25 - AQITablePM25[ tableIdx ].ConcLo)  + AQITablePM25[ tableIdx ].AQIlo;

            await this.setCapabilityValue('measure_aqi', AQI);
            aqText = this.homey.__(AQITablePM25[ tableIdx ].name);
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

                this.driver.triggerAQPM25Changed(this, tokens, state);
            }
            
            // Calculate AQI Ag
            tableIdx = AQITablePM25.findIndex( entry => entry.ConcHi > pm25Avg);
            AQI = ((AQITablePM25[ tableIdx ].AQIhi - AQITablePM25[ tableIdx ].AQIlo) / (AQITablePM25[ tableIdx ].ConcHi - AQITablePM25[ tableIdx ].ConcLo)) * (pm25Avg - AQITablePM25[ tableIdx ].ConcLo)  + AQITablePM25[ tableIdx ].AQIlo;

            await this.setCapabilityValue('measure_aqi.avg', AQI);
            await this.setCapabilityValue('measure_aq.avg', this.homey.__(AQITablePM25[ tableIdx ].name));

            await this.setCapabilityValue('measure_temperature', (Number(gateway.tf_co2) -32) * 5 / 9);
            await this.setCapabilityValue('measure_humidity', parseInt(gateway.humi_co2));

            // The battery level appears to be 0 to 5 in steps of 1 representing the bar to light up
            let bat = parseInt(gateway.co2_batt);
            if (bat > 5)
            {
                bat = 5;
                await this.setCapabilityValue('alarm_power', false);
            }
            else
            {
                await this.setCapabilityValue('alarm_power', true);
            }
            bat *= 20;
            await this.setCapabilityValue('measure_battery', bat);
        }
    }
}

module.exports = PM10Device;