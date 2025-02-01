'use strict';

const { Device } = require('homey');

class LaserDevice extends Device
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

        this.log('Laser Device has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.log('Laser Device has been added');
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
        this.log('Laser Device settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.log('Laser Device was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log('Laser Device has been deleted');
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();
		if ((gateway.PASSKEY === dd.PASSKEY) && (gateway['air_ch' + dd.meterNumber] != undefined))
        {
            if (!this.stationType)
            {
                this.stationType = gateway.stationtype;
                this.setSettings({stationType: this.stationType}).catch(this.error);;
            }

			const distance = Number(gateway['air_ch' + dd.meterNumber]) / 1000;
			if (distance != this.getCapabilityValue('measure_distance'))
			{
				this.setCapabilityValue('measure_distance', distance).catch(this.error);
			}

			const depth = Number(gateway['thi_ch1' + dd.meterNumber]) / 1000;
			if (depth != this.getCapabilityValue('measure_distance.depth'))
			{
				this.setCapabilityValue('measure_distance.depth', depth).catch(this.error);
			}

			var batteryType = this.getSetting('batteryType');
			const batV = Number(gateway['ldsbatt' + dd.meterNumber]);
			var batP = 0;

			if (batteryType === '0')
			{
				batP = (batV - 1.8) / (3.1- 1.8) * 100;
			}
			else
			{
				batP = (batV - 1.8) / (3.4 - 1.8) * 100;
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

module.exports = LaserDevice;