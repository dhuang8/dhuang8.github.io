    $(document).ready(function() {
        function controlsBox() {
            var htmlText = `<div style='background-color:white;height:100%;width:100%;overflow:hidden;margin:auto'>
        	<p style="white-space: pre;">
        	Left click on the chart to play the Twitch video at that time.
        	Mouse wheel scroll to zoom in and out of the timeline.
        	Mouse drag to scroll left and right of the timeline.
        	Press C to bring this window up again.
        	This window won't appear again after you close it the first time.
        	</p></div>`;

            $.colorbox({
                html: htmlText,
                onClosed: function() {
                    localStorage.setItem("seen", true)
                }
            });
        }

        if (!localStorage.seen) {
            controlsBox();
        }

        $(document).keypress(function(event) {
            if (event.which === 99) controlsBox();
        });

        var namelist = ["Axl", "Bedman", "Chipp", "Elphelt", "Faust", "Ino", "Jack-O'", "Jam", "Johnny", "Ky", "Leo", "May", "Millia", "Pot", "Ram", "Sin", "Slayer", "Sol", "Venom", "Zato", "Dizzy", "Kum", "Raven"];

        $.getJSON("data.json", function(d) {
            var data = d.point;

            var options = {
                video: d.id,
                autoplay: true
            };
            var player = new Twitch.Player("tplayer", options);

            function pause() {
                player.removeEventListener(Twitch.Player.PLAY, pause);
                player.pause();
            }

            player.addEventListener(Twitch.Player.PLAY, pause);

            google.charts.load("current", {
                packages: ["timeline"]
            });
            google.charts.setOnLoadCallback(drawChart);

            function drawChart() {

                var container = document.getElementById('chart');
                var chart = new google.visualization.Timeline(container);
                var dataTable = new google.visualization.DataTable();
                var zoom;
                var time;
                var moveBarInt;
                var mousex = 0;
                var scrollx = 0;
                var isDragging = false;
                var isDown = false;
                var startTime;
                var endTime;

                function timestampToDate(timestamp) {
                    return new Date(0, 0, 0, parseInt(timestamp[0]), parseInt(timestamp[1]), parseInt(timestamp[2]));
                }

                function createRow(timestamp) {
                    return new Date(0, 0, 0, parseInt(timestamp[0]), parseInt(timestamp[1]), parseInt(timestamp[2]));
                }

                dataTable.addColumn('string', 'Player');
                dataTable.addColumn('string', 'Name');
                dataTable.addColumn('date', 'Start');
                dataTable.addColumn('date', 'End');

                var first1 = null;
                var first2 = null;
                var p1list = [];
                var p2list = [];
                for (var i = 0; i < data.length - 1; i++) {
                    if (first1 && first1.chara[0] !== data[i].chara[0]) {

                        if (startTime == null) {
                            startTime = parseInt(first1.timestamp[0]) * 60 * 60 + parseInt(first1.timestamp[1]) * 60 + parseInt(first1.timestamp[2]);
                        }
                        p1list.push(['Player 1', namelist[first1.chara[0]], timestampToDate(first1.timestamp), timestampToDate(data[i].timestamp)]);
                        endTime = parseInt(data[i].timestamp[0]) * 60 * 60 + parseInt(data[i].timestamp[1]) * 60 + parseInt(data[i].timestamp[2]);
                        if (data[i].chara[0] != null) first1 = data[i];
                        else first1 = null;
                    } else if (first1 == null && data[i].chara[0] != null) {
                        first1 = data[i];
                    }

                    if (first2 && first2.chara[1] !== data[i].chara[1]) {
                        if (startTime == null) {
                            startTime = parseInt(first2.timestamp[0]) * 60 * 60 + parseInt(first2.timestamp[1]) * 60 + parseInt(first2.timestamp[2]);
                        }
                        p2list.push(['Player 2', namelist[first2.chara[1]], timestampToDate(first2.timestamp), timestampToDate(data[i].timestamp)]);
                        endTime = parseInt(data[i].timestamp[0]) * 60 * 60 + parseInt(data[i].timestamp[1]) * 60 + parseInt(data[i].timestamp[2]);
                        if (data[i].chara[1] != null) first2 = data[i];
                        else first2 = null;
                    } else if (first2 == null && data[i].chara[1] != null) {
                        first2 = data[i];
                    }
                }
                if (first1) {
                    p1list.push(['Player 1', namelist[first1.chara[0]], timestampToDate(first1.timestamp), timestampToDate(data[data.length - 1].timestamp)]);
                    endTime = parseInt(data[data.length - 1].timestamp[0]) * 60 * 60 + parseInt(data[data.length - 1].timestamp[1]) * 60 + parseInt(data[data.length - 1].timestamp[2]);
                }
                if (first2) {
                    p2list.push(['Player 2', namelist[first2.chara[1]], timestampToDate(first2.timestamp), timestampToDate(data[data.length - 1].timestamp)]);
                    endTime = parseInt(data[data.length - 1].timestamp[0]) * 60 * 60 + parseInt(data[data.length - 1].timestamp[1]) * 60 + parseInt(data[data.length - 1].timestamp[2]);
                }

                for (var i = 0; i < p1list.length; i++) {
                    dataTable.addRow(p1list[i]);
                }
                for (var i = 0; i < p2list.length; i++) {
                    dataTable.addRow(p2list[i]);
                }

                time = parseInt(data[data.length - 1].timestamp[0]) * 60 * 60 + parseInt(data[data.length - 1].timestamp[1]) * 60 + parseInt(data[data.length - 1].timestamp[2]);
                zoom = time / ($("#container").width() - 75);

                //google.visualization.events.addListener(chart, 'ready', function() {
                    $("#container").mouseup(function() {
                    	if (isDown){
	                        isDown = false;
	                        if (!isDragging && (scrollx + mousex >= 75)) {
	                            var t = ((endTime - startTime) * (scrollx + mousex - 75) / (time / zoom) + startTime)
	                            player.seek(t);
	                            player.play();
	                        }
                    	}
                    })
                //})

                var options = {
                    height: 132,
                    width: time / zoom + 75
                };
                chart.draw(dataTable, options);

                function moveBar() {
                    var pxl = (player.getCurrentTime() - startTime) / (endTime - startTime) * (time / zoom) + 75;
                    if (pxl > 75) $("#bar").css("left", (player.getCurrentTime() - startTime) / (endTime - startTime) * (time / zoom) + 75 + "px");
                }
                player.addEventListener(Twitch.Player.PLAY, () => {
                    clearInterval(moveBarInt);
                    moveBar();
                    moveBarInt = setInterval(function() {
                        moveBar();
                    }, 1000)
                });
                player.addEventListener(Twitch.Player.PAUSE, () => {
                    clearInterval(moveBarInt);
                });
                player.addEventListener(Twitch.Player.ENDED, () => {
                    clearInterval(moveBarInt);
                });
                $(window).resize(function() {
                    if (time / (zoom) + 75 < $("#container").width()) {
                        zoom = time / ($("#container").width() - 75);
                        var options = {
                            height: 132,
                            width: time / zoom + 75
                        };
                        chart.clearChart();
                        chart.draw(dataTable, options);
                        moveBar();
                    }
                });
                $("#container").mousedown(function() {
                	if (!isDragging){
                        isDragging = false;
                        isDown = true;                		
                	} else {
                        isDragging = false;
                        isDown = false;                		
                	}                		
                })

                $(document).mouseup(function() {
                    isDragging = false;
                    //isDown = false;
                })
                $("#container").mousemove(function(e) {
                	if (isDown) isDragging = true;
                    var oldmousex = mousex;
                    mousex = e.pageX - this.offsetLeft;
                    if (isDown && mousex < $("#container").width()) {
                        $(this).scrollLeft($(this).scrollLeft() + oldmousex - mousex);
                    }
                });
                $("#container").scroll(function(e) {
                    scrollx = $(this).scrollLeft();
                });
                $("#container").on("mousewheel", function(e) {
                    e.preventDefault();
                    var prevZoom = zoom;

                    if (e.originalEvent.wheelDelta / 120 > 0) {
                        if (zoom / 2 > 1) zoom /= 2;
                        else zoom = 1;
                    } else {
                        if (time / (zoom * 2) + 75 < $("#container").width()) zoom = time / ($("#container").width() - 75);
                        else zoom *= 2;
                    }

                    var options = {
                        height: 132,
                        width: time / zoom + 75
                    };
                    chart.clearChart();
                    chart.draw(dataTable, options);
                    moveBar();
                    var realx = (scrollx + mousex - 75) * prevZoom;
                    $(this).scrollLeft(realx / zoom - mousex + 75);
                });
            }
        })
    })