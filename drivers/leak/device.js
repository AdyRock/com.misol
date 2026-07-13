'use strict';

const { Device } = require('homey');

class LeakDevice extends Device
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

        this.homey.app.updateLog('LeakDevice has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.homey.app.updateLog('LeakDevice has been added');
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
        this.homey.app.updateLog('LeakDevice settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.homey.app.updateLog('LeakDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.homey.app.updateLog('LeakDevice has been deleted');
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();
        if (dd.meterNumber)
        {
            if ((gateway.PASSKEY === dd.PASSKEY) && gateway['leak_ch' + dd.meterNumber])
            {
                if (!this.stationType)
                {
                    this.stationType = gateway.stationtype;
                    this.setSettings({stationType: this.stationType}).catch(this.homey.app.logError);;
                }

                this.setCapabilityValue('alarm_water', (gateway['leak_ch' + dd.meterNumber] === '1')).catch(this.homey.app.logError);
				if (gateway['leak_ch' + dd.meterNumber] === '2')
				{
					// The sensor is offline
					if (this.hasCapability('measure_battery'))
					{
						this.setCapabilityValue('measure_battery', null).catch(this.homey.app.logError);
					}

					this.setUnavailable().catch(this.homey.app.logError);
				}
				else
				{
					this.setAvailable().catch(this.homey.app.logError);
					if (gateway['leakbatt' + dd.meterNumber])
					{
						// The battery level appears to be 0 to 5 in steps of 1 representing the bar to light up
						if (!this.hasCapability('measure_battery'))
						{
							await this.addCapability('measure_battery').catch(this.homey.app.logError);
						}

						const bat = parseInt(gateway['leakbatt' + dd.meterNumber]);
						if (!isNaN(bat) && (bat >= 0))
						{
							this.setCapabilityValue('measure_battery', bat * 20).catch(this.homey.app.logError);
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
        }
    }
}

module.exports = LeakDevice;