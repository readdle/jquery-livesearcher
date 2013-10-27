jQuery LiveSearcher
===================

LiveSearcher is a small jQuery plugin that transforms `<input>` element into a powerful live search field

###### Simple usage example
```html
<div>
    <input type="text" id="textfield" placeholder="Enter some text here..."/>
    <div class="results"></div>
</div>
```

```javascript
$("#textfield").liveSearch({
    dataSource: 'search.php'
});
```

#### Plugin settings

 * dataSource: "" - Data source URL
 * method: "GET" - GET/POST
 * cache: false - (true/false) prevent request caching by adding timestamp to the URL
 * search_item: 'search-item' - class selector of the search result list item
 * fadeSpeed: 150 - result list fadeIn and fadeOut speed
 * clearOnSelect: false - if true - input field is cleared after the user select the result list element
 * notFoundText: "No records found" - Show this text, if the server has not found records

## Data source

Plugin receives data from data source in JSON format:

```json
[
    {
        "id": "1",
        "data": "Bob"
    },
    {
        "id": "2",
        "data": "Josh"
    }
]
```

You can transfer additional values in the 'data' attribute, each value is separated by the `%%`. See example of handling additional data below in events section.

```json
[
    {
        "id": 1,
        "data": "Bob%%Dylan"
    },
]
```

## Events

There are two events, triggered by the plugin:

 * liveSearch.dataLoaded - triggered after loading data from the data source
 * liveSearch.select - triggered after selecting item in search result list

###### Simple usage example
```javascript
$("#textfield").on('liveSearch.dataLoaded', function(e, args) {
    console.log('DATA LOAD event', args);
});

$("#textfield").on('liveSearch.select', function(e, args) {
    var data = args.data.split('%%');
    alert(args.id + ': '+data[0]+' '+data[1]);
});
```
