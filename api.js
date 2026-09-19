module.exports = {
    async getLog({ homey, query })
    {
        return homey.app.diagLog;
    },
    async getDetect({ homey, query })
    {
        return JSON.stringify(homey.app.detectedGateways, null, 2);
    },
    async clearLog({ homey, body })
    {
        homey.app.diagLog = "";
        return 'OK';
    },
    async sendLog({ homey, body })
    {
        return await homey.app.sendLog(body);
    },
    async configureGateway({ homey, body })
    {
        if (!body || !body.ipAddress || !/^\d+\.\d+\.\d+\.\d+$/.test(body.ipAddress))
        {
            throw new Error('A valid IP address is required');
        }

        return await homey.app.configureGateway(body.ipAddress);
    }
};