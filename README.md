# Misol

Bring Misol product into Homey.

The app works with the Misol Gateway <https://www.aliexpress.com/i/4000852618353.html> and the Misol Soil Moisture sensor <https://www.aliexpress.com/i/33056433752.html>

To configure the gateway you will need the WS View app. In the Weather Services, select the Customized option and set the:

* Protocol Type to Same As Ecowitt

* Server IP / Hostname to the IP address of your Homey

* Path remains as /data/report

* Port set to 7777 (this can be changed if required but the Homey app will need to be configured to match)

* Upload Interval set to 16

Then save the settings.

The gateway should start pushing data to Homey. Once the app has received the first packet you will be able to add the gateway device and soil moisture sensors. Each gateway can handle 8 soil moisture sensors but you can also add multiple gateways.

The gateway provides temperature, humidity and presure data.
