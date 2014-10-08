self.onmessage = function(e) {
    var that = self;

    if (e.data.type == "download") {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', e.data.url, true);
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