self.onmessage = function(e) {
    var that = self;
    var url = e.data.url;

    if (e.data.type == "download") {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';

        xhr.onload = function(e) {
            that.postMessage({status: 'success', fileContents: xhr.response});
        };
        xhr.onerror = function(e) {
            that.postMessage({status: 'failure'});
        };
        xhr.send();
    }
};