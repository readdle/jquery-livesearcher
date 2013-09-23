/**
 * liveSearcher - jQuery Plugin
 * version: 1.0
 * requires jQuery v1.6 or later
 *
 * Documentation: https://github.com/readdle/jquery-livesearcher
 *
 * Copyright (c) 2013 Rodik Alexandr - rodik@readdle.com
 */
(function($) {

    $.fn.liveSearch = function(options) {
        options = $.extend({
            dataSource: "",             // Data source URL
            method: "GET",              // GET/POST
            cache: false,               // (true/false) prevent request caching by adding timestamp to the URL
            search_item: 'search-item', // id of the search result list item
            fadeSpeed: 150,             // result list fadeIn and fadeOut speed
            clearOnSelect: false        // if true - input field is cleared after the user select the result list element
        }, options);

        var obj = this;

        this.search = function() {
            var query_value = $.trim($(obj).val());
            if(query_value !== '') {
                $.ajax({
                    type: options.method,
                    url: options.dataSource,
                    data: { query: query_value },
                    cache: options.cache,
                    success: function(response) {
                        var results = $(obj).parent().find(".results");
                        try {
                            results.html("");
                            var parsed = $.parseJSON(response);
                            $.each(parsed, function(i, val) {
                                $('<div/>')
                                    .addClass(options.search_item)
                                    .addClass('element')
                                    .text(val.data.split('%%')[0])
                                    .attr('data-name', val.data)
                                    .attr('data-id', val.id)
                                    .appendTo(results);
                            });
                            $(obj).trigger('liveSearch.dataLoaded', response);
                        }
                        catch (err) {}
                    }
                });
            } return false;
        };

        // Calculate position of the ".results" block
        this.calcResultsPosition = function() {
            var results = this.parent().find('.results');
            var offset = this.offset();
            var height = this.outerHeight();
            var width = this.innerWidth();
            results.offset({
                top: offset.top+height,
                left: offset.left
            });
            results.width(width);
        };

        var init = function() {
            var id = $(this).attr('id');

            $(this).live("keyup", function(e) {
                // Set Timeout
                clearTimeout($.data(this, 'timer'));

                // Set Search String
                var search_string = $(obj).val();

                // Do Search
                if (search_string == '') {
                    $(this).parent().find(".results").fadeOut({duration: options.fadeSpeed, queue: false});
                } else {
                    $(this).parent().find(".results").fadeIn({duration: options.fadeSpeed, queue: false});
                    obj.calcResultsPosition();
                    $(this).data('timer', setTimeout(obj.search, 150));
                }
                $(this).parent().find(".results").scrollTop(0);
            });

            $(this).focusin(function() {
                // calculation of the number of items found
                var elements = $(this).parent().find('.results').children().size();
                if(elements && $(this).val().length) {
                    $(this).parent().find('.results').fadeIn({duration: options.fadeSpeed, queue: false});
                }
            });

            $(this).focusout(function() {
                $(this).parent().find('.results').fadeOut(150);
            });

            // Prevent multiple event listener bind
            var addEventListener = true;
            if (typeof window.liveSearchBind === 'undefined') {
                window.liveSearchBind = []
            } else {
                var len = window.liveSearchBind.length;
                for (var i=0; i<len; i++) {
                    if(window.liveSearchBind[i] === options.search_item) {
                        addEventListener = false;
                        break;
                    }
                }
            }

            if(addEventListener) {

                $('.'+options.search_item).live("click", function(e) {
                    var id = $(this).attr('data-id');
                    var name = $(this).attr('data-name')

                    if(options.clearOnSelect) {
                        obj.val('');
                    } else {
                        obj.val($(this).text());
                    }

                    obj.attr('data-name', name);
                    obj.attr('data-id', id);

                    $(this).parent('.results').fadeOut(150)

                    $(this).trigger('liveSearch.select', {
                        'id': id,
                        'data': name
                    });

                    e.preventDefault();
                });

                window.liveSearchBind.push(options.search_item);

            }

        };

        return this.each(init);
    };
})(jQuery);