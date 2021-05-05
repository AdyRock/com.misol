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
    }
};