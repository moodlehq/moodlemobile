/**
 * Moodle mobile file system lib
 *
 * @package core
 * @copyright Juan Leyva <juanleyvadelgado@gmail.com>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


MM.fs = {

    createDir: function(path, successCallback, dirEntry) {
        
        if (typeof(MM.fs.fileSystemRoot) == "undefined") {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                                     function(fileSystem) {
                                        MM.fs.fileSystemRoot = fileSystem.root;
                                        MM.fs.createDir(path, successCallback);
                                    }, function() {
                                       MM.popErrorMessage("Critial error accessing file system") 
                                    });
            return;
        }
        
        MM.log("FS: Creating full directory " + path);
        
        var paths = path.split("/");
        
        var baseRoot = MM.fs.fileSystemRoot;
        if (dirEntry) {
            baseRoot = dirEntry;   
        }
        
        MM.log("FS: Creating directory " + paths[0]);
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