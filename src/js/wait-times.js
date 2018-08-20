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
        <div class='ms-section'>
            <article class="zone-data if-mobile" id="<%this.id%>">
                <header>
                    <h1><%this.label%></h1>
                </header>
                <section class="wait-time">
                    <header>
                        <h2>Current Wait Time</h2>
                    </header>
                    <div class="wait-time-info wait-<%this.waitlength%>">
                        <span class="data"><%this.waittime%></span><span class="units"> Minutes</span>
                    </div>
                </section>
            </article>
        </div>
    `

    var welcomeMessageSlide = `
        <div class="ms-section welcome-slide" id="left1">
                <div class="text-slide-container text-center if-mobile">
                    <h1 class="main-text animated-middle opacity-0">WELCOME TO CAFE 25</h1>
                    <div class="separator-line-horizontal animated-middle opacity-0"></div>
                    <p class="sub-text animated-middle opacity-0">BON APPÉTIT</p>
                </div>
        </div>
    `

    var mapSlide = `
        <div class="ms-section map-slide" id="right1">
            <img src="img/cafe_25_map.png" alt="Cafe 25 Map" class="if-mobile animated-middle opacity-0" />
        </div>
    `

    var messageSlideTemplate = `
        <div class="ms-section if-mobile ending-slide" id="left5">
            <div class="text-slide-container text-center if-mobile">
                <h1 class="main-text animated-middle opacity-0">HAVE A GREAT DAY!</h1>
                <div class="separator-line-horizontal animated-middle opacity-0"></div>
                <p class="sub-text animated-middle opacity-0">SEE YOU AGAIN SOON</p>
            </div>
        </div>
    `

    var fullscreenImageSlideTemplate = `
        <div class="ms-section fullscreen-image-slide" id="right5">
            <img src="img/ending-slide-bg.png" alt="Stack of cookies" class ="if-mobile" />
        </div>
    `

    var slideEmptyTemplate = `
        <div class="ms-section" id="<%this.id%>">
        </div>
    `

    var addIntroSlides = function () {
        $("#left-part").append(welcomeMessageSlide);
        $("#right-part").append(mapSlide);
    }

    var addOutroSlides = function () {
        $("#left-part").append(messageSlideTemplate);
        $("#right-part").append(fullscreenImageSlideTemplate);
    }

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
            if (_urlParams["api"]) {
                WaitTimesProxy.setUrlHostname(_urlParams["api"]);
            } else if (Cookies.get("api")) {
                WaitTimesProxy.setUrlHostname(Cookies.get("api"));
            } else {
                console.error("No API server specified in URL!");
                hideLoadingAnimation();
                return;
            }

            if (_urlParams["site"]) {
                _siteId = _urlParams["site"];
            } else if (Cookies.get("site_id")) {
                _siteId = Cookies.get("site_id");
            } else {
                console.error("No Site ID provided in URL!");
                hideLoadingAnimation();
                return;
            }

            if (_urlParams["zones"]) {
                _zoneIds = _urlParams["zones"].split(",");
            } else if (Cookies.get("zone_ids")) {
                _zoneIds = decodeURIComponent(Cookies.get("zone_ids")).split(",");
            } else {
                console.error("No Zone IDs provided in URL!");
                hideLoadingAnimation();
                return;
                // If no zone id is entered we could fallback to displaying info for all zones in a site
            }

            var ideals = ["5"]; // Default it to ideal time of 5 min
            if (_urlParams["ideals"]) {
                ideals = _urlParams["ideals"].split(",");
            } else if (Cookies.get("ideals")) {
                ideals = decodeURIComponent(Cookies.get("ideals")).split(",");
            }
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
                if (!results) {
                    results = [];
                }
                var now = new Date();

                // Add static intro slides
                addIntroSlides();

                var i = 0;
                var left = 2, right = 2;
                results.forEach(function (r) {
                    if (!r.isFulfilled() && !r.value()) return;
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
                        model.waitlength = "short";
                    } else if (data["wait-time"] <= (ideal * 2)) {
                        model.waittime = ideal + "-" + (ideal * 2);
                        model.waitlength = "medium";
                    } else {
                        model.waittime = (ideal * 2) + "+";
                        model.waitlength = "long";
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

                if (i > 0) {
                    // Add static outro slides
                    addOutroSlides();
                }

                var dateString = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" });
                console.log(dateString);
                $("#last-updated-time").text(dateString);

                if ((_onMobile === false)) {
                    $('#multi-div').multiscroll({
                        loopTop: true,
                        loopBottom: true,
                    });
                } else {
                    $('.if-mobile').addClass('mobile');
                    $('#multi-div').multiscroll({
                        loopTop: true,
                        loopBottom: true,
                    });
                    $('#multi-div').multiscroll.destroy();
                }
                $('.if-mobile').removeClass('if-mobile');

                slidePanelsIn();
                startAutoScroll();
                startAutoRefresh();
            })
        }
    };
}();

WaitTimes.init();
