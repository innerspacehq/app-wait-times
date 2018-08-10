var WaitTimesProxy = function () {
    "use strict";

    // Todo: pull this from the url query parameters?
    var _apiUrl;

    /* Private variables and functions */
    var _GRANULARITY_FINE = "fine";
    var _GRANULARITY_COARSE = "coarse";
    var _waitTimesBySiteId = "/wait-times/{site-id}";
    var _waitTimesByZoneId = "/data/wait-times/sites/{site-id}/zones/{zone-id}/{granularity}";
    var _waitTimesSuggestionByZoneId = "/wait-times/suggestion/{zone-id}?isTest=false";
    var _waitTimeVisitBlocksByZoneId = "/wait-times/visittimeblocks/{zone-id}";

    /* Public variables and functions */
    return {

        // Retrieve the current (most recently calculated) wait times for all zones for a specific site id
        getWaitTimesBySiteId: function (siteId, done, fail, always) {
            var url = _apiUrl + _waitTimesBySiteId.replace("{site-id}", siteId);
            return Proxy.get(url, done, fail, always);
        },

        // Retrieve wait times for a  specific time range with granularity (by siteId and zoneId)
        getFineWaitTimes: function (siteId, zoneId, done, fail, always) {
            var url = _apiUrl + _waitTimesByZoneId.replace("{site-id}", siteId)
                .replace("{zone-id}", zoneId)
                .replace("{granularity}", _GRANULARITY_FINE);
            return Proxy.get(url, done, fail, always);
        },

        // Retrieve wait times for a  specific time range with granularity (by siteId and zoneId)
        getCoarseWaitTimes: function (siteId, zoneId, done, fail, always) {
            var url = _apiUrl + _waitTimesByZoneId.replace("{site-id}", siteId)
                .replace("{zone-id}", zoneId)
                .replace("{granularity}", _GRANULARITY_COARSE);
            return Proxy.get(url, done, fail, always);
        },

        // Retrieve average wait times to suggest by zoneId.
        getWaitTimesSuggestionsByZoneId: function (zoneId, done, fail, always) {
            var url = _apiUrl + _waitTimesSuggestionByZoneId.replace("{zone-id}", zoneId);
            return Proxy.get(url, done, fail, always);
        },

        // Retrieve visit time blocks for a specified period of time
        getWaitTimeVisitBlocksByZoneId: function (zoneId, done, fail, always) {
            var url = _apiUrl + _waitTimeVisitBlocksByZoneId.replace("{zone-id}", zoneId);
            return Proxy.get(url, done, fail, always);
        },

        // Set the base url to use for the API calls
        setUrlHostname: function (hostname) {
            _apiUrl = "https://" + hostname + ".innerspace.io/v1";
        }
    };
}();
