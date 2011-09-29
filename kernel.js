
/* ==== browser action ==== */
chrome.browserAction.onClicked.addListener(function(tab) {
    console.log('You pressed browser action');
});

/* ==== ajax initialization === */
(function(){
    // setup default type and default error handler
    jQuery.ajaxSetup({
        dataType:       "text",
        error:          ajax_error
    });

    function ajax_error(xhr, text, err){
        console.error('ajax error: ' + text + '/' + err);
    }
})();


/* ==== console API ==== */
function run(name){
    jQuery.getScript(name.toString() + '.js');
}

function display(key, pattern){
    var current_tab;

    chrome.extension.onRequest.addListener(listen);

    chrome.tabs.create({
        url: chrome.extension.getURL('display.html')
    }, function(tab){
        current_tab = tab;
    });

    function listen(req, sender, respond){
        if(req != 'ready'){
            return;
        }

        if(sender.tab.id != current_tab.id){
            return;
        }

        respond({
            key:    key,
            pat:    pattern,
            data:   localStorage[key]
        });
    }
}

function fetch_posts(url, target_key){

    var api = m.get_fetcher_api();

    var base_url;           // base fetching url
    var page_nums = null;
    var posts_data = {};

    console.log('Running ' + api.name + ' fetcher');

    // start the process
    check_url(url);

    function fetch_url(url, cb){
        console.log('Requesting ' + url + ' ...');
        jQuery.get(url).done(cb);
    }

    function check_url(url){
        var patterns = api.get_url_patterns();

        // check url
        if(!patterns['checker'].test(url)){
            console.error("URL \"" + url + "\" doesnot match /" + checker.source + "/");
            return;
        }

        // 
        if(patterns['pages'].test(url)){
            console.error("Page urls are dissallowed");
            return;
        }

        base_url = (api.base_url_filter) ?
            api.base_url_filter(url) : 
            url;

        // request the page
        fetch_url(url, parse_first_page);
    }

    function parse_first_page(html){
        docroot.innerHTML = html;

        page_nums = api.parse_paginator(docroot);

        if(page_nums === false){
            console.error("Cannot parse paginator");
            return;
        }

        console.log('Page ' + page_nums[0] + '/' + page_nums[1]);

        parse_posts(html);
    }

    function request_next_page(){
        if(page_nums[0] > 2){               // FIXME
            store_posts();
            return;
        }

        var url = api.get_page_url(base_url, page_nums[0]);

        fetch_url(url, parse_posts);
    }

    function parse_posts(html){
        docroot.innerHTML = html;

        var new_posts = api.parse_posts(docroot);

        // console.log(new_posts);

        if(new_posts.length > 0){
            if(is_object_empty(posts_data)){
                //
                // if the posts data is empty, initialize field arrays
                // with a first item of new_posts
                //
                var item = new_posts.shift();

                posts_data = {};
                for(var i in item){
                    posts_data[i] = [item[i]];
                }
            }

            for(var p in new_posts){
                for(var i in posts_data){
                    posts_data[i].push(new_posts[p][i]);
                }
            }
        }

        // iterate
        page_nums[0]++;
        request_next_page();

        function is_object_empty(o){
            for(var i in o) return false;
            return true;
        }
    }

    function store_posts(){
        function data_count(o){
            for(var i in o) return o[i].length;
        }

        var count = data_count(posts_data);

        console.log('Parsed ' + count + ' posts: ', posts_data);

        if(count > 0){
            localStorage[target_key] = LZW.encode(JSON.stringify(posts_data));
        }
    }
}

function join_posts(keys, target_key){
    
    if(typeof keys == 'string'){
        var pat = glob(keys);
        // console.log('Globbed pattern: ' + pat.source);

        //
        // build a list of matched keys
        //

        keys = [];

        for(var k in localStorage){
            if(pat.test(k)){
                keys.push(k);
            }
        }

        console.log('Matched keys: ' + keys.join(', '));
    }

    console.assert(typeof keys == 'object', '"keys" is not array');

    console.assert(keys.length > 0, 'No enough keys to perform the merge');

    //
    // obtain the list of fields (of the first data item)
    //

    var fields = (function(data){
        var fs = {}

        for(var f in data){
            fs[f] = true;
        }

        return fs;
    })( JSON.parse(LZW.decode(localStorage[keys[0]])) );

    //
    // join the data
    //

    for(var key in keys){
        var data = JSON.parse(LZW.decode(localStorage[key]));

        // verify keys

        var fail = (function(){
            for(var f in fields) if(!data[f]) return true;
            for(var f in data) if(!fields[f]) return true;
        })();

        if(fail){
            throw ('Fields in data item ' + key +
                ' do not match initial key pattern');
        }

    }
}

function test(){
    console.error('1');
    throw 12123123;
    throw '3';
}
