
/* ==== browser action ==== */
chrome.browserAction.onClicked.addListener(function(tab) {
    console.log('You pressed browser action');
});

/* ==== local storage iface ==== */
chrome.extension.onRequest.addListener(function(req, sender, respond){
    if(req.store_key && req.store_data){
        var prev = localStorage[req.store_key];
        localStorage[req.store_key] = req.store_data;
        respond(prev);
    }else if(req.fetch_key){
        respond(localStorage[req.fetch_key]);
    }else{
        respond();
    }
});


/* ==== ajax stuff === */
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
function run(name, key){
    jQuery.getScript(name.toString() + '.js');

    if(key){
        data_key = key;
    }
}

function open_view (url){
    chrome.tabs.create({
        url: chrome.extension.getURL(url + '.html')
    });
}
