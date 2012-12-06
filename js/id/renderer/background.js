iD.Background = function() {
    var tile = d3.geo.tile(),
        scaleExtent = [0, 20],
        projection,
        source = d3.functor('');

    // derive the tiles onscreen, remove those offscreen and position tiles
    // correctly for the currentstate of `projection`
    function background() {
        var tiles = tile
            .scale(projection.scale())
            .translate(projection.translate())(),
            z = Math.max(Math.log(projection.scale()) / Math.log(2) - 8, 0),
            rz = Math.max(scaleExtent[0], Math.min(scaleExtent[1], Math.floor(z))),
            ts = 256 * Math.pow(2, z - rz),
            tile_origin = [
                projection.scale() / 2 - projection.translate()[0],
                projection.scale() / 2 - projection.translate()[1]];

        tiles.forEach(function(t) { t.push(source(t)); });
        var image = this
            .selectAll("image")
            .data(tiles, function(d) { return d; });

        image.exit().remove();

        image.enter().append("image")
            .attr("xlink:href", function(d) { return d[3]; });

        image.attr('transform', function(d) {
            return 'translate(' +
                Math.round((d[0] * ts) - tile_origin[0]) + ',' +
                Math.round((d[1] * ts) - tile_origin[1]) + ')';
        })
        .attr("width", Math.ceil(ts))
        .attr("height", Math.ceil(ts));
    }

    background.projection = function(_) {
        if (!arguments.length) return projection;
        projection = _;
        return background;
    };

    background.size = function(_) {
        if (!arguments.length) return tile.size();
        tile.size(_);
        return background;
    };

    background.source = function(_) {
        if (!arguments.length) return source;
        source = _;
        return background;
    };

    background.scaleExtent = function(_) {
        if (!arguments.length) return tile.scaleExtent();
        tile.scaleExtent(_);
        return background;
    };

    return background;
};

iD.BackgroundSource = {};

// derive the url of a 'quadkey' style tile from a coordinate object
iD.BackgroundSource.template = function(template, subdomains) {
    return function(coord) {
        var u = '';
        for (var zoom = coord[2]; zoom > 0; zoom--) {
            var byte = 0;
            var mask = 1 << (zoom - 1);
            if ((coord[0] & mask) !== 0) byte++;
            if ((coord[1] & mask) !== 0) byte += 2;
            u += byte.toString();
        }
        // distribute requests against multiple domains
        var t = subdomains ?
            subdomains[coord[2] % subdomains.length] : '';
        return template
            .replace('{t}', t)
            .replace('{u}', u)
            .replace('{x}', coord[0])
            .replace('{y}', coord[1])
            .replace('{z}', coord[2]);
    };
};

iD.BackgroundSource.Bing = iD.BackgroundSource.template(
    'http://ecn.t{t}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&mkt=en-gb&n=z',
    [0, 1, 2, 3]);

iD.BackgroundSource.Tiger2012 = iD.BackgroundSource.template(
    'http://{t}.tile.openstreetmap.us/tiger2012_roads_expanded/{z}/{x}/{y}.png',
    ['a', 'b', 'c']);

iD.BackgroundSource.OSM = iD.BackgroundSource.template(
    'http://{t}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ['a', 'b', 'c']);
