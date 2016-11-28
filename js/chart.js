"use strict";
 
var data;
var temperatures = [];
var datetimes = [];

var ramstats = {
    used: [],
    free: [],
    shared: [],
    buffers: [],
    cached: []
};


function fillPanels() {
    $.get( "https://jeeliebeelie.ml/stats/uptime.php", (data)=> {
        $("#uptimePanel").text(data);
    });

    $.get( "https://jeeliebeelie.ml/stats/netstat.php", (data)=> {
       let stats = data.substring(18).split(' ').join('').split("|");

       let download = stats[0];
       let upload = stats[1];
       let total = stats[2];
       let averageSpeed = stats[3]
        
       $("#uploadPanel").text(upload.replace("GiB"," GB"));
       $("#downloadPanel").text(download.replace("GiB"," GB"));
       $("#totalPanel").text(total.replace("GiB","GB") +" total this month ");
       $("#averagePanel").text(averageSpeed + " Average speed");

    });

}
$(function() {
    fillPanels();

    $.ajax({
        url: "https://jeeliebeelie.ml/stats/templog.php"
    }).done(function(response) {
        data = response.split("\n");
        fillArrays();
        plotTemp();
            $("#fullmap").removeClass('loading');
        $("#tempPanel").append(temperatures[temperatures.length - 2 ] + " °C");
    });


    $("#ramGraph").addClass('loading');
    $.ajax({
        url: "https://jeeliebeelie.ml/stats/ramlog.php"
    }).done(function(response) {
        var total = 925;
        let times = [];
        let values = [];

        let entries = response.split("\n");

        entries.forEach((item)=>{
            if(item !== "") {
                let entry = item.split("|");

                times.push(entry[0]);

                let ramstat = entry[1].split(" ").join("").split("M");

                ramstats.used.push(ramstat[1]);
                ramstats.free.push(total - ramstat[3] - ramstat[4] - ramstat[5]);
                ramstats.shared.push(ramstat[3]);
                ramstats.buffers.push(ramstat[4]);
                ramstats.cached.push(ramstat[5]);
            }
        });

         plotRam(times);
        $("#ramGraph").removeClass('loading');
    });



    $.ajax({
        url: "https://jeeliebeelie.ml/stats/cpulog.php"
    }).done(function(response) {
        var cores = 4;
        var times = [];
        var cpulogs = [];
        var entries = response.split("\n");
        entries.forEach((item)=> {
            let entry = item.split("|");
            times.push(entry[0]);
            cpulogs.push(entry[1] /cores);// will return the average percent as the api return the total of all cores combined
        });

        plotCpu(times,cpulogs);
        $("#cpuGraph").removeClass('loading');
    });


});

var fillArrays =()=>{
    //last day
    data.splice(data.length - 2800).forEach((item)=>{
      let entry = item.split("|");
      datetimes.push(entry[0]);
      temperatures.push(entry[1]);
  });
};



var plotCpu =(times, data)=>{
    var TESTER = document.getElementById('cpuGraph');
    Plotly.plot( TESTER, [{
        x: times,
        y: data
    }], {
        displayLogo: false,
        scrollZoom: true,
        autosize: false,
        showLink: false,
        width: $(window).width() - 300,
        height: 500
    });
};



var plotTemp =()=>{
    var TESTER = document.getElementById('fullmap');
    Plotly.plot( TESTER, [{
        x: datetimes,
        y: temperatures,
        scrollZoom: true,
    }], {
        displayLogo: false,
        scrollZoom: true,
        autosize: false,
        showLink: false,
        width: $(window).width() - 300,
        height: 500
    });
};


var plotRam =(times)=>{
    /*used: [],
        free: [],
        shared: [],
        buffers: [],
        cached: []
    */
    var shared = {
        x: times,
        y: ramstats.shared,
        name: 'Shared',
        type: 'bar'
    };

    var buffers = {
        x: times,
        y: ramstats.buffers,
        name: 'Buffers',
        type: 'bar'
    };

    var cached = {
        x: times,
        y: ramstats.cached,
        name: 'Cached',
        type: 'bar'
    };

    var free = {
        x: times,
        y: ramstats.free,
        name: 'Free',
        type: 'bar'
    };

    var data = [shared, buffers, cached, free];
    var layout = {
        barmode : 'stack',
        displayLogo: false,
        scrollZoom: true,
        autosize: false,
        showLink: false,
        width: $(window).width() - 300,
        height: 500

    };
    Plotly.newPlot('ramGraph', data, layout);
};
