[![OPEnS Logo](https://static1.squarespace.com/static/57dade3e893fc0962ff46311/t/5a26fdb40852293a2b6e17a4/1512504757858/OPEnSLogo1d.png)](http://www.open-sensing.org)

**This package is still in alpha stage, any and all bugs should be expected**

This package provides the core functionality that allows the Loom Configurator to interact with the Loom Library repo and parse tags to JSON.    


```js
var loomify = require('loomify')
```

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Before installing, download and install the [latest version of Node.js](https://nodejs.org/en/download/).

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```bash
$ npm install loomify
```

## Current Features

* Easily access constructor parameter data
* JSON data format is portable and easy to manipulate
* Use loom_dependencies.json to download most current libraries needed by Loom

## Docs & Community  

This package is published by OPEnS Lab at Oregon State University. It provides back-end support for parsing Loom source files and interacting with the Loom GitHub repo.
* [Website](http://www.open-sensing.org/project-loom)
* [GitHub Organization](https://github.com/OPEnSLab-OSU) for all OPEnS Lab projects
* [GitHub Project](https://github.com/OPEnSLab-OSU/Loom) for the latest version of Loom
* [GitHub Package](https://github.com/OPEnSLab-OSU/Loomify.git) for latest version of Loomify


## Quick Start

```js

// Function to quickly create new .json file
loomify.write_to_json('<file_name>', '<json_obj>'){
   .then((results) => {
      console.log(results);
   })
   .catch((err) =>{
      console.log(err);
   })
}

loomify.load_json_file('<dependencies.json>')
   .then((json_obj) => {

      /* writes all dependencies to tmp/ in local directory */
      loomify.get_dependencies(json_obj);

   .catch((err) => {
      console.log(err);
   })
   
})

// For use by configurator app to instantiate Loom modules
loomify.parse('path/to/directory', (data) => {
	/* Do something with data */
	/* By default parse() writes data to test.json */
})

```


### JSON Format
The json format of the loom dependencies file matches the following format.
```js
{
   'githubAPI': [
      {
         'owner': 'adafruit',
         'repos': [
            'Adafruit-GFX-Library',
            'Adafruit-PWM-Servo-Driver-Library',
            'Adafruit_ASFcore',
         ]
      }
   ],
   'direct': [
      {
         'library': 'RadioHead-1.89',
         'url': 'http://www.airspayce.com/mikem/arduino/RadioHead/RadioHead-1.89.zip'
      }
   ],
   'special': [
      {
         'source': 'github',
         'owner': 'jrowberg',
         'library': 'i2cdevlib',
         'path': 'contents/Arduino/I2Cdev',
      }
   ]
}
```
***gitHubAPI***: This key maps to an array of objects representing github repositories. For each owner of a repo, an object contains the owners name, and an array of repo names.

***special***: This key maps to an array of objects for which custom methods must be used to retrieve the data. Currently only github source is supported.

***direct***: This key maps to an array of objects representing direct download links.     


### Parse json format
The resulting json data returned by loomify.parse() matches the following format, example from LoRa.h  
```js
{ general: {
	inherits: 'LoomCommPlat',
	description: 'LoRa communication platform module',
	dependencies: [],
	conflicts: []
	},
	components: {
		LoRa: {
			description: 'Module description',
			parameters: {
				module_name: {
					type: 'String',
					value: 'LoRa',
					range: null,
					description: 'The name of the module'
				},
				compress_messages:{
					type: 'Bool',
					value: 'true',
					range: '{true, false}',
					description: 'Whether or not to try to compress messages'
				},
				address:{
					type: 'Int',
					value: '01',
					range: '[0-99]',
					description: 'This device\'s LoRa address'
				},
				...
			}
		}
		...
	}
}
```

#### Loomify Tag Format  
The Loomify package is designed to look for C/C++ header files (any file ending in .h), and parse constructor parameters into a JSON data format. It will look for any data that follows the specific Loomify Tag Format (LTF)  

The tags that loomify.parse() looks for **must** use the following format.   
##### Top level class tag
Toward the top of each header file, immediately before the the class declaration, put text that matches the following format:

```C++
// ### (<inheritFromModule>) | dependencies: [] | conflicts: []
/// <Description of module>
// ###
```
Angle brackets indicate a required field. Do not include them in your code.
* "inheritFromModule": The virtual class of which your module will inherit methods  
* "Description of module": A short description of your module.  

Example found in Loom_OLED class.
```C++
// ### (LoomLogPlat) | dependencies: [] | conflicts: []
/// OLED logging platform module.
// ###
class Loom_OLED : public LoomLogPlat
{

protected:
... /*rest of class code... */
```

##### Constructor tag
Immediately before the constructor for your class put text that matches the following format:    
```C++
/// <moduleName> module constructor.
///
/// \param[<in,out>] <paramName> <paramDataType> | <paramValue> | <paramRange> | <Description of param>
/// ...
/// ...
```
* "moduleName": the name of the module, which is also the name of the class
* "in,out": The parameter will either be in or out
* "paramDataType": The C++ data type of the parameter
* "paramValue": The actual value of the parameter, following C++ syntax for all data types values
* "paramRange": If the range of acceptable values for the parameter are discreet, then this will be a comma separated list inside curly braces. If the acceptable range is continuous then this will be a two hyphen separated values inside brackets. If a range value does not make sense for the data type then this value will be null.
* "Description of param": Write a brief description of this parameter  

Example found in Loom_OLED class.  
```C++
/// OLED module constructor.
///
/// \param[in]	module_name	String | <"OLED"> | null | OLED module name
/// \param[in]	enable_rate_filter	Bool | <true> | {true, false} | Whether or not to impose maximum update rate
/// \param[in]	min_filter_delay	Int | <300> | [50-5000] | Minimum update delay, if enable_rate_filter enabled
/// ...
/// ...
```
