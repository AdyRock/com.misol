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
        this.lightning_time = this.getStoreValue('lightning_time');
        if (this.lightning_time === null)
        {
            this.lightning_time = this.getCapabilityValue('measure_lightning_time');
        }
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
        if (changedKeys.indexOf("timeFormat") >= 0)
        {
            this.setCapabilityValue('measure_lightning_time', this.convertDate(this.lightning_time, newSettings));
        }
    }

    convertDate(date, settings)
    {
        var strDate = "";
        if (date)
        {
            let tz = this.homey.clock.getTimezone();
            let lang = this.homey.i18n.getLanguage();

            let dateZero = new Date(0);
            let offset = dateZero.toLocaleString(lang, {hour: '2-digit',   hour12: false, timeZone: tz });

            let dataNum = (parseInt(offset) * 60 * 60) + parseInt(date);

            var d = new Date(dataNum * 1000);

            if (settings.timeFormat == "mm_dd")
            {
                let mins = d.getMinutes();
                let dte = d.getDate();
                let month = d.toLocaleString(lang, {month: 'short'});
                strDate = d.getHours() + ":" + (mins < 10 ? "0" : "") + mins + " " + month + (dte < 10 ? " 0" : " ") + dte;
            }
            else if (settings.timeFormat == "system")
            {
                strDate = d.toLocaleString();
            }
            else if (settings.timeFormat == "time_stamp")
            {
                strDate = d.toJSON();
            }
            else
            {
                strDate = date;
            }
        }

        return strDate;
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
            if (gateway.lightning !== '')
            {
                await this.setCapabilityValue('measure_lightning', Number(gateway.lightning));

                const settings = this.getSettings();
                if (gateway.lightning_time !== '')
                {
                    this.lightning_time = gateway.lightning_time;
                    this.setStoreValue('lightning_time', this.lightning_time);
                    await this.setCapabilityValue('measure_lightning_time', this.convertDate(this.lightning_time, settings));
                }

                // The battery level appears to be 0 to 5 in steps of 1 representing the bar to light up
                const bat = parseInt(gateway.wh57batt) * 20;
                await this.setCapabilityValue('measure_battery', bat);
            }

            await this.setCapabilityValue('measure_lightning_num', parseInt(gateway.lightning_num));
        }
    }
}

module.exports = LightningDevice;