# Release Smoke Checklist

## Preflight

1. Validate app package.
   - Command: `homey app validate`
   - Expected: `App validated successfully against level publish`

2. Confirm no uncommitted surprises before tagging.
   - Command: `git status --short`
   - Expected: only intended files changed

## Runtime Boot

1. Start app in runtime mode.
   - Command: `homey app run -r`
   - Expected: install succeeds and app reaches `Running com.misol`

2. Watch startup logs for 2-3 minutes.
   - Expected: no stack traces, no unhandled promise rejection warnings
   - Note: the Node inspector security warning is expected in debug mode

## Driver Sanity

1. Verify all drivers initialize once.
   - Expected log entries for: Temp, Temp_Hum, Temp_Water, camera, co2, gateway, laser_distance, leaf_wetness, leak, lightning, pm10, pm25, rain_sensor, soil_moisture, weather_station, wind_ws80, wittflow

2. Verify existing paired devices initialize.
   - Expected: per-device initialization logs without errors

## Functional Spot Checks

1. Toggle wittflow on/off from Homey UI.
   - Expected: capability updates, no warning loops

2. Confirm rain capabilities appear/disappear correctly when payload includes/excludes fields.
   - Expected: no capability-operation errors in logs

3. Confirm wind/weather values update without `NaN`-related errors.
   - Expected: numeric capabilities update or skip safely when data is missing

## Regression Quick Pass

1. Check camera snapshot path.
   - Expected: no unhandled warning promise errors

2. Check pm10 average path.
   - Expected: no capability set with invalid average value

3. Check soil moisture WH52 path with zero values.
   - Expected: zero values are handled, not silently skipped

## Release Gate

Ship only if all are true:

- Validation succeeds (`homey app validate`)
- Runtime startup/install succeeds (`homey app run -r`)
- No startup stack traces or unhandled rejections
- No repeated warning churn from normal payload updates
