/**
 * LiveSearcher - jQuery Plugin
 * Version: 1.5.0
 * Requires jQuery v1.6 or later
 *
 * Documentation: https://github.com/readdle/jquery-livesearcher
 *
 * Copyright (c) 2013-2014 Readdle inc.
 */
(function ($) {

    $.fn.liveSearch = function (options) {
        options = $.extend({
            dataSource: "",                     // Data source (URL or object with preloaded data for client-side search)
                                                // ======================================================================
                                                // preloaded object structure:
                                                // {
                                                //    fields: search field names (array of strings)
                                                //    records: preloaded data
                                                // }
                                                // ======================================================================
            behaviour: "search",                // "search" or "filter" (only for preloaded data!)
            method: "GET",                      // GET/POST
            cache: false,                       // (true/false) prevent request caching by adding timestamp to the URL
            search_item: 'search-item',         // class selector of the search result list item
            fadeSpeed: 150,                     // result list fadeIn and fadeOut speed
            delay: 200,                         // delay before sending search request
            clearOnSelect: false,               // if true - input field is cleared after the user select the result list element
            notFoundText: "No records found",   // Show this text, if the server has not found records
            tpl: null,                          // Template selector, uses default template if null
            outputTo: null,                     // Results container selector, uses a nearby ".results" container if null
            filter: null                        // Custom results filter callback. Return filtered array
        }, options);

        var _this = this;
        var template = null;

        var isFilter = function () {
            return options.dataSource != 'string' && options.behaviour == 'filter';
        };

        // Simple JavaScript Templating By John Resig
        var cache = {};

        function tmpl (str, data) {
            // Figure out if we're getting a template, or if we need to
            // load the template - and be sure to cache the result.
            var fn = !/\W/.test(str) ?
                cache[str] = cache[str] ||
                    tmpl(document.getElementById(str).innerHTML) :

                // Generate a reusable function that will serve as a template
                // generator (and which will be cached).
                new Function("obj",
                    "var p=[],print=function(){p.push.apply(p,arguments);};" +

                        // Introduce the data as local variables using with(){}
                        "with(obj){p.push('" +

                        // Convert the template into pure JavaScript
                        str
                            .replace(/[\r\t\n]/g, " ")
                            .split("<%").join("\t")
                            .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                            .replace(/\t=(.*?)%>/g, "',$1,'")
                            .split("\t").join("');")
                            .split("%>").join("p.push('")
                            .split("\r").join("\\'")
                        + "');}return p.join('');");

            // Provide some basic currying to the user
            return data ? fn(data) : fn;
        }

        function backendSearch (query) {
            var query_value = $.trim(query);
            if (query_value !== '') {
                $.ajax({
                    type: options.method,
                    url: options.dataSource,
                    data: { query: query_value },
                    cache: options.cache,
                    success: function (response) {
                        var $results = results.$element;
                        $results.html("");
                        var parsed = (typeof response === 'string') ? $.parseJSON(response) : response;
                        var count = 0;

                        // filter results if possible
                        if (options.filter && $.isFunction(options.filter)) {
                            parsed = options.filter(parsed);
                        }

                        $.each(parsed, function (i, val) {
                            $($.trim(template(val)))
                                .data('livesearch', val)
                                .appendTo($results);

                            count++;
                        });

                        if (!count) {
                            $('<div/>').addClass('element-notfound').text(options.notFoundText).appendTo($results);
                        }

                        _this.trigger('liveSearch.dataLoaded', response);

                        results.show(options.fadeSpeed);
                        results.calcPosition();
                    }
                });
            }
            return false;
        }

        function clientSearch (query) {
            query = query.replace("\\", '');

            function rowSearch(element, fields, query) {
                var result = false;
                $.each(fields, function(i, field) {
                    if (element[field]) {
                        if (element[field].search(new RegExp(query, 'i')) != -1) {
                            result = true;
                            return;
                        }
                    }
                });
                return result;
            }

            var fields = (options.dataSource.fields) ? options.dataSource.fields : ['title'];

            var query_value = $.trim(query);
            var searchResults = [];
            if (query_value !== '') {
                $.each(options.dataSource.records, function(i, source) {
                    if (rowSearch(source, fields, query)) {
                        searchResults.push(source);
                    }
                });
            }

            var $results = results.$element;
            $results.html("");
            var count = 0;

            // filter results if possible
            if (options.filter && $.isFunction(options.filter)) {
                searchResults = options.filter(searchResults);
            }

            $.each(searchResults, function (i, val) {
                $($.trim(template(val)))
                    .data('livesearch', val)
                    .appendTo($results);

                count++;
            });

            if (!count) {
                $('<div/>').addClass('element-notfound').text(options.notFoundText).appendTo($results);
            }

            _this.trigger('liveSearch.dataLoaded', searchResults);

            results.show(options.fadeSpeed);
            results.calcPosition();

            return false;
        }

        this.search = function () {
            if (typeof options.dataSource == 'string') {
                return backendSearch(_this.val())
            } else {
                return clientSearch(_this.val())
            }
        };

        this.setDataSource = function (dataSource) {
            options.dataSource = dataSource;
        };

        var results = {
            $element: options.outputTo ? $(options.outputTo) : _this.siblings(".results"),

            calcPosition: function () {
                var element = results.$element;
                var offset = _this.offset();
                var height = _this.outerHeight();
                element.offset({
                    top: offset.top + height,
                    left: offset.left
                });
            },

            delCurrent: function () {
                results.$element.children('.' + options.search_item).removeClass('current');
            },

            resetCurrent: function () {
                results.$element.children('.' + options.search_item).removeClass('current');
                results.$element.children('.' + options.search_item).first().addClass('current');
            },

            current: function () {
                return $(results.$element.children('.current'));
            },

            focusNext: function () {
                if (!results.current().length) {
                    results.resetCurrent();
                } else {
                    var oldCurrent = results.current();
                    var next = oldCurrent.next('.' + options.search_item);
                    var container = results.$element;
                    if (next.length) {
                        results.delCurrent();
                        next.addClass('current');

                        container.scrollTop(container.scrollTop() + results.current().position().top - container.height() / 2 + results.current().height() / 2);
                    }
                }
            },

            focusPrev: function () {
                if (!results.current()) {
                    results.resetCurrent();
                } else {
                    var oldCurrent = results.current();
                    var prev = oldCurrent.prev('.' + options.search_item);
                    var container = results.$element;
                    if (prev.length) {
                        results.delCurrent();
                        prev.addClass('current');

                        container.scrollTop(container.scrollTop() + results.current().position().top - container.height() / 2 + results.current().height() / 2);
                    }
                }
            },

            show: function (speed) {
                results.$element.stop().fadeTo(speed, 1);
            },

            hide: function (speed) {
                results.$element.stop().fadeOut(speed, function () {
                    results.$element.find('.blocked').removeClass('blocked');
                });
            }
        };

        var init = function () {
            var $this = $(this);
            var id = $this.attr('id');

            options.tpl = (options.tpl) ? $(options.tpl).html() : '<div class="<%=search_item%> element" data-name="<%=title%>" data-id="<%=id%>"><%=title%></div>';
            template = tmpl(options.tpl.replace('<%=search_item%>', options.search_item));

            $this.on("keyup", function (e) {
                // Arrows
                if (e.which == 38) {
                    results.focusPrev();
                }
                else if (e.which == 40) {
                    results.focusNext();
                }
                // Enter
                else if (e.which == 13) {
                    var $current = results.current();

                    $current.addClass('blocked');
                    results.delCurrent();

                    if ($current.length) {
                        var id = $current.attr('data-id');
                        var name = $current.attr('data-name');

                        if (options.clearOnSelect) {
                            _this.val('');
                        } else {
                            _this.val(name);
                        }

                        _this.attr('data-name', name);
                        _this.attr('data-id', id);

                        results.hide(options.fadeSpeed);

                        _this.trigger('liveSearch.select', {
                            'id': id,
                            'data': $current.data('livesearch')
                        });
                    }
                }
                // Another keys
                else {
                    // Set Timeout
                    clearTimeout($.data(_this, 'timer'));

                    // Set Search String
                    var search_string = _this.val();
                    // Do Search
                    if (search_string == '') {
                        results.hide(options.fadeSpeed);
                    } else {
                        $.data(_this, 'timer', setTimeout(_this.search, options.delay));
                    }
                    results.$element.scrollTop(0);
                }
            });

            // Text field focus in
            $this.focusin(function () {
                var $input = $(this);

                if (isFilter() && !$input.val()) {
                    clientSearch(".*");
                }

                // calculation of the number of items found
                var countOfElements = results.$element.children().size();

                if (countOfElements && $input.val().length) {
                    results.show(options.fadeSpeed);
                    _this.trigger('liveSearch.focusWithResults');
                }
            });

            // Text field focus out
            $this.focusout(function(event) {
                if (!results.$element.hasClass('is-hover')) {
                    results.hide(options.fadeSpeed);
                }
                results.delCurrent();
            });

            // Result container item click
            var items = '.' + options.search_item;

            results.$element.on("click", items, function (e) {
                var $result = $(this);

                if ($result.is('.blocked')) {
                    return;
                }

                $result.addClass('blocked');

                var id = $result.attr('data-id');
                var name = $result.attr('data-name');

                if (options.clearOnSelect) {
                    _this.val('');
                } else {
                    _this.val(name);
                }

                _this.attr('data-name', name);
                _this.attr('data-id', id);

                if (isFilter()) {
                    _this.blur();
                }

                results.hide(options.fadeSpeed);

                _this.trigger('liveSearch.select', {
                    'id': id,
                    'data': $.data(this, 'livesearch')
                });

                e.preventDefault();
            });

            results.$element.on('click', '.element-notfound', function () {
                results.hide(options.fadeSpeed);
            });

            results.$element.on('mouseenter mouseleave', function (e) {
                $(this).toggleClass('is-hover')
            });

        };

        return this.each(init);
    };
})(jQuery);