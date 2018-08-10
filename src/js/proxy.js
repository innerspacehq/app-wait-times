var Proxy = function () {
    "use strict";

    /* Private variables and functions */
    var request = function (type, url, data, done, fail, always) {
        var accessToken = Cookies.get("access_token") || accessToken;
        return $.ajax({
            type: type,
            url: url,
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            headers: { "Authorization": "Bearer " + accessToken }
        }).done(function (response, statusText, metadata) {
            if (typeof (done) === 'function') done(response, statusText, metadata);
        }).fail(function (response, statusText, metadata) {
            if (typeof (fail) === 'function') fail(response, statusText, metadata);
        }).always(function (response, statusText, metadata) {
            if (typeof (always) === 'function') always(response, statusText, metadata);
        });
    };

    /* Public variables and functions */
    return {
        get: function (url, done, fail, always) {
            // GET requests have no post data
            return request("GET", url, undefined, done, fail, always);
        },

        post: function (url, data, done, fail, always) {
            return request("POST", url, data, done, fail, always);
        },

        delete: function (url, data, done, fail, always) {
            return request("DELETE", url, data, done, fail, always);
        },

        put: function (url, data, done, fail, always) {
            return request("PUT", url, data, done, fail, always);
        },

        settle: function (p1) {
            var args;
            if (Array.isArray(p1)) {
                args = p1;
            } else {
                args = Array.prototype.slice.call(arguments);
            }
    
            function PromiseInspection(fulfilled, val) {
                return {
                    isFulfilled: function () {
                        return fulfilled;
                    }, value: function () {
                        return fulfilled ? val : undefined;
                    }, reason: function () {
                        return !fulfilled ? val : undefined;
                    }
                };
            }
            return $.when.apply($, args.map(function (p) {
                // if incoming value, not a promise, then wrap it in a promise
                if (!p || (!(typeof p === "object" || typeof p === "function")) || typeof p.then !== "function") {
                    p = $.Deferred().resolve(p);
                }
                // Now we know for sure that p is a promise
                // Make sure that the returned promise here is always resolved with a PromiseInspection object, never rejected
                return p.then(function (val) {
                    return new PromiseInspection(true, val);
                }, function (reason) {
                    // convert rejected promise into resolved promise
                    // this is required in jQuery 1.x and 2.x (works in jQuery 3.x, but the extra .resolve() is not required in 3.x)
                    return $.Deferred().resolve(new PromiseInspection(false, reason));
                });
            })).then(function () {
                // return an array of results which is just more convenient to work with
                // than the separate arguments that $.when() would normally return
                return Array.prototype.slice.call(arguments);
            });
        }
    };
}();