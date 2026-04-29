# Misol & Ecowitt

Bring Misol product into Homey.

The app requires a Misol or Ecowitt gateway that supports the Custom Server option. Typical gateways are the GW1000, GW1100, GW2000 and GW3000, etc.

The app will try to discover and configure the gatway, but if that fails you will need to configure the gateway with the WS View app as follows:

In the Weather Services, select the Customized option and set the:

* Protocol Type to Same As Ecowitt

* Server IP / Hostname to the IP address of your Homey

* Path remains as /data/report

* Port set to 7777 (this can be changed if required but the Homey app will need to be configured to match)

* Upload Interval set to 16

Then save the settings.

The gateway should start pushing data to Homey. Once the app has received the first packet you will be able to add the gateway device and soil moisture sensors. Each gateway can handle 8 soil moisture sensors but you can also add multiple gateways.

The gateway also provides temperature, humidity and presure data.

For Homey to access the devices, they need to be connected to the gatway as per the manufactures instructions.
