/**
 * liveSearcher - jQuery Plugin
 * version: 1.3
 * requires jQuery v1.6 or later
 *
 * Documentation: https://github.com/readdle/jquery-livesearcher
 *
 * Copyright (c) 2013 Readdle inc.
 */
(function($) {

    $.fn.liveSearch = function(options) {
        options = $.extend({
            dataSource: "",             // Data source URL
            method: "GET",              // GET/POST
            cache: false,               // (true/false) prevent request caching by adding timestamp to the URL
            search_item: 'search-item', // class selector of the search result list item
            fadeSpeed: 150,             // result list fadeIn and fadeOut speed
            clearOnSelect: false,       // if true - input field is cleared after the user select the result list element
            notFoundText: "No records found" // Show this text, if the server has not found records
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
                            var count = 0;
                            $.each(parsed, function(i, val) {
                                $('<div/>')
                                    .addClass(options.search_item)
                                    .addClass('element')
                                    .text(val.data.split('%%')[0])
                                    .attr('data-name', val.data)
                                    .attr('data-id', val.id)
                                    .appendTo(results);
                                count++;
                            });

                            if (!count) {
                                $('<div/>').addClass('element-notfound').text(options.notFoundText).appendTo(results);
                            }

                            $(obj).trigger('liveSearch.dataLoaded', response);
                        }
                        catch (err) {}
                    }
                });
            } return false;
        };

        var results = {
            element: obj.parent().find('.results'),

            calcPosition: function() {
                var element = results.element;
                var offset = obj.offset();
                var height = obj.outerHeight();
                var width = obj.innerWidth();
                element.offset({
                    top: offset.top + height,
                    left: offset.left
                });
                element.width(width);
            },

            delCurrent: function() {
                results.element.children('.'+options.search_item).removeClass('current');
            },

            resetCurrent: function() {
                results.element.children('.'+options.search_item).removeClass('current');
                results.element.children('.'+options.search_item).first().addClass('current');
            },

            current: function() {
                return $(results.element.children('.current')[0]);
            },

            focusNext: function() {
                if (!results.current().length) {
                    results.resetCurrent();
                } else {
                    var oldCurrent = results.current();
                    var next = oldCurrent.next('.'+options.search_item);
                    var container = results.element;
                    if (next.length) {
                        results.delCurrent();
                        next.addClass('current');

                        container.scrollTop(container.scrollTop() + results.current().position().top - container.height()/2 + results.current().height()/2);
                    }
                }
            },

            focusPrev: function() {
                if (!results.current()) {
                    results.resetCurrent();
                } else {
                    var oldCurrent = results.current();
                    var prev = oldCurrent.prev('.'+options.search_item);
                    var container = results.element;
                    if (prev.length) {
                        results.delCurrent();
                        prev.addClass('current');

                        container.scrollTop(container.scrollTop() + results.current().position().top - container.height()/2 + results.current().height()/2);
                    }
                }
            },

            show: function(speed) {
                results.element.stop().fadeTo(speed, 1);
            },

            hide: function(speed) {
                results.element.stop().fadeOut(speed);
            }
        };

        var init = function() {
            var id = $(this).attr('id');

            $(this).live("keyup", function(e) {
                // Arrows
                if (e.which == 38) {
                    results.focusPrev();
                }
                else if(e.which == 40) {
                    results.focusNext();
                }
                // Enter
                else if(e.which == 13) {
                    if (results.current().length) {
                        var id = results.current().attr('data-id');
                        var name = results.current().attr('data-name');

                        if(options.clearOnSelect) {
                            obj.val('');
                        } else {
                            obj.val(results.current().text());
                        }

                        obj.attr('data-name', name);
                        obj.attr('data-id', id);

                        results.hide();

                        results.delCurrent();

                        $(obj).trigger('liveSearch.select', {
                            'id': id,
                            'data': name
                        });
                    }
                }
                // Another keys
                else {
                    // Set Timeout
                    clearTimeout($.data(this, 'timer'));

                    // Set Search String
                    var search_string = $(obj).val();
                    // Do Search
                    if (search_string == '') {
                        results.hide(options.fadeSpeed);
                    } else {
                        results.show(options.fadeSpeed);
                        results.calcPosition();
                        $(this).data('timer', setTimeout(obj.search, 150));
                    }
                    $(this).parent().find(".results").scrollTop(0);
                }
            });

            // Text field focus in
            $(this).focusin(function() {
                // calculation of the number of items found
                var elements = results.element.children().size();
                if(elements && $(this).val().length) {
                    results.show(options.fadeSpeed);
                }
            });

            // Text field focus out
            $(this).focusout(function() {
                results.hide(options.fadeSpeed);
                results.delCurrent();
            });

            // Result container item click
            var items = $('.'+options.search_item);
            items.die("click");  // Prevent multiple event listener bind
            items.live("click", function(e) {
                var id = $(this).attr('data-id');
                var name = $(this).attr('data-name');

                if(options.clearOnSelect) {
                    obj.val('');
                } else {
                    obj.val($(this).text());
                }

                obj.attr('data-name', name);
                obj.attr('data-id', id);

                results.hide();

                $(obj).trigger('liveSearch.select', {
                    'id': id,
                    'data': name
                });

                e.preventDefault();
            });

        };

        return this.each(init);
    };
})(jQuery);