const loomify = require('../index.js');

var dependencies = {
   'special': [
      {
         'source': 'github',
         'owner': 'jrowberg',
         'library': 'i2cdevlib',
         'path': 'contents/Arduino/I2Cdev',
      },
   ],
   'direct': [
      {
         'library': 'RadioHead-1.89',
         'url': 'http://www.airspayce.com/mikem/arduino/RadioHead/RadioHead-1.89.zip'
      },
   ],
   'githubAPI': [
      {
         'owner': 'adafruit',
         'repos': [
            'Adafruit-GFX-Library',
            'Adafruit-PWM-Servo-Driver-Library',
            'Adafruit_ASFcore',
            'Adafruit_FONA',
            'Adafruit_FXAS21002C',
            'Adafruit_FXOS8700',
            'Adafruit_IO_Arduino',
            'Adafruit_MAX31856',
            'Adafruit_MQTT_Library',
            'Adafruit_Motor_Shield_V2_Library',
            'Adafruit_NeoPixel',
            'Adafruit_SHT31',
            'Adafruit_SSD1306',
            'Adafruit_Sensor',
            'Adafruit_SleepyDog',
            'Adafruit_TSL2561',
            'Adafruit_TSL2591_Library',
         ]
      },
      {
         'owner': 'EnviroDIY',
         'repos': [
            'Arduino-SDI-12',
         ]
      },
      {
         'owner': 'GreyGnome',
         'repos': [
            'EnableInterrupt',
         ]
      },
      {
         'owner': 'arduino-libraries',
         'repos': [
            'Ethernet',
            'WiFi101'
         ]
      },
      {
         'owner': 'cmaglie',
         'repos': [
            'FlashStorage',
         ]
      },
      {
         'owner': 'bogde',
         'repos': [
            'HX711',
         ]
      },
      {
         'owner': 'rocketscream',
         'repos': [
            'Low-Power',
         ]
      },
      {
         'owner': 'ElectronicCats',
         'repos': [
            'mpu6050',
         ]
      },
      {
         'owner': 'millerlp',
         'repos': [
            'MS5803_02'
         ]
      },
      {
         'owner': 'CNMAT',
         'repos': [
            'OSC'
         ]
      },
      {
         'owner': 'nRF24',
         'repos': [
            'RF24',
            'RF24Network'
         ]
      },
      {
         'owner': 'sparkfun',
         'repos': [
            'SparkFun_AS726X_Arduino_Library',
            'SparkFun_LIS3DH_Arduino_Library',
            'SparkFun_AS7265X_Arduino_Library',
            'SparkFun_ZX_Distance_and_Gesture_Sensor_Arduino_Library',
         ]
      },
      {
         'owner': 'OPEnSLab-OSU',
         'repos': [
            'OPEnS_RTC',
         ]
      },
   ]
}

// loomify.write_to_json('loom_dependencies', dependencies)
//    .then((results) => {
//       console.log(results);
//    })
//    .catch((err) =>{
//       console.log(err);
//    })

loomify.load_json_file('loom_dependencies.json')
   .then((json_obj) => {
      // console.log(json_obj);
      loomify.get_dependencies(json_obj)
         .catch((err) => {
            console.log(err);
         })
   })
   .catch((err) =>{
      console.log(err);
   })