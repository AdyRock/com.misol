'use strict';

const { Device } = require('homey');

const AQITablePM25 = [
    {"name": "good",        "ConcLo": 0,      "ConcHi": 12,      "AQIlo": 0,     "AQIhi": 50},
    {"name": "Moderate",    "ConcLo": 12.1,   "ConcHi": 35.5,    "AQIlo": 51,    "AQIhi": 100},
    {"name": "UnhealthyLo", "ConcLo": 35.5,   "ConcHi": 55.4,    "AQIlo": 101,    "AQIhi": 150},
    {"name": "Unhealthy",   "ConcLo": 55.5,   "ConcHi": 150.4,   "AQIlo": 151,    "AQIhi": 200},
    {"name": "UnhealthyHi", "ConcLo": 150.5,  "ConcHi": 250.4,   "AQIlo": 201,    "AQIhi": 300},
    {"name": "Hazardous",   "ConcLo": 250.5,  "ConcHi": 500.4,   "AQIlo": 301,    "AQIhi": 500},
];

const AQITablePM10 = [
    {"name": "good",        "ConcLo": 0,      "ConcHi": 54,      "AQIlo": 0,     "AQIhi": 50},
    {"name": "Moderate",    "ConcLo": 55,     "ConcHi": 154,     "AQIlo": 51,    "AQIhi": 100},
    {"name": "UnhealthyLo", "ConcLo": 155,    "ConcHi": 254,     "AQIlo": 101,    "AQIhi": 150},
    {"name": "Unhealthy",   "ConcLo": 255,    "ConcHi": 354,     "AQIlo": 151,    "AQIhi": 200},
    {"name": "UnhealthyHi", "ConcLo": 355,    "ConcHi": 424,     "AQIlo": 201,    "AQIhi": 300},
    {"name": "Hazardous",   "ConcLo": 425,    "ConcHi": 604,     "AQIlo": 301,    "AQIhi": 500},
];

const Co2QTable = [
    {"name": "good",        "ConcLo": 0,      "ConcHi": 400},
    {"name": "Moderate",    "ConcLo": 401,     "ConcHi": 1000},
    {"name": "UnhealthyLo", "ConcLo": 1001,    "ConcHi": 2000},
    {"name": "Unhealthy",   "ConcLo": 2001,    "ConcHi": 5000},
    {"name": "UnhealthyHi", "ConcLo": 5001,    "ConcHi": 40000},
    {"name": "Hazardous",   "ConcLo": 40000,    "ConcHi": 1000000},
];

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

            let co2avg = parseInt(gateway.co2_24h);
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

            const pm10 = parseInt(gateway.pm10_co2);
            if (!isNaN(pm10))
            {
                this.setCapabilityValue('measure_pm10', pm10).catch(this.error);
                this.setCapabilityValue('alarm_pm10', (pm10 > 255)).catch(this.error);

                const pm10Avg = parseInt(gateway.pm10_24h_co2);
                this.setCapabilityValue('measure_pm10.avg', pm10Avg).catch(this.error);

                // Calculate PM10 AQI
                let tableIdx = AQITablePM10.findIndex( entry => entry.ConcHi > pm10);
                if (tableIdx < 0)
                {
                    tableIdx = AQITablePM10.length - 1;
                }

                let AQI = ((AQITablePM10[ tableIdx ].AQIhi - AQITablePM10[ tableIdx ].AQIlo) / (AQITablePM10[ tableIdx ].ConcHi - AQITablePM10[ tableIdx ].ConcLo)) * (pm10 - AQITablePM10[ tableIdx ].ConcLo)  + AQITablePM10[ tableIdx ].AQIlo;

                this.setCapabilityValue('measure_aqi.pm10', AQI).catch(this.error);
                let aqText = this.homey.__(AQITablePM10[ tableIdx ].name);
                if (aqText !== this.getCapabilityValue('measure_aq.pm10'))
                {
                    this.setCapabilityValue('measure_aq.pm10', aqText).catch(this.error);

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
                if (tableIdx < 0)
                {
                    tableIdx = AQITablePM10.length - 1;
                }

                AQI = ((AQITablePM10[ tableIdx ].AQIhi - AQITablePM10[ tableIdx ].AQIlo) / (AQITablePM10[ tableIdx ].ConcHi - AQITablePM10[ tableIdx ].ConcLo)) * (pm10Avg - AQITablePM10[ tableIdx ].ConcLo)  + AQITablePM10[ tableIdx ].AQIlo;

                this.setCapabilityValue('measure_aqi.pm10_avg', AQI).catch(this.error);
                aqText = this.homey.__(AQITablePM10[ tableIdx ].name);
                if (aqText !== this.getCapabilityValue('measure_aq.pm10_avg'))
                {
                    this.setCapabilityValue('measure_aq.pm10_avg', aqText).catch(this.error);

                    const tokens = {
                        "measure_aq_name": aqText,
                        "measure_aq_item": tableIdx
                    };

                    const state = {
                        "value": tableIdx
                    };

                    this.driver.triggerAQPM10AvgChanged(this, tokens, state);
                }
            }

            // PM2.5
            const pm25 = parseInt(gateway.pm25_co2);
            if (!isNaN(pm25))
            {
                this.setCapabilityValue('measure_pm25', pm25).catch(this.error);
                this.setCapabilityValue('alarm_pm25', (pm25 > 56)).catch(this.error);

                // Calculate PM2.5 AQI
                let tableIdx = AQITablePM25.findIndex( entry => entry.ConcHi > pm25);
                if (tableIdx < 0)
                {
                    tableIdx = AQITablePM25.length - 1;
                }

                let AQI = ((AQITablePM25[ tableIdx ].AQIhi - AQITablePM25[ tableIdx ].AQIlo) / (AQITablePM25[ tableIdx ].ConcHi - AQITablePM25[ tableIdx ].ConcLo)) * (pm25 - AQITablePM25[ tableIdx ].ConcLo)  + AQITablePM25[ tableIdx ].AQIlo;

                this.setCapabilityValue('measure_aqi', AQI).catch(this.error);
                let aqText = this.homey.__(AQITablePM25[ tableIdx ].name);
                if (aqText !== this.getCapabilityValue('measure_aq'))
                {
                    this.setCapabilityValue('measure_aq', aqText).catch(this.error);

                    const tokens = {
                        "measure_aq_name": aqText,
                        "measure_aq_item": tableIdx
                    };

                    const state = {
                        "value": tableIdx
                    };

                    this.driver.triggerAQPM25Changed(this, tokens, state);
                }
            }

            // PM2.5 Avg
            const pm25Avg = parseInt(gateway.pm25_24h_co2);
            if (!isNaN(pm25Avg))
            {
                // Calculate AQI Avg
                this.setCapabilityValue('measure_pm25.avg', pm25Avg).catch(this.error);

                let tableIdx = AQITablePM25.findIndex( entry => entry.ConcHi > pm25Avg);
                if (tableIdx < 0)
                {
                    tableIdx = AQITablePM25.length - 1;
                }

                let AQI = ((AQITablePM25[ tableIdx ].AQIhi - AQITablePM25[ tableIdx ].AQIlo) / (AQITablePM25[ tableIdx ].ConcHi - AQITablePM25[ tableIdx ].ConcLo)) * (pm25Avg - AQITablePM25[ tableIdx ].ConcLo)  + AQITablePM25[ tableIdx ].AQIlo;

                this.setCapabilityValue('measure_aqi.avg', AQI).catch(this.error);
                let aqText = this.homey.__(AQITablePM25[ tableIdx ].name);
                if (aqText !== this.getCapabilityValue('measure_aq.avg'))
                {
                    this.setCapabilityValue('measure_aq.avg', aqText).catch(this.error);

                    const tokens = {
                        "measure_aq_name": aqText,
                        "measure_aq_item": tableIdx
                    };

                    const state = {
                        "value": tableIdx
                    };

                    this.driver.triggerAQPM25AvgChanged(this, tokens, state);
                }

                this.setCapabilityValue('measure_temperature', (Number(gateway.tf_co2) -32) * 5 / 9).catch(this.error);
                this.setCapabilityValue('measure_humidity', parseInt(gateway.humi_co2)).catch(this.error);
            }

            // The battery level appears to be 0 to 5 in steps of 1 representing the bar to light up, a value of 6 indicates it is plugged int to a PSU
            const bat = parseInt(gateway.co2_batt);
            if (!isNaN(bat) && (bat >= 0))
            {
                if (bat > 5)
                {
                    // On DC power
                    this.setCapabilityValue('alarm_power', false).catch(this.error);
                    this.setCapabilityValue('measure_battery', null).catch(this.error);
                }
                else
                {
                    // Running on battery
                    this.setCapabilityValue('alarm_power', true).catch(this.error);
                    this.setCapabilityValue('measure_battery', bat * 20).catch(this.error);
                }
            }
        }
    }
}

module.exports = PM10Device;