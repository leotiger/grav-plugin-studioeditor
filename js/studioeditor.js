(function ($) {
    $('.dz-insert').off();
    $(window).on('load', function () {
        var target = document.getElementById('preview-contents');//document.querySelector('preview-contents');
        function mutationObjectCallback(mutationRecordsList) {
            //console.log($("#preview-contents").data('mediapath'));
            $('#preview-contents img').each(function () {
                if ($(this).attr('src').split('/').length === 1) {
                    var $src = $("#preview-contents").data('mediapath') + $(this).attr('src');
                    $(this).attr('src', $src);
                    //console.log($src);
                }
            });
        }

        var config = {attributes: false, childList: true, characterData: false};
        var observer = new MutationObserver(mutationObjectCallback);
        if (target) {
            observer.observe(target, config);
        }
        //dropzone media handler    
        let studiomediamanager = $('.studio-media-field');
        var handleMediaInserts = false;
        if (studiomediamanager.length) {
            var mediaInsertChecker = setInterval(function () {
                let mediaInserts = $('#grav-dropzone').find('.dz-insert');
                if (mediaInserts.length && !handleMediaInserts) {
                    handleMediaInserts = true;
                    $('#grav-dropzone').delegate('.dz-insert', 'click', function (event) {
                        event.stopPropagation();
                        let target = $(event.currentTarget).parent('.dz-preview').find('.dz-filename');
                        var filename = target.text();
                        filename = filename.replace(/[^-a-zA-Z0-9_.]/g, '-');

                        if (location.pathname.indexOf('admin/pages') != -1) {
                            filename = location.pathname.replace("/admin/pages/", '/') + '/' + encodeURI(filename) + '?sizes=80vw';
                        }
                        $('#wmd-image-button').trigger('click');
                        setTimeout(function () {
                            $('.modal-insert-image').find('input[type="text"]').val(filename);
                        }, 150);
                    });
                    $('#grav-dropzone').delegate('[data-dz-view]', 'mouseenter', function (event) {
                        event.stopPropagation();
                        let target = $(event.currentTarget);
                        let file = target.parent('.dz-preview').find('.dz-filename');
                        let filename = encodeURI(file.text());
                        let URL = target.closest('[data-media-path]').data('media-path');
                        //let original = $('#grav-dropzone').files.filter((file) => encodeURI(file.name) === filename).shift();

                        //original = original && ((original.extras && original.extras.original) || encodeURI(original.name));
                        //let target = $(this).find('.dz-filename');
                        //let filename = target.text();
                        filename = filename.replace(/[^-a-zA-Z0-9_.]/g, '-');

                        if (location.pathname.indexOf('admin/pages') != -1) {
                            filename = location.pathname.replace("/admin/pages/", '/') + '/' + encodeURI(filename) + '?sizes=80vw';
                        }

                        console.log(filename);
                        target.attr('href', `${filename}`);
                    });

                    $('#grav-dropzone').delegate('.dz-image-preview', 'dragleave, dragstart', function (event) {
                        event.stopPropagation();

                        let target = $(this).find('.dz-filename');
                        var filename = target.text();
                        filename = filename.replace(/[^-a-zA-Z0-9_.]/g, '-');

                        if (location.pathname.indexOf('admin/pages') != -1) {
                            filename = location.pathname.replace("/admin/pages/", '/') + '/' + encodeURI(filename) + '?sizes=80vw';
                        }

                        $('#wmd-image-button').trigger('click');
                        setTimeout(function () {
                            $('.modal-insert-image').find('input[type="text"]').val(filename);
                        }, 150);
                    });
                    mediaInserts = null;
                }
            }, 500);
        }


        //fullscreen handler
        $('.studio-editor-button-fullscreen a').click(function (event) {
            let container = $('.studio-markdown-editor');
            if (!container.hasClass('studio-editor-fullscreen')) {
                let mediacollector = $('#studio-media-collector-full');
                $('.studio-media-field').appendTo(mediacollector);
                $('.studio-media-field').css('height', '250px').css('overflow-y', 'scroll');
                window.document.documentElement.style.overflow = 'hidden';
            } else {
                let mediacollector = $('#studio-media-collector');
                $('.studio-media-field').appendTo(mediacollector);
                $('.studio-media-field').css('height', '').css('overflow-y', '');

                window.document.documentElement.style.overflow = '';
            }
            container.toggleClass('studio-editor-fullscreen');
            window.dispatchEvent(new Event('resize'));

        });

        setTimeout(function () {
            $('.content-wrapper').css('overflow', '').css('overflow-y', 'auto').css('overflow-x', 'none');
        }, 2000);
        //help handler
        $('.studio-editor-button-help a').click(function (event) {
            event.stopPropagation();
            $('.extension-preview-buttons').removeClass('closed');
            $('.button-markdown-syntax').trigger('click');
        });

        var $allSquares;
        //insert table button
        $(document).on('click', '#wmd-table-button', function(event) {
            //$('#wmd-table-button').on('click', function (event) {
            //console.log('Table button');
            if ($('#grid-chooser').is(':visible')) {
                $('#grid-chooser').remove();
                return;
            }

            // Credit: http://jsfiddle.net/tnn3qgvj/8/
            var rows = 5;
            var cols = 5;

            var grid = '<div class="grid" id="grid-chooser">';
            for (var i = 0; i < rows; i++) {
                grid += '<div class="row">';
                for (var c = 0; c < cols; c++) {
                    grid += '<div class="square"><div class="inner"></div></div>';
                }
                grid += '</div>';
            }
            grid += '</div>';

            var $grid = $(this).append($(grid));

            $allSquares = $('.square');

        }).on('mouseover', '.square', function () {
            var $this = $(this);
            var col = $this.index() + 1;
            var row = $this.parent().index() + 1;
            $allSquares.removeClass('highlight');
            $('.row:nth-child(-n+' + row + ') .square:nth-child(-n+' + col + ')')
                    .addClass('highlight');
        }).on('click', '.square', function () {
            var $this = $(this);
            var cols = $this.index() + 1;
            var rows = $this.parent().index() + 1;
            $('#grid-chooser').remove();

            //Generate the markdown text to insert
            var text = '';

            var i = 0;
            var j = 0;

            while (i < cols) {
                text += '|  Column ' + (i + 1) + ' Title  ';
                i++;
            }

            text += '|' + '\n';

            i = 0;
            while (i < cols) {
                text += '|  :-----          ';
                i++;
            }

            text += '|' + '\n';

            i = 0;
            while (i < rows) {
                j = 0;
                while (j < cols) {
                    text += '|  Column ' + (j + 1) + ' Item ' + (i + 1) + ' ';
                    j++;
                }
                i++;

                text += '|' + '\n';
            }
            window.pagedownEditor.externalCommand(window.pagedownEditor, 'insertTable', text);
            $('#wmd-table-button').trigger('click');
        });

        $(".toggle-editor").closest('li').delegate('.item-actions i:first-child', 'click', function () {
            $isChildCollection = $(this).closest('ul').closest('li').length;
            if (!$isChildCollection) {
                $(this).trigger('showHideEditor');
            }
        });

        $(".toggle-editor").closest('li').bind('showHideEditor', function (event) {
            $isChildCollection = $(this).closest('ul').closest('li').length;
            if (!$isChildCollection) {
                if ($(this).hasClass('collection-collapsed')) {
                    $(this).closest('li').find('.form-field').removeClass('hide');
                } else {
                    $(this).closest('li').find('.toggle-editor').addClass('hide');
                }
            }
        });

        var showHideEditor = function (e) {
        };

        $('.admin-form-wrapper .form-tabs .tab-head').on('change', function (event) {

            if ($(event.target).val() == 'data.content') {
                window.dispatchEvent(new Event('resize'));
            }
        });
        if ($('#wmd-panel').length) {
            if ($('#preview-fontcolor') && $('#preview-fontcolor').val() && $('#preview-fontcolor').val().length) {
                $('#preview-contents').css('color', $('#preview-fontcolor').val());
            }
            if ($('#preview-bgcolor') && $('#preview-bgcolor').val() && $('#preview-bgcolor').val().length) {
                $('#preview-contents').css('background', $('#preview-bgcolor').val());
            }
            if ($('#wmd-fontsize') && $('#wmd-fontsize').val() && $('#wmd-fontsize').val().length) {
                $('#wmd-contents').css('font-size', $('#wmd-fontsize').val() + 'em');
            } else {
                if ($('#preview-fontsize') && $('#preview-fontsize').val() && $('#preview-fontsize').val().length) {
                    $('#preview-contents').css('font-size', $('#preview-fontsize').val() + 'em');
                }                
            }
            
        }
        $('#preview-fontcolor').on('blur', function (event) {
            if ($('#preview-fontcolor').val().length) {
                $('#preview-contents').css('color', $('#preview-fontcolor').val());
            } else {
                $('#preview-contents').css('color', '');
            }
        });
        $('#preview-bgcolor').on('blur', function (event) {
            if ($('#preview-bgcolor').val().length) {
                $('#preview-contents').css('background', $('#preview-bgcolor').val());
            } else {
                $('#preview-contents').css('background', '');
            }
        });
        $('#preview-fontsize').on('change', function (event) {
            if ($('#preview-fontsize').val().length) {
                $('#preview-contents').css('font-size', $('#preview-fontsize').val() + 'em');
            } else {
                $('#preview-contents').css('font-size', '1.2em');
            }
        });
        $('#wmd-fontsize').on('change', function (event) {
            if ($('#wmd-fontsize').val().length) {
                $('#preview-contents').css('font-size', $('#wmd-fontsize').val() + 'em');
            } else {
                $('#preview-contents').css('font-size', '1.2em');
            }
        });
        
        $('#grav-dropzone').delegate('.dz-success', 'mouseenter', function (event) {
            let target = $(event.currentTarget).find('.dz-filename span');
            if (target.length) {
                var filename = target.text();
                var pattern = /[^-a-zA-Z0-9_.]/g;
                if (pattern.test(filename)) {
                    filename = filename.replace(pattern, '-');
                    target.html(filename);
                    let imgtarget = $(event.currentTarget).find('img');
                    imgtarget.attr('alt', filename);
                    let deltarget = $(event.currentTarget).find('.dz-remove');
                    deltarget.replaceWith('<span class="dz-remove hint--top" data-hint="File was renamed and you need to save your page first to update the reference before you can delete the file.">Save to delete</span>');
                }
            }

        });


    });

    var excludetransforms = function (key, value) {
        return value;
    }
})(jQuery);
