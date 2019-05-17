// This program illustrates a possible method for retrieving file content from the Loom github repo
/* It is lightweight and uses the github api to request JSON data. It is built using the
    request-promise-native module.

*/

/* To use: import this module into your javascript with Ex: var loomgit = require(./loom-github)
    then use it by calling loomgit.getFile(<path/to/file>), where the path to file is read from stdin
    and is relative to the Loom master repo.
*/

// required modules
const rpn = require('request-promise-native');
const fs = require('fs');
const util = require('util');




const master_json = {
	'general': {},
	'components': {},
};


exports.load_json_file = (json_file) =>{
   return new Promise((resolve, reject) => {
      fs.readFile(json_file, 'utf8', (err, data) => {
         if(err){
            reject(err);
         }
         else {
            let json = JSON.parse(data)
            resolve(json)
         }
      });
   });
}


exports.get_dependencies = (json_obj) => {
   let apiLibs = json_obj.githubAPI;
   let directLibs = json_obj.direct;
   let daSpecial = json_obj.special;
   let git_urls = [];
   let dl_dir = './tmp'

   fs.mkdir(dl_dir, (err) =>{
      if(err){
         console.log(err);
      }
   });

   // read github urls and prep for request
   apiLibs.forEach( (lib_obj) => {
      if(lib_obj.repos.length > 1){
         lib_obj.repos.forEach( (repo) =>{
            let url = new URL(util.format('repos/%s/%s', lib_obj.owner, repo),'https://api.github.com/')
            git_urls.push({
               'library': repo,
               'url': url
               }
            );
         })
      }
      else{
         let url = new URL(util.format('repos/%s/%s', lib_obj.owner, lib_obj.repos[0]),'https://api.github.com/')
         git_urls.push({
            'library': lib_obj.repos[0],
            'url': url
            }
         );
      }
   });

   // download each zip with github api
   git_urls.forEach( (obj) =>{
      let options = {
         'uri':  util.format('%s/%s/%s', obj.url.href, 'zipball', 'master'),
         'headers': {
            'User-Agent': 'Loomify'
         },
         'json': true,
      };

      let file_name = util.format('%s.%s', obj.library, 'zip');
      console.log(options.uri);
      rpn(options)
         .pipe( fs.createWriteStream(dl_dir + '/' + file_name) )
         .on('close', () =>{
            console.log( file_name + ' written');
         });

   })

   // download each direct download
   directLibs.forEach( (lib_obj) => {
      let options = {
         'uri': lib_obj.url,
         'headers': {
            'User-Agent': 'Loomify'
         },
         'json': true,
      };

      let file_name = util.format('%s.%s', lib_obj.library, 'zip');
      console.log(options.uri);
      rpn(options)
         .pipe( fs.createWriteStream(dl_dir + '/' + file_name) )
         .on('close', () =>{
            console.log( file_name + ' written');
         });
   })

   // download each special case file
   daSpecial.forEach( (lib_obj) => {
      // let url = new URL(util.format('repos/%s/%s', lib_obj.owner, lib_obj.repos[0]),'https://api.github.com/')
      let lib_name = lib_obj.repos[0];
      let options = {
         'uri': util.format('%s/repos/%s/%s/%s','https://api.github.com', lib_obj.owner, lib_name, lib_obj.path),
         'headers': {
            'User-Agent': 'Loomify'
         },
         'json': true,
      };

      rpn(options)
         .then((context) => {
            let dir = lib_name;
            fs.mkdir(dl_dir + '/' + dir, (err) => {
               if(err){
                  console.log(err);
               }
               else{
                  context.forEach((file_obj) =>{
                     options.uri = file_obj.download_url
                     rpn(options)
                        .pipe( fs.createWriteStream(util.format('%s/%s/%s', dl_dir, dir, file_obj.name) ))
                        .on('close', () => {
                           console.log(file_obj.name + ' written' );
                        });
                  })
               }
            })
         })
   })

}

// loom_github object with methods that use promises
var loom_github = {
  'getContents': function (options){
    return rpn(options);
  },

  'findFile': function (contents){
    return contents;
  },

  'print': function(file){
  }
};


exports.init = (params) => {
  loom_github.branch = params.branch;
  var options = {
    'uri': 'https://api.github.com/repos/OPEnSLab-OSU/Loom/branches/' + params.branch,
    'headers': {
      'User-Agent': 'Loom Configurator App'
    },
    'json': true,
  };
  return rpn(options).then((context) => {
    loom_github.branch_sha = context.commit.sha;
    loom_github.tree_sha = context.commit.commit.tree.sha;
    console.log(loom_github);
  });
};

exports.buildTree = () => {
  var options = {
    'uri': 'https://api.github.com/repos/OPEnSLab-OSU/Loom/git/trees/' + loom_github.tree_sha + '?recursive=1',
    'headers': {
      'User-Agent': 'Loom Configurator App'
    },
    'json': true,
  };
  return rpn(options).then((context) => {
    loom_github.tree = context;
  });
};

exports.getTree = () => {
  return loom_github.tree.tree;
}


exports.getFile = (params) => {
  // required for request-promise-native module
  var options = {
    'uri': 'https://api.github.com/repos/OPEnSLab-OSU/Loom/contents/Loom/src/' + params.file,
    'headers': {
      'User-Agent': 'Loom Configurator App'
    },
    'json': true,
  };
  return loom_github.getContents(options)
    .then(loom_github.findFile)
    // .then(loom_github.print)
};






// ========================================================================== //
// ===                                                                     === //
// ===							Begin json parser functions parser					=== //
// ========================================================================== //
/*
* This program demos a possible implementation for reading/parsing
* C header files. It looks for the doxygen /param syntax and follows
*	the Loomify Json Format.
* This demo only looks for local header files in the current directory,
*	although it may be modified to handle any header file with doxygen syntax.
*
* Use: there are no dependencies as this commit. run with:
*		>$ node ctor_parse.js
*/


const {promisify} = require('util');
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const path = require('path');


// ============================================================
// ===						read_header_files()												===
// ============================================================
/*
*	Params: dir is a string representing the directory to read. It will
* look for all .h files in dir.
*	Returns: A promise once all readFile() operations have completed
*	for every header file found in dir.
*/

function read_header_files(dir) {
  let dir_contents = [];
  let promises = [];
	let valid_files = [];

	return readdir(dir)
  	.then((contents) => {

			for (var tmp_file of contents){
        if(tmp_file.includes('.h')){
          promises.push(
						readFile(dir + '/' + tmp_file, 'utf8')
					);
        }
      };

      return Promise.all(promises)
				.then((files) => {
					for(file of files){
						if(file.includes('// ###')){
							valid_files.push(file);
						}
					}
    		})
		})

		.then(() => {
			return new Promise((resolve, reject) => {
				resolve(valid_files)
			})
		})

		.catch((err) => {
			return new Promise((resolve, reject) => {
				reject(err);
			})
		})
};


// ============================================================
// ===								parse_params()												===
// ============================================================
/*
*	Params: files is an array of strings, where each string is the entire
* contents of the *.h file found by the previously called
* read_header_files().
*/

function parse_params(files){
	let promises = [];

	for(file of files){	// for each file find param tags and build json
		promises.push(
			_find_param_tags(file)
			.then(build_module_json)
		);
	}

	return Promise.all(promises);

};


function _find_param_tags(file){
	// console.log('==========');
	// console.log('file', file);
	return new Promise((resolve, reject) => {
		var params = [];

		// split the file string at newline chars
	  var lines = file.split('\n');

	  for(var line of lines){

			if(line.search('///') > 0){
				// look for the \param tag and save substring to param_line, else param_line is null
				// console.log('line', line);
				var param_line = (line.search('\\param') > 0) ? line.substr(line.search('param')).trim() : null;

				if(param_line){
					// find end of the 'param[in]' tag
					param_line = param_line.substring(param_line.search(']') +1).trim();
					// insert a bar after key name to add a string.split() point
					param_line = param_line.replace(/[\s]/, '|');
					params.push(param_line);
				}
			}
	  }

		// create a 'clean' array of each param item, ex: ['key', 'data type/range', 'desc']
		for(var i = 0; i < params.length; i++){
			params[i] = params[i].split('|');

			for(var j = 0; j < params[i].length; j++){
				params[i][j] = params[i][j].trim(); // remove all leading/trailing whitespace from each element
			}
		}


		// console.log(params);
		resolve(params);
	});
};


function build_module_json(param_array){
	// console.log('==========');
	// console.log(param_array);
	return new Promise((resolve, reject) => {
		var json_obj = {};

		// find the module name and assign it to the json_obj, and build structure of
		// child json object
		for(var param of param_array){
			if(param[0] == 'module_name' || param[0] == 'device_name'){
				var module_name = param[2].substring(param[2].indexOf('<"')+2, param[2].indexOf('">'));
				json_obj[module_name] = {};
				json_obj[module_name].description = 'Module description';
				json_obj[module_name].parameters = {};
				break;
			}
		}

		// iterate through param_array and create an object named [parameter] and populate the
		// three fields: type, value, and description. [parameter].value contains the string version
		// of the default parameter.
		for(var param of param_array){
			if(param[0] == 'module_name' || param[0] == 'device_name'){
				json_obj[module_name].parameters[param[0]] = {
					'type': param[1],
					'value': module_name,
					'range': null,
					'description': param[3],
				}
			}
			else{
				if(param[1] && param[2] && param[3]){
					json_obj[module_name].parameters[param[0]] = {
						'type': param[1],
						'value': param[2].substring(param[2].indexOf('<')+1, param[2].indexOf('>')),
						'range': param[3],
						'description': param[4],
					}
				}
			}
		}

		resolve(json_obj)
	});
}

// ========================================================================== //
// ===													del_undef_elems()													=== //
// === This function is used to remove any parameter elements that have		=== //
// === undefined description values. This occurs because the constructor 	=== //
// === param tags use the same syntax as the class method param tags. 		=== //
// === This program incorrectly reads those tags which results in an 			=== //
// === undefined value for the description key. This behaviour seems to  	=== //
// === be reliable enough that simply looking for undefined values in the === //
// === resulting json is a workable solution to clean up any bad values.	=== //
// ========================================================================== //
function del_undef_elems(json_module_array){
	return new Promise((resolve, reject) => {
		var cleaned_modules = [];

		if (json_module_array == null) {
    	reject(new Error('json_module_array is null'))
  	}
		else if(typeof json_module_array[Symbol.iterator] !== 'function'){
			reject(new Error('json_module_array not iterable'))
		}

		for(let module of json_module_array){
			let moduleName = Object.keys(module);
			let paramKeys = Object.keys(module[moduleName].parameters)

			for(paramKey of paramKeys){
				if(module[moduleName].parameters[paramKey].description == undefined){
					delete module[moduleName].parameters[paramKey];
				}
			}

			cleaned_modules.push(module)
		}

		resolve(cleaned_modules);
	})
	.catch((err) => {
		return new Promise((resolve, reject) => {
			reject(err)
		})
	})
}

function addToMaster(module_array){
	return new Promise((resolve, reject) => {
		if (module_array == null) {
			reject(new Error('module_array is null'))
		}
		else if(typeof module_array[Symbol.iterator] !== 'function'){
			reject(new Error('module_array not iterable'))
		}

		for(let module of module_array){
			let moduleName = Object.keys(module);
			master_json.components[moduleName] = module[moduleName]
		}

		resolve(master_json)
	})
}

// Add isEmpty function to object protoype, used for json obj validation
Object.prototype.isEmpty = function() {
    for(var key in this) {
        if(this.hasOwnProperty(key))
            return false;
    }
    return true;
}



// ========================================================================== //
// 					parse(<dir>, <callback()>)											=== //
// ========================================================================== //

exports.parse = function(dir, callback) {

	// first read all header files in dir
	read_header_files(dir)
  	.then( parse_params,    (err) => { console.log(err) }) // then for each header file found, look for and parse all '/param' values
		// .then( del_undef_elems, (err) => { console.log(err) }) // then remove any parameters with undefined descriptions
		.then( addToMaster,     (err) => { console.log(err) }) // then add the resulting json_data to the master_json
		.then( (master) => {
			fs.writeFile('test.json', JSON.stringify(master_json), (err) => {
				if(err) throw err;
				console.log('data written to test.json');
			});
			callback(master);
		},
		(err) => { console.log(err) }
		)
};
