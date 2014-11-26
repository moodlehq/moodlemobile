MM.log('Loading Windows 8 Patch');

if (typeof (MSApp) !== "undefined") {

    // override jquery html method
    var old_html = $.fn.html;
    $.fn.html = function () {
        var args = arguments;
        var This = this;
        var result = null;
        MSApp.execUnsafeLocalFunction(function () {
            result = old_html.apply(This, args);
        });
        return result;
    };

    // override alert method
    alert = function (msg, Closed) {
        if (!Closed)
            Closed = function () { };
        navigator.notification.alert(
        msg,
        Closed,
        'Message',
        'OK'
        );
    };

    // check resizing screen
    $(window).resize(function () {
        console.log("Resize Screen to " + $(document).innerWidth());

        var width = $(document).innerWidth();
        var half = $(window).width();
        var panelLeftWidth = $('#panel-left').width();
        var resizeWidth = width - panelLeftWidth;
        var headerWidth = width;

        //console.log('half ' + half);

        $("#panel-left").show();
        $("#panel-center").css("width", resizeWidth);
        $('#panel-right').css("width", $(document).innerWidth() + 50);
        //MM.panels.hide('right');

        MM.panels.resizePanels();

        $(".header-wrapper").css("width", headerWidth);
        /*$(".header-wrapper").css("left", 'auto');
        $(".header-wrapper").css("right", '0px');*/

    });

    function captureAudioW8(captureSuccess, captureError, args) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, MM.fs.defaultSize,
            function (fileSystem) {

                // Capture an audio using getUserMedia.
                var buttons = {};
                var started = 0;

                // Record audio button and handler.
                buttons[MM.lang.s('record')] = function () {

                    var src = "captureAudio.mp3";
                    var mediaRec = new Media(src, onSuccessRecording, onErrorRecording);

                    function onSuccessRecording() {
                        mediaRec.stopRecord();
                        MM.widgets.dialogClose();

                        captureSuccess(mediaRec);
                    }

                    // onError Callback
                    function onErrorRecording(error) {
                        alert('code: ' + error.code + '\n' +
                              'message: ' + error.message + '\n');
                    }

                    if (started == '1') {
                        started = 0;
                    } else {

                        $(".modalFooter").children().first().html(MM.lang.s('stop')).on(MM.quickClick, function (e) {
                            e.stopPropagation();
                            onSuccessRecording();
                        });

                        // Record audio
                        mediaRec.startRecord();
                        started = 1;
                    }

                };
                buttons[MM.lang.s('close')] = MM.widgets.dialogClose;

                MM.popMessage(MM.lang.s('audiorecordinstructions'), { autoclose: false, buttons: buttons });


            }, function () {
                MM.popErrorMessage('Critical error accessing file system');
            }
        );

    };

    function sendNotificationsW8(URI) {
        console.log("Uri: ", URI);
        push.wns.sendToastText01(URI, {
            text1: "Sample toast from sample insert"
        }, {
            success: function (pushResponse) {
                console.log("Sent push:", pushResponse);
            }
        });
    }
}
