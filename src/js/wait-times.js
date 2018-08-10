var WaitTimes = function () {
    "use strict";

    var _siteId;
    var _zoneIds;
    var _ideals = {};
    var _onMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent));

    var hideLoadingAnimation = function () {
        $(".loading-part")
            .addClass("index-999")
            .addClass("fadeOut");
        setTimeout(function () {
            $(".loading-part").addClass("display-none");
        }, 1000);
    }

    var slidePanelsIn = function () {
        hideLoadingAnimation();
        $(".ms-left").addClass("fadeInLeft");
        $(".ms-right").addClass("fadeInRight");
        // Display none for the loading
        setTimeout(function () {
            $(".opacity-0").addClass("fadeIn").removeClass("opacity-0");
        }, 1100);
    }

    var startAutoScroll = function () {
        setInterval(function () {
            $.fn.multiscroll.moveSectionDown();
        }, 10000); // 10 sec
    }

    var startAutoRefresh = function () {
        setTimeout(function () {
            window.location.reload();
        }, 300000); // 5 min
    }

    var getLatestData = function (entity) {
        entity.data.sort(function (a, b) {
            return new Date(b["date-time"]) - new Date(a["date-time"]);
        })
        return entity.data[0];
    }

    var formatTime = function (dateTime) {
        var date = new Date(dateTime);
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutes + ' ' + ampm;
    }

    var slideTemplate = `
        <div class="ms-section" id="<%this.id%>">
            <div class="overlay"></div>
            <div class="item-title text-center">
                <div class="countdown row">
                    <h2 class="datetime animated-middle opacity-0"> <%this.datetime%> </h2>
                </div>

                <h2><%this.label%></h2>
                <div class="separator"></div>

                <div class="countdown row">
                    <div class="dash-glob">
                        <div class="dash days_dash row">
                            <div class="digit animated-middle opacity-0"><%this.waittime%></div>
                            <div class="text-right animated-middle opacity-0">minutes<br/>wait</div>
                        </div>
                    </div>

                    <div class="text-day hidden">
                        <h3 class="animated-middle opacity-0">
                            <span class="point">Occupancy: </span> <%this.occupancy%></h3>
                    </div>
                </div>
            </div>
        </div>
    `

    var slideEmptyTemplate = `
        <div class="ms-section visible-lg" id="<%this.id%>">
            <div class="overlay"></div>
            <div class="item-title">
            </div>
        </div>
    `

    /* Public Common functions */
    return {
        init: function () {

            // Fetch the url parameters
            var _urlParams = {};
            var rawParams = window.location.search.split("/");

            // The following query parameters should be present in the URL
            // /site/{site-id}/zones/{zone-id-1},{zone-id-2}.../api/{api-host}/ideals/{ideal-1},{ideal-2}...
            // e.g /site/201/zones/54,55,56,57/api/b01-api/ideals/3,5,10,3

            // Iteration starts at i = 1 because the browser includes "?" as a query parameter
            for (var i = 1; i < rawParams.length; i++) {
                if (rawParams[i].length == 0) continue;
                var key = rawParams[i].toLowerCase();
                var val = rawParams[i + 1];
                _urlParams[key] = val;

                // Url params are in the form of key/value/key/value e.g /site/1/tag/123
                // So we increment i again in order to skip the value and move on to the next key
                i++;
            }

            // Check if the required URL parameters were set
            if (!_urlParams["api"]) {
                console.error("No API server specified in URL!");
                hideLoadingAnimation();
                return;
                // We should display an error or have a fallback API URL in this case
            } else {
                WaitTimesProxy.setUrlHostname(_urlParams["api"]);
            }

            if (!_urlParams["site"]) {
                console.error("No Site ID provided in URL!");
                hideLoadingAnimation();
                return;
            }
            _siteId = _urlParams["site"];

            if (!_urlParams["zones"]) {
                console.error("No Zone IDs provided in URL!");
                hideLoadingAnimation();
                return;
                // If no zone id is entered we could fallback to displaying info for all zones in a site
            }
            _zoneIds = _urlParams["zones"].split(",");

            if (!_urlParams["ideals"]) {
                // Default it to ideal time of 5 min
                _urlParams["ideals"] = "5";
            }
            var ideals = _urlParams["ideals"].split(",");
            for (i = 0; i < _zoneIds.length; i++) {
                _ideals[_zoneIds[i]] = ideals[i] || "5";
            }

            // Fetch the wait times for each zone
            var promises = [];
            _zoneIds.forEach(function (zoneId) {
                var promise = WaitTimesProxy.getFineWaitTimes(_siteId, zoneId, null, function (err) {
                    console.error("Failed to retrieve wait times for zone with ID: " + zoneId, err);
                });
                promises.push(promise);
            });
            Proxy.settle(promises).then(function (results) {
                if (!results || results.length == 0) {
                    hideLoadingAnimation();
                    return;
                }
                var i = 0;
                var left = 1, right = 1;
                results.forEach(function (r) {
                    var entity = r.value() || {};
                    var side = i % 2 == 0 ? "left" : "right";
                    var data = getLatestData(entity);
                    var model = {
                        id: (i % 2 == 0 ? side + left++ : side + right++),
                        occupancy: data.occupancy,
                        label: entity["zone-label"],
                        datetime: "@ " + formatTime(data["date-time"])
                    }
                    var ideal = _ideals[entity["zone-id"]];
                    if (data["wait-time"] <= ideal) {
                        model.waittime = "0-" + ideal;
                    } else if (data["wait-time"] <= (ideal * 2)) {
                        model.waittime = ideal + "-" + (ideal * 2);
                    } else {
                        model.waittime = (ideal * 2) + "+";
                    }
                    var tmpl = r.isFulfilled()
                        ? TemplateEngine(slideTemplate, model)
                        : TemplateEngine(slideEmptyTemplate, model);
                    $("#" + side + "-part").append(tmpl);
                    i++;
                });
                // If there are odd number of zones, insert an empty slide at the end.
                if (i % 2 == 1) {
                    $("#right-part").append(TemplateEngine(slideEmptyTemplate, { id: "right" + right }));
                }

                if ((_onMobile === false)) {
                    $('#multi-div').multiscroll({
                        loopTop: true,
                        loopBottom: true,
                        navigation: true,
                        navigationTooltips: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
                    });
                } else {
                    $('#multi-div').multiscroll({
                        loopTop: true,
                        loopBottom: true,
                        navigation: true,
                        navigationTooltips: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
                    });
                    $('#multi-div').multiscroll.destroy();
                }

                slidePanelsIn();
                startAutoScroll();
                startAutoRefresh();
            })
        }
    };
}();

WaitTimes.init();
