(function() {
    Date.prototype.Format = function(fmt) {
        var o = {
            "M+": this.getMonth() + 1,
            "d+": this.getDate(),
            "h+": this.getHours(),
            "m+": this.getMinutes(),
            "s+": this.getSeconds(),
            "q+": Math.floor((this.getMonth() + 3) / 3),
            "S": this.getMilliseconds()
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    };
    var formatDate = function(date) {
        return new Date(date).Format("yyyy-MM-dd hh:mm:ss");
    };

    var oldValue, id = window.location.pathname.substring(1);
    var qrUrl = 'https://qr.302.at/chart?chs=150x150&cht=qr&choe=UTF-8&chl=';
    if (!id) {
        $('textarea').val('Are you a spider?!\nIf anything wrong, please raise an issue on GitHub.');
    } else {
        $.get('/api/note/' + id, function(data) {
            if (data && data.note) {
                oldValue = data.note.text;
                $('textarea').val(data.note.text);
                $('#text-length').text(data.note.text.length);
                $('#visit-count').text(data.note.visitCount);
                $('#create-time').text(formatDate(data.note.create));
                $('#last-visit').text(formatDate(data.note.lastVisit));
                $('#last-update').text(formatDate(data.note.lastUpdate));
                $('#qrcode').attr('src', qrUrl + location.href);
                if (data.note.readonly) {
                    $('#readonly').addClass('disabled');
                    $('#readonly input').prop('checked', true);
                    $('textarea').prop('readonly', true);
                }
                if (data.note.markdown) {
                    $('#markdown-view input').prop('checked', true);
                    $('.ui.form .segment').html(marked($('textarea').val()));
                    $('.ui.form .segment').show();
                    $('textarea').hide();
                    $('pre code').each(function(i, block) {
                        hljs.highlightBlock(block);
                    });
                }
            } else {
                window.location.href = '/404';
            }
        });
    }

    var isModified = false,
        downCount = 0;
    $('textarea').on('change keyup paste', function() {
        if (this.value != oldValue) {
            oldValue = this.value;
            isModified = true;
            $('#text-length').text($('textarea').val().length);
            downCount = 5;
        }
    });

    $('#readonly').checkbox({
        onChecked: function() {
            $('.ui.modal')
                .modal({
                    closable: false,
                    onDeny: function() {
                        $('#readonly input').prop('checked', false);
                    },
                    onApprove: function() {
                        $.post('/api/note/readonly/' + id, function(data) {
                            //
                        });
                        $('#readonly').addClass('disabled');
                        $('textarea').prop('readonly', true);
                    }
                })
                .modal('show');
        }
    });

    // Clipboard settings
    var textClipboard = new Clipboard('#copy-text');
    textClipboard.on('success', function(e) {
        $('#copy-status').attr('data-text', '√');
        setTimeout(function() {
            $('#copy-status').attr('data-text', '-');
        }, 1000);
    });
    textClipboard.on('error', function(e) {
        $('#copy-status').attr('data-text', 'x');
        setTimeout(function() {
            $('#copy-status').attr('data-text', '-');
        }, 1000);
    });
    $('#copy-url').attr('data-clipboard-text', window.location.href);
    var urlClipboard = new Clipboard('#copy-url');
    urlClipboard.on('success', function(e) {
        $('#copy-status').attr('data-text', '√');
        setTimeout(function() {
            $('#copy-status').attr('data-text', '-');
        }, 1000);
    });
    urlClipboard.on('error', function(e) {
        $('#copy-status').attr('data-text', 'x');
        setTimeout(function() {
            $('#copy-status').attr('data-text', '-');
        }, 1000);
    });

    $('.ui .header span:nth-child(1)').on('click', function() {
        $('.ui .header span:nth-child(1)').hide();
        $('.ui .header span:nth-child(2)').show();
        $.get('/new', function(data) {
            window.location.href = data;
        });
    });
    $('.list .item > div').popup();

    setInterval(function() {
        if (downCount > 0) {
            downCount -= 1;
        }
    }, 100);

    setInterval(function() {
        if (isModified && downCount === 0) {
            isModified = false;
            $.post('/api/note/' + id, {
                text: $('textarea').val()
            }, function(data) {
                if (data && data.note && !data.note.readonly) {
                    $('#last-update').text(formatDate(data.note.lastUpdate));
                    $('#last-update').parent().addClass('green');
                    setTimeout(function() {
                        $('#last-update').parent().removeClass('green');
                    }, 1000);
                }
            })
        }
    }, 10);
})();
