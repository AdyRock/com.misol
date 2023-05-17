'use strict';

const { Device } = require('homey');
const fetch = require('node-fetch');
const http = require('http');

class CameraDevice extends Device
{

    /**
     * onInit is called when the device is initialized.
     */
    async onInit()
    {
        this.log('MyDevice has been initialized');
        this.updatingEventImage = false;

        const settings = this.getSettings();
        this.ip = settings.ip;
        this.authType = 0;

        this.setupImages();
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

        if (changedKeys.indexOf('ip') >= 0)
        {
            this.ip = newSettings.ip;
        }
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

    async setupImages()
    {
        try
        {
            const devData = this.getData();

            try
            {
                if (!this.nowImage)
                {
                    this.snapUri = `http:\\\\${this.ip}/capture`
                    this.nowImage = await this.homey.images.createImage();
                    this.nowImage.setStream(async (stream) =>
                    {
                        this.updatingEventImage = true;

                        let res = await this.doFetch('NOW');
                        if (!res.ok)
                        {
                            this.homey.app.updateLog('Fetch NOW error (' + this.name + '): ' + res.statusText, 0);
                            this.setWarning(res.statusText);
                            throw new Error(res.statusText);
                        }

                        res.body.pipe(stream);

                        stream.on('error', (err) =>
                        {
                            this.homey.app.updateLog('Fetch Now image error (' + this.name + '): ' + err.message, 0);
                            this.updatingEventImage = false;
                        });
                        stream.on('finish', () =>
                        {
                            this.homey.app.updateLog('Now Image Updated (' + this.name + ')');
                            this.updatingEventImage = false;
                        });
                    });

                    this.setCameraImage('Now', this.homey.__('Now'), this.nowImage).catch(this.err);
                }
            }
            catch (err)
            {
                this.homey.app.updateLog('SnapShot nowImage error (' + this.name + ') = ' + err.message, 0);
            }
        }
        catch (err)
        {
            //this.homey.app.updateLog("SnapShot error: " + this.homey.app.varToString(err), true);
            this.homey.app.updateLog('SnapShot error (' + this.name + '): ' + err.message, 0);
        }
    }

    async doFetch(name)
    {
        let res = {};
        var agent = null;

        agent = new http.Agent({ rejectUnauthorized: false });

        try
        {
            this.homey.app.updateLog('Fetching (' + this.name + ') ' + name + ' image from: ' + this.homey.app.varToString(this.snapUri), 1);
            res = await fetch(this.snapUri, { agent: agent });
            this.homey.app.updateLog(`SnapShot fetch result (${this.name}): Status: ${res.ok}, Message: ${res.statusText}, Code: ${res.status}\r\n`, 1);
        }
        catch (err)
        {
            this.homey.app.updateLog('SnapShot error (' + this.name + '): ' + err.message, 0);
            // Try Basic Authentication
            this.authType = 1;

            res = {
                'ok': false,
                'statusText': err.code
            };
        }

        if (!res.ok)
        {
            this.setWarning(res.statusText);
        }

        return res;
    }

}

module.exports = CameraDevice;