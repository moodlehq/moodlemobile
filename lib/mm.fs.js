/**
 * Moodle mobile file system lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.fs = {
    
    basePath: "",

	init: function(callBack) {
		MM.log("FS: Loading File System");
        if (MM.deviceOS == "android") {
            MM.fs.basePath = "Android/data/" + MM.config.app_id;
        }
        MM.fs.loadFS(callBack);
	},
   
    getRoot: function(){
        if (!MM.fs.fileSystemRoot) {
            MM.fs.loadFS(function(){ MM.fs.fileSystemRoot.fullPath });
        }
        else {
            return MM.fs.fileSystemRoot.fullPath;
        }
    },
    
    loadFS: function(callBack) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
            function(fileSystem) {
               MM.fs.fileSystemRoot = fileSystem.root;
               if (MM.deviceOS == "android") {
                MM.fs.fileSystemRoot.getDirectory(MM.fs.basePath, {create: true, exclusive: false},
                    function (entry) {
                        MM.fs.fileSystemRoot = entry;
                        callBack();
                    },
                    function() {
                        MM.popErrorMessage("Critial error accessing file system, Android/data/app_id does not exists or can be created") ;
                    }
                );
               } else {
                callBack();
               }
           }, function() {
              MM.popErrorMessage("Critial error accessing file system") 
           });                    
    },
    
    fileExists: function(path, successCallback, errorCallback) {
        var directory  = path.substring(0, filename.lastIndexOf("/") - 1);
        var filename   = path.substr(filename.lastIndexOf("/") + 1);
        MM.fs.fileSystemRoot.getDirectory(directory, { create: false }, 
            function(entry) {
                entry.getFile(filename, { create: false }, 
                function (entryFile) {
                    successCallback(entryFile.fullPath);
                }
                , errorCallback);
            }
            , errorCallback);
    },

    createDir: function(path, successCallback, dirEntry) {
        
        path = path.replace("file:///", "");
        MM.log("FS: Creating full directory " + path);
        
        var paths = path.split("/");
        
        var baseRoot = MM.fs.fileSystemRoot;
        if (dirEntry) {
            baseRoot = dirEntry;   
        }
        
        MM.log("FS: Creating directory " + paths[0] + "in" + baseRoot.fullPath);
        baseRoot.getDirectory(paths[0], {create: true, exclusive: false},
            function(newDirEntry) {
                if (paths.length == 1) {
                    successCallback(newDirEntry);
                    return;
                }
                // Recursively, create next directories
                paths.shift();
                MM.fs.createDir(paths.join('/'), successCallback, newDirEntry);
            },
            function() {
                MM.popErrorMessage("Critial error accessing file system") 
             });
    }
}