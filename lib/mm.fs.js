// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

/**
 * @fileoverview Moodle mobile file system lib.
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */


/**
  * @namespace Holds all the MoodleMobile file system functionallity.
 */
MM.fs = {

    basePath: '',

	init: function(callBack) {
		MM.log('Loading File System', 'FS');
		
		if (!callBack) {
			callBack = function() {};
		}

        if (typeof(MM.fs.fileSystemRoot) != 'undefined') {
            // The file system is yet loaded.
            MM.log('The file system was previously loaded', 'FS');
            callBack();
            return;
        }

        if (MM.getOS() == 'android') {
            MM.fs.basePath = 'Android/data/com.moodle.moodlemobile';
        }
        MM.fs.loadFS(callBack);
	},

    getRoot: function() {
        if (!MM.fs.fileSystemRoot) {
            MM.fs.loadFS(function() { MM.fs.fileSystemRoot.fullPath });
        }
        else {
            var path = MM.fs.fileSystemRoot.fullPath;
            // Android 4.2 and onwards
            path = path.replace("storage/emulated/0", "sdcard");
            return path;
        }
    },

    loadFS: function(callBack) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
            function(fileSystem) {
               MM.fs.fileSystemRoot = fileSystem.root;
               if (MM.getOS() == 'android') {
                MM.fs.fileSystemRoot.getDirectory(MM.fs.basePath, {create: true, exclusive: false},
                    function(entry) {
                        MM.fs.fileSystemRoot = entry;
                        callBack();
                    },
                    function() {
                        MM.popErrorMessage('Critial error accessing file system, Android/data/app_id does not exists or can be created');
                    }
                );
               } else {
                callBack();
               }
           }, function() {
              MM.popErrorMessage('Critial error accessing file system');
           });
    },

    fileExists: function(path, successCallback, errorCallback) {
        var directory = path.substring(0, filename.lastIndexOf('/') - 1);
        var filename = path.substr(filename.lastIndexOf('/') + 1);
        MM.fs.fileSystemRoot.getDirectory(directory, { create: false },
            function(entry) {
                entry.getFile(filename, { create: false },
                function(entryFile) {
                    successCallback(entryFile.fullPath);
                }
                , errorCallback);
            }
            , errorCallback);
    },

    createDir: function(path, successCallback, dirEntry) {

        path = path.replace('file:///', '');
        MM.log('FS: Creating full directory ' + path);

        var paths = path.split('/');

        var baseRoot = MM.fs.fileSystemRoot;
        if (dirEntry) {
            baseRoot = dirEntry;
        }

        MM.log('FS: Creating directory ' + paths[0] + 'in' + baseRoot.fullPath);
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
                MM.popErrorMessage('Critial error accessing file system');
             });
    }
};
