'use strict';

const { Device } = require('homey');

class LightningDevice extends Device
{
    /**
     * onInit is called when the device is initialized.
     */
    async onInit()
    {
        this.log('Lightning Device has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.log('Lightning Device has been added');
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
        this.log('Lightning Device settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name)
    {
        this.log('Lightning Device was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log('Lightning Device has been deleted');
    }

    async updateCapabilities(gateway)
    {
        const dd = this.getData();
        if ((gateway.PASSKEY === dd.PASSKEY) && (gateway.lightning != undefined))
        {
            const lightning_num = parseInt(gateway.lightning_num);
            if (gateway.lightning !== '')
            {
                let lightning = Number(gateway.lightning);
                if (lightning != this.getCapabilityValue('measure_lightning'))
                {
                    await this.setCapabilityValue('measure_lightning', lightning);
                    this.driver.trigger_measure_lightning(this, lightning);
                }

                if (lightning_num != this.getCapabilityValue('lightning_num'))
                {
                    await this.setCapabilityValue('measure_lightning_num', lightning_num);
                    this.driver.trigger_measure_lightning(this, lightning_num);
                }
            }
            else if (lightning_num === 0)
            {
                await this.setCapabilityValue('measure_lightning', null);
            }
            
            await this.setCapabilityValue('measure_lightning_time', gateway.lightning_time);

            // The battery level appears to be 0 to 5 in steps of 1 representing the bar to light up
            const bat = parseInt(gateway.wh57batt) * 20;
            await this.setCapabilityValue('measure_battery', bat);
        }
    }
}

module.exports = LightningDevice;