// =====================================================================
// Frank's Dithers Brew Lite  -  dither / halftone / CMYK-plate tool for Photoshop
//
// INSTALL (no plugin needed):
//   * Drag this .jsx file onto the Photoshop window, OR
//   * File > Scripts > Browse...  and pick the file, OR
//   * Copy it into  Photoshop/Presets/Scripts/  and restart Photoshop;
//     it then lives in File > Scripts for the whole team.
//
// WHAT IT DOES
//   Works on a flattened copy of your document, so your artwork is never
//   changed. Results land in a new layer group of transparent-paper ink
//   layers (named by hex code) that you can recolour, hide or export.
// =====================================================================
#target photoshop

(function () {

    if (app.documents.length === 0) {
        alert("Open an image or artwork in Photoshop first, then run Frank's Dithers Brew Lite again.");
        return;
    }

    var PREV = 400;                       // preview box size (px)
    var origDoc = app.activeDocument;
    var origDialogs = app.displayDialogs;
    var temps = [];                       // every temp document we open
    var tmpFiles = [];                    // every temp file we write
    var stamp = (new Date()).getTime();
    var counter = 0;
    var warnedFallback = false;

    // =================================================================
    // CORE  -  pure JavaScript pixel algorithms (no Photoshop calls).
    // Input: flat array of 0..255 grey values.  Output: array of 0 / 255
    // where 0 = ink (black dot) and 255 = paper.
    // =================================================================
    //#region CORE
    var KERNELS = {
        fs:  { d: 16, k: [[1,0,7],[-1,1,3],[0,1,5],[1,1,1]] },
        atk: { d: 8,  k: [[1,0,1],[2,0,1],[-1,1,1],[0,1,1],[1,1,1],[0,2,1]] },
        jjn: { d: 48, k: [[1,0,7],[2,0,5],[-2,1,3],[-1,1,5],[0,1,7],[1,1,5],[2,1,3],[-2,2,1],[-1,2,3],[0,2,5],[1,2,3],[2,2,1]] },
        stu: { d: 42, k: [[1,0,8],[2,0,4],[-2,1,2],[-1,1,4],[0,1,8],[1,1,4],[2,1,2],[-2,2,1],[-1,2,2],[0,2,4],[1,2,2],[2,2,1]] },
        bur: { d: 32, k: [[1,0,8],[2,0,4],[-2,1,2],[-1,1,4],[0,1,8],[1,1,4],[2,1,2]] },
        sl:  { d: 4,  k: [[1,0,2],[-1,1,1],[0,1,1]] }
    };

    function bayerMatrix(n) {
        var m = [[0]], s = 1, x, y, nm, add;
        while (s < n) {
            nm = [];
            for (y = 0; y < s * 2; y++) {
                nm[y] = [];
                for (x = 0; x < s * 2; x++) {
                    add = (y < s) ? ((x < s) ? 0 : 2) : ((x < s) ? 3 : 1);
                    nm[y][x] = m[y % s][x % s] * 4 + add;
                }
            }
            m = nm; s *= 2;
        }
        return m;
    }

    // serpentine error diffusion
    function diffuse(px, w, h, K, div) {
        var n = w * h, buf = new Array(n), out = new Array(n), i, k;
        var kl = K.length;
        for (i = 0; i < n; i++) buf[i] = px[i];
        for (var y = 0; y < h; y++) {
            var rev = (y & 1) === 1;
            var x0 = rev ? w - 1 : 0, x1 = rev ? -1 : w, st = rev ? -1 : 1;
            for (var x = x0; x !== x1; x += st) {
                var idx = y * w + x, old = buf[idx];
                var nv = old < 128 ? 0 : 255;
                out[idx] = nv;
                var err = (old - nv) / div;
                for (k = 0; k < kl; k++) {
                    var kk = K[k];
                    var nx = x + (rev ? -kk[0] : kk[0]), ny = y + kk[1];
                    if (nx >= 0 && nx < w && ny < h) buf[ny * w + nx] += err * kk[2];
                }
            }
        }
        return out;
    }

    function ditherPixels(px, w, h, algo, ox, oy) {
        var n = w * h, out = new Array(n), i, x, y;
        ox = ox || 0; oy = oy || 0;

        if (algo.t === "ed") {
            var K = KERNELS[algo.k];
            return diffuse(px, w, h, K.k, K.d);
        }
        if (algo.t === "ord") {
            var M = bayerMatrix(algo.n), sz = algo.n, tot = sz * sz;
            for (y = 0; y < h; y++) {
                var row = M[(y + oy) % sz];
                for (x = 0; x < w; x++) {
                    i = y * w + x;
                    out[i] = (px[i] >= (row[(x + ox) % sz] + 0.5) / tot * 255) ? 255 : 0;
                }
            }
            return out;
        }
        if (algo.t === "ign") {      // interleaved gradient noise (stochastic)
            for (y = 0; y < h; y++) {
                for (x = 0; x < w; x++) {
                    i = y * w + x;
                    var f = 0.06711056 * (x + ox) + 0.00583715 * (y + oy);
                    f -= Math.floor(f);
                    var r = 52.9829189 * f;
                    r -= Math.floor(r);
                    out[i] = (px[i] >= r * 255) ? 255 : 0;
                }
            }
            return out;
        }
        if (algo.t === "rnd") {      // seeded white noise
            var seed = 12345 + ox * 977 + oy * 131;
            for (i = 0; i < n; i++) {
                seed = (seed * 1664525 + 1013904223) % 4294967296;
                out[i] = (px[i] >= (seed / 4294967296) * 255) ? 255 : 0;
            }
            return out;
        }
        for (i = 0; i < n; i++) out[i] = px[i] < 128 ? 0 : 255;   // hard threshold
        return out;
    }
    //#endregion CORE

    // =================================================================
    // ALGORITHM + PRESET TABLES
    // t: ht = Photoshop halftone screen (real LPI + angle)
    //    ed / ord / ign / rnd / thr = custom pixel engines (above)
    //    nat = Photoshop's own Bitmap dither (fast, no script loop)
    // =================================================================
    var ALGOS = [
        { id: "ht_round",   name: "Halftone - Round Dot",           t: "ht", shape: "ROUND" },
        { id: "ht_ellipse", name: "Halftone - Ellipse",             t: "ht", shape: "ELLIPSE" },
        { id: "ht_diamond", name: "Halftone - Diamond",             t: "ht", shape: "DIAMOND" },
        { id: "ht_line",    name: "Halftone - Line",                t: "ht", shape: "LINE" },
        { id: "ht_cross",   name: "Halftone - Cross",               t: "ht", shape: "CROSS" },
        { id: "ht_square",  name: "Halftone - Square",              t: "ht", shape: "SQUARE" },
        { id: "fs",   name: "Dither - Floyd-Steinberg",             t: "ed",  k: "fs" },
        { id: "atk",  name: "Dither - Atkinson (classic Mac)",      t: "ed",  k: "atk" },
        { id: "jjn",  name: "Dither - Jarvis-Judice-Ninke",         t: "ed",  k: "jjn" },
        { id: "stu",  name: "Dither - Stucki",                      t: "ed",  k: "stu" },
        { id: "bur",  name: "Dither - Burkes",                      t: "ed",  k: "bur" },
        { id: "sl",   name: "Dither - Sierra Lite",                 t: "ed",  k: "sl" },
        { id: "b2",   name: "Dither - Bayer 2x2 (ordered)",         t: "ord", n: 2 },
        { id: "b4",   name: "Dither - Bayer 4x4 (ordered)",         t: "ord", n: 4 },
        { id: "b8",   name: "Dither - Bayer 8x8 (ordered)",         t: "ord", n: 8 },
        { id: "ign",  name: "Dither - Gradient Noise (stochastic)", t: "ign" },
        { id: "rnd",  name: "Dither - White Noise (grain)",         t: "rnd" },
        { id: "thr",  name: "Dither - Hard Threshold",              t: "thr" },
        { id: "pdiff", name: "Photoshop Diffusion (fast native)",   t: "nat", m: "DIFFUSIONDITHER" },
        { id: "ppat",  name: "Photoshop Pattern (fast native)",     t: "nat", m: "PATTERNDITHER" }
    ];

    function algoIndex(id) {
        for (var i = 0; i < ALGOS.length; i++) if (ALGOS[i].id === id) return i;
        return 0;
    }

    var PRESETS = [
        { name: "Presets...", none: true },
        { name: "Newsprint 45 deg / 35 LPI",   a: "ht_round", mode: "mono", lpi: 35, ang: 45, pix: 1, b: 0, c: 10, wc: 255 },
        { name: "Coarse screen print / 25 LPI", a: "ht_round", mode: "mono", lpi: 25, ang: 45, pix: 1, b: 0, c: 20, wc: 245 },
        { name: "Line screen 0 deg / 30 LPI",   a: "ht_line",  mode: "mono", lpi: 30, ang: 0,  pix: 1, b: 0, c: 10, wc: 255 },
        { name: "DTF soft edge / 45 LPI",       a: "ht_round", mode: "mono", lpi: 45, ang: 45, pix: 1, b: 0, c: 0,  wc: 235 },
        { name: "CMYK rosette / 55 LPI",        a: "ht_round", mode: "cmyk", lpi: 55, ang: 45, pix: 1, b: 0, c: 0,  wc: 255 },
        { name: "1-bit Mac (Atkinson, 2 px)",   a: "atk",      mode: "mono", lpi: 35, ang: 45, pix: 2, b: 0, c: 15, wc: 255 },
        { name: "Riso grain (noise, 2 px)",     a: "ign",      mode: "mono", lpi: 35, ang: 45, pix: 2, b: 0, c: 10, wc: 255 },
        { name: "Retro Bayer 4x4 (3 px)",       a: "b4",       mode: "mono", lpi: 35, ang: 45, pix: 3, b: 0, c: 0,  wc: 255 },
        { name: "Fine stipple (Floyd-Steinberg)", a: "fs",     mode: "mono", lpi: 35, ang: 45, pix: 1, b: 0, c: 0,  wc: 255 },
        { name: "RGB split dither (Bayer 4x4)", a: "b4",       mode: "rgb",  lpi: 35, ang: 45, pix: 2, b: 0, c: 0,  wc: 255 }
    ];

    // =================================================================
    // SMALL HELPERS
    // =================================================================
    function num(s, fallback) { var v = parseFloat(s); return isNaN(v) ? fallback : v; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function px(n) { return UnitValue(Math.round(n), "px"); }
    function hex2(n) { var s = Math.round(n).toString(16).toUpperCase(); return s.length < 2 ? "0" + s : s; }
    function toHex(rgb) { return "#" + hex2(rgb[0]) + hex2(rgb[1]) + hex2(rgb[2]); }
    function solid(rgb) {
        var c = new SolidColor();
        c.rgb.red = rgb[0]; c.rgb.green = rgb[1]; c.rgb.blue = rgb[2];
        return c;
    }
    function track(d) { temps.push(d); return d; }
    function closeTemps() {
        for (var i = 0; i < temps.length; i++) {
            try { temps[i].close(SaveOptions.DONOTSAVECHANGES); } catch (e) { }
        }
        temps = [];
        try { app.activeDocument = origDoc; } catch (e2) { }
    }
    function removeFile(f) { try { if (f && f.exists) f.remove(); } catch (e) { } }

    // =================================================================
    // PLATES (what gets dithered, and in which ink)
    // =================================================================
    function platesFor(P) {
        if (P.mode === "cmyk") {
            // listed bottom -> top so Black ends up on top
            return [
                { name: "Yellow",  rgb: [255, 242, 0],  ch: 2, ang: P.pa[2], blend: BlendMode.MULTIPLY, add: false },
                { name: "Magenta", rgb: [236, 0, 140],  ch: 1, ang: P.pa[1], blend: BlendMode.MULTIPLY, add: false },
                { name: "Cyan",    rgb: [0, 174, 239],  ch: 0, ang: P.pa[0], blend: BlendMode.MULTIPLY, add: false },
                { name: "Black",   rgb: [0, 0, 0],      ch: 3, ang: P.pa[3], blend: BlendMode.MULTIPLY, add: false }
            ];
        }
        if (P.mode === "rgb") {
            return [
                { name: "Red",   rgb: [255, 0, 0], ch: 0, ang: P.pa[0], blend: BlendMode.LINEARDODGE, add: true },
                { name: "Green", rgb: [0, 255, 0], ch: 1, ang: P.pa[1], blend: BlendMode.LINEARDODGE, add: true },
                { name: "Blue",  rgb: [0, 0, 255], ch: 2, ang: P.pa[2], blend: BlendMode.LINEARDODGE, add: true }
            ];
        }
        return [{ name: "Ink", rgb: P.ink, ch: -1, ang: P.angle, blend: BlendMode.NORMAL, add: false }];
    }

    // =================================================================
    // PHOTOSHOP PIPELINE
    // =================================================================
    function extractChannel(tmp, idx, w, h, res) {
        var g = track(app.documents.add(px(w), px(h), res, "DT_plane", NewDocumentMode.GRAYSCALE, DocumentFill.WHITE));
        app.activeDocument = tmp;
        tmp.activeChannels = [tmp.channels[idx]];
        tmp.selection.selectAll();
        tmp.selection.copy();
        app.activeDocument = g;
        g.paste();
        g.flatten();
        return g;
    }

    // Flattened working copy -> one grey document per plate
    function buildPlanes(P, spec) {
        var tmp = track(origDoc.duplicate("DT_tmp", true));
        app.activeDocument = tmp;
        try { tmp.selection.deselect(); } catch (e0) { }
        if (tmp.bitsPerChannel !== BitsPerChannelType.EIGHT) tmp.bitsPerChannel = BitsPerChannelType.EIGHT;
        try { tmp.flatten(); } catch (e1) { }
        if (tmp.mode !== DocumentMode.RGB) tmp.changeMode(ChangeMode.RGB);

        var W = tmp.width.as("px"), H = tmp.height.as("px"), res = tmp.resolution;

        if (spec.kind === "detail") {
            var cw = Math.min(W, PREV), ch = Math.min(H, PREV);
            var l = Math.round((W - cw) / 2), t = Math.round((H - ch) / 2);
            tmp.crop([px(l), px(t), px(l + cw), px(t + ch)]);
        } else if (spec.kind === "whole" && spec.s < 1) {
            tmp.resizeImage(px(Math.max(1, W * spec.s)), px(Math.max(1, H * spec.s)), Math.max(1, res * spec.s), ResampleMethod.BICUBICSHARPER);
        }
        W = tmp.width.as("px"); H = tmp.height.as("px"); res = tmp.resolution;

        var plates = platesFor(P);
        var planes = [];
        if (P.mode === "mono") {
            tmp.changeMode(ChangeMode.GRAYSCALE);
            planes.push({ doc: tmp, plate: plates[0] });
            return planes;
        }
        if (P.mode === "cmyk") tmp.changeMode(ChangeMode.CMYK);
        for (var i = 0; i < plates.length; i++) {
            planes.push({ doc: extractChannel(tmp, plates[i].ch, W, H, res), plate: plates[i] });
        }
        try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) { }
        return planes;
    }

    function bitmapConvert(g, method, shapeName, lpi, ang) {
        var o = new BitmapConversionOptions();
        o.method = BitmapConversionType[method];
        o.resolution = Math.max(1, Math.round(g.resolution));
        if (method === "HALFTONESCREEN") {
            o.frequency = lpi;
            o.angle = ang;
            o.shape = BitmapHalfToneType[shapeName]; // DOM enum is HalfTone (capital T)
        }
        g.changeMode(ChangeMode.BITMAP, o);
        g.changeMode(ChangeMode.GRAYSCALE);
    }

    // Round-trips the grey image through a headerless .raw file so the pure-JS
    // algorithms can see every pixel. Returns the new (dithered) document.
    function runPixelEngine(g, algo, plateIdx) {
        var w = Math.round(g.width.as("px")), h = Math.round(g.height.as("px"));
        var res = g.resolution;
        var inF = new File(Folder.temp + "/dt_in_" + stamp + "_" + (counter++) + ".raw");
        var outF = new File(Folder.temp + "/dt_out_" + stamp + "_" + (counter++) + ".raw");
        tmpFiles.push(inF); tmpFiles.push(outF);

        g.saveAs(inF, new RawSaveOptions(), true, Extension.LOWERCASE);
        inF.encoding = "BINARY";
        inF.open("r");
        var s = inF.read();
        inF.close();
        if (s.length !== w * h) throw new Error("raw size mismatch (" + s.length + " vs " + (w * h) + ")");

        var arr = new Array(w * h), i;
        for (i = 0; i < arr.length; i++) arr[i] = s.charCodeAt(i);
        s = null;

        var outArr = ditherPixels(arr, w, h, algo, plateIdx * 3, plateIdx * 5);
        arr = null;

        outF.encoding = "BINARY";
        outF.lineFeed = "unix";
        outF.open("w");
        var CH = 4096;
        for (i = 0; i < outArr.length; i += CH) {
            outF.write(String.fromCharCode.apply(null, outArr.slice(i, i + CH)));
        }
        outF.close();
        outArr = null;

        var ro = new RawFormatOpenOptions();
        ro.width = w; ro.height = h;
        ro.channelNumber = 1;
        ro.bitsPerChannel = 8;
        ro.headerSize = 0;
        ro.interleaveChannels = true;
        ro.retainHeader = false;
        ro.byteOrder = ByteOrder.IBM;
        var nd = track(app.open(outF, ro));
        try { nd.resizeImage(null, null, res, ResampleMethod.NONE); } catch (e) { }
        try { g.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) { }
        app.activeDocument = nd;
        return nd;
    }

    // One grey plane in -> black/white mask document out (0 = ink)
    function processPlane(g, P, plate, spec, plateIdx) {
        app.activeDocument = g;
        var baseW = Math.round(g.width.as("px")), baseH = Math.round(g.height.as("px"));
        var L = g.activeLayer;
        var algo = ALGOS[P.algo];

        if (P.mode === "rgb") L.invert();                       // ink where the channel is bright
        if (P.bright !== 0 || P.contrast !== 0) L.adjustBrightnessContrast(P.bright, P.contrast);
        if (P.whiteCut < 255) L.adjustLevels(0, P.whiteCut, 1.0, 0, 255);
        if (P.invert) L.invert();

        if (algo.t === "ht") {
            bitmapConvert(g, "HALFTONESCREEN", algo.shape, P.lpi, plate.ang);
        } else {
            var psEff = P.pix * spec.s;
            if (psEff > 1.01) {
                g.resizeImage(px(Math.max(2, baseW / psEff)), px(Math.max(2, baseH / psEff)), null, ResampleMethod.BICUBICSHARPER);
            }
            if (algo.t === "nat") {
                bitmapConvert(g, algo.m, null, 0, 0);
            } else {
                try {
                    g = runPixelEngine(g, algo, plateIdx);
                } catch (err) {
                    if (!warnedFallback) {
                        warnedFallback = true;
                        $.writeln("Frank's Brew: pixel engine failed (" + err.message + "), using Photoshop native dither.");
                    }
                    app.activeDocument = g;
                    if (g.mode !== DocumentMode.GRAYSCALE) g.changeMode(ChangeMode.GRAYSCALE);
                    bitmapConvert(g, algo.t === "ed" ? "DIFFUSIONDITHER" : (algo.t === "thr" ? "THRESHOLD" : "PATTERNDITHER"), null, 0, 0);
                }
            }
        }
        app.activeDocument = g;
        if (g.mode !== DocumentMode.GRAYSCALE) g.changeMode(ChangeMode.GRAYSCALE);
        if (Math.round(g.width.as("px")) !== baseW || Math.round(g.height.as("px")) !== baseH) {
            g.resizeImage(px(baseW), px(baseH), null, ResampleMethod.NEARESTNEIGHBOR);
        }
        return g;
    }

    function renderMasks(P, spec, tick) {
        var planes = buildPlanes(P, spec);
        var masks = [];
        for (var i = 0; i < planes.length; i++) {
            if (tick) tick(i, planes.length, planes[i].plate.name);
            masks.push({ doc: processPlane(planes[i].doc, P, planes[i].plate, spec, i), plate: planes[i].plate });
        }
        return masks;
    }

    // Colour the masks and merge them into one PNG for the preview pane
    function compositeToPng(masks, P, file) {
        var i, d, base = null;
        for (i = 0; i < masks.length; i++) {
            d = masks[i].doc;
            app.activeDocument = d;
            d.changeMode(ChangeMode.RGB);
            if (masks[i].plate.add) d.activeLayer.invert();
            var L = d.artLayers.add();
            d.selection.selectAll();
            d.selection.fill(solid(masks[i].plate.rgb));
            d.selection.deselect();
            L.blendMode = masks[i].plate.add ? BlendMode.MULTIPLY : BlendMode.LIGHTEN;
            d.flatten();
            if (i === 0) {
                base = d;
            } else {
                d.selection.selectAll();
                d.selection.copy();
                app.activeDocument = base;
                base.paste();
                base.activeLayer.blendMode = masks[i].plate.blend;
            }
        }
        app.activeDocument = base;
        base.flatten();
        var po = new PNGSaveOptions();
        base.saveAs(file, po, true, Extension.LOWERCASE);
    }

    // =================================================================
    // COMMIT: write ink layers into the real document (one undo step)
    // =================================================================
    $.global.__DT_commit = function () {
        var C = $.global.__DT, doc = C.doc, P = C.P, masks = C.masks, i;
        try {
            if (P.hideSrc) {
                for (i = 0; i < doc.layers.length; i++) { try { doc.layers[i].visible = false; } catch (eh) { } }
            }
            var group = doc.layerSets.add();
            group.name = "Frank's Brew - " + ALGOS[P.algo].name + (ALGOS[P.algo].t === "ht" ? " @ " + P.lpi + " LPI" : "");

            if (P.mode === "rgb" || P.paper) {
                var pl = doc.artLayers.add();
                pl.name = P.mode === "rgb" ? "Paper (black)" : "Paper (white)";
                doc.selection.selectAll();
                doc.selection.fill(solid(P.mode === "rgb" ? [0, 0, 0] : [255, 255, 255]));
                doc.selection.deselect();
                pl.move(group, ElementPlacement.INSIDE);
            }

            for (i = 0; i < masks.length; i++) {
                var plate = masks[i].plate;
                // PS 28: the channel's own doc must be frontmost to duplicate it (found in Photoshop test)
                app.activeDocument = masks[i].doc;
                var ch = masks[i].doc.channels[0].duplicate(doc);
                app.activeDocument = doc;
                ch.name = "dt_mask_tmp";
                doc.selection.load(ch, SelectionType.REPLACE, true);     // inverted: black dots = selected
                if (C.selCh) { try { doc.selection.load(C.selCh, SelectionType.INTERSECT); } catch (es) { } }
                var layer = doc.artLayers.add();
                layer.name = (P.mode === "mono") ? ("Ink " + toHex(plate.rgb)) :
                             (plate.name + (ALGOS[P.algo].t === "ht" ? " " + Math.round(plate.ang) + "°" : "") + " " + toHex(plate.rgb));
                layer.blendMode = plate.blend;
                try { doc.selection.fill(solid(plate.rgb), ColorBlendMode.NORMAL, 100, false); } catch (ef) { }
                doc.selection.deselect();
                ch.remove();
                layer.move(group, ElementPlacement.INSIDE);
            }
            doc.activeLayer = group;
        } catch (err) {
            C.err = err;
        }
    };

    function applyToDocument(P) {
        var algo = ALGOS[P.algo];
        var W = origDoc.width.as("px"), H = origDoc.height.as("px");
        if (algo.t !== "ht" && algo.t !== "nat") {
            var work = (W * H) / Math.pow(Math.max(1, P.pix), 2) * (P.mode === "cmyk" ? 4 : (P.mode === "rgb" ? 3 : 1));
            if (work > 6000000) {
                if (!confirm("This runs the dither algorithm in script over about " + Math.round(work / 1000000) +
                    " million pixels. That can take several minutes.\n\nTip: raise 'Dot / pixel size' to make it much faster.\n\nContinue?")) return;
            }
        }

        var pw = null;
        try {
            pw = new Window("palette", "Frank's Brew - Rendering");
            pw.margins = 16;
            pw.msg = pw.add("statictext", undefined, "Preparing...");
            pw.msg.preferredSize.width = 300;
            pw.show(); pw.update();
        } catch (e0) { pw = null; }

        var hadSel = false, selCh = null;
        try {
            try { origDoc.selection.bounds; hadSel = true; } catch (e1) { hadSel = false; }
            if (hadSel) {
                selCh = origDoc.channels.add();
                selCh.name = "dt_sel_tmp";
                origDoc.selection.store(selCh);
            }

            var masks = renderMasks(P, { kind: "full", s: 1 }, function (i, n, name) {
                if (pw) { pw.msg.text = "Rendering plate " + (i + 1) + " of " + n + " (" + name + ")..."; pw.update(); }
            });
            if (pw) { pw.msg.text = "Writing layers..."; pw.update(); }

            app.activeDocument = origDoc;
            $.global.__DT = { doc: origDoc, P: P, masks: masks, selCh: selCh, err: null };
            origDoc.suspendHistory("Frank's Brew", "__DT_commit()");
            var commitErr = $.global.__DT.err;

            if (hadSel) {
                try { origDoc.selection.load(selCh); } catch (e2) { }
                try { selCh.remove(); } catch (e3) { }
            } else {
                try { origDoc.selection.deselect(); } catch (e4) { }
            }
            if (commitErr) throw commitErr;
        } finally {
            closeTemps();
            try { delete $.global.__DT; } catch (e5) { }
            if (pw) { try { pw.close(); } catch (e6) { } }
        }
    }

    // =================================================================
    // DIALOG
    // =================================================================
    var dlg = new Window("dialog", "Frank's Dithers Brew Lite");
    dlg.orientation = "row";
    dlg.alignChildren = ["fill", "top"];
    dlg.margins = 14;
    dlg.spacing = 14;

    var left = dlg.add("group");
    left.orientation = "column";
    left.alignChildren = ["fill", "top"];
    left.spacing = 8;
    left.preferredSize.width = 330;

    var right = dlg.add("group");
    right.orientation = "column";
    right.alignChildren = ["center", "top"];

    // --- Preset + engine -------------------------------------------------
    var pnlA = left.add("panel", undefined, "1. Look");
    pnlA.orientation = "column"; pnlA.alignChildren = ["fill", "top"]; pnlA.margins = [10, 14, 10, 10]; pnlA.spacing = 6;

    var presetNames = [], i0;
    for (i0 = 0; i0 < PRESETS.length; i0++) presetNames.push(PRESETS[i0].name);
    var ddlPreset = pnlA.add("dropdownlist", undefined, presetNames);
    ddlPreset.selection = 0;

    var algoNames = [];
    for (i0 = 0; i0 < ALGOS.length; i0++) algoNames.push(ALGOS[i0].name);
    var ddlAlgo = pnlA.add("dropdownlist", undefined, algoNames);
    ddlAlgo.selection = 0;

    var grpMode = pnlA.add("group");
    grpMode.add("statictext", undefined, "Colour mode:");
    var ddlMode = grpMode.add("dropdownlist", undefined, ["Single ink", "CMYK plates", "RGB channels"]);
    ddlMode.selection = 0;

    // --- Controls --------------------------------------------------------
    var pnlC = left.add("panel", undefined, "2. Controls");
    pnlC.orientation = "column"; pnlC.alignChildren = ["fill", "top"]; pnlC.margins = [10, 14, 10, 10]; pnlC.spacing = 6;

    function makeRow(parent, label, lo, hi, val, suffix) {
        var g = parent.add("group");
        g.orientation = "row"; g.alignChildren = ["left", "center"]; g.spacing = 6;
        var lb = g.add("statictext", undefined, label);
        lb.preferredSize.width = 92;
        var sl = g.add("slider", undefined, val, lo, hi);
        sl.preferredSize.width = 130;
        var tx = g.add("edittext", undefined, String(val));
        tx.preferredSize.width = 44;
        return { grp: g, lbl: lb, sld: sl, txt: tx, lo: lo, hi: hi };
    }

    var rLpi   = makeRow(pnlC, "Screen (LPI)",   5, 120, 35, "");
    var rAngle = makeRow(pnlC, "Angle (deg)",    0, 90,  45, "");
    var rPix   = makeRow(pnlC, "Dot / pixel px", 1, 12,  1,  "");
    var rBr    = makeRow(pnlC, "Brightness",    -100, 100, 0, "");
    var rCo    = makeRow(pnlC, "Contrast",      -100, 100, 0, "");
    var rWc    = makeRow(pnlC, "Highlight cut", 128, 255, 255, "");

    var grpPa = pnlC.add("group");
    grpPa.orientation = "row"; grpPa.alignChildren = ["left", "center"]; grpPa.spacing = 4;
    var lblPaTitle = grpPa.add("statictext", undefined, "Plate angles:");
    lblPaTitle.preferredSize.width = 78;
    var paLbl = [], paTxt = [], paDefault = [15, 75, 0, 45], paNames = ["C", "M", "Y", "K"], k0;
    for (k0 = 0; k0 < 4; k0++) {
        paLbl[k0] = grpPa.add("statictext", undefined, paNames[k0]);
        paTxt[k0] = grpPa.add("edittext", undefined, String(paDefault[k0]));
        paTxt[k0].preferredSize.width = 34;
    }

    var grpInk = pnlC.add("group");
    grpInk.orientation = "row"; grpInk.alignChildren = ["left", "center"];
    var btnInk = grpInk.add("button", undefined, "Ink colour...");
    var inkRGB = [0, 0, 0];
    var lblInk = grpInk.add("statictext", undefined, "#000000  (single-ink mode)");
    lblInk.preferredSize.width = 170;

    var chkInvert = pnlC.add("checkbox", undefined, "Invert tones (ink on the lights)");
    var chkHide   = pnlC.add("checkbox", undefined, "Hide source artwork after applying");
    chkHide.value = true;
    var chkPaper  = pnlC.add("checkbox", undefined, "Add a white paper layer");

    // --- Preview controls ------------------------------------------------
    var pnlP = left.add("panel", undefined, "3. Preview");
    pnlP.orientation = "column"; pnlP.alignChildren = ["fill", "top"]; pnlP.margins = [10, 14, 10, 10]; pnlP.spacing = 6;
    var ddlPrev = pnlP.add("dropdownlist", undefined, ["Detail 1:1 (centre crop) - true dot size", "Whole image (scaled down, approximate)"]);
    ddlPrev.selection = 0;
    var grpAuto = pnlP.add("group");
    var chkAuto = grpAuto.add("checkbox", undefined, "Auto-update");
    chkAuto.value = true;
    var btnPrev = grpAuto.add("button", undefined, "Update preview");

    var lblStatus = left.add("statictext", undefined, "", { multiline: true });
    lblStatus.preferredSize = [330, 62];

    var grpBtn = left.add("group");
    grpBtn.alignment = "right";
    var btnCancel = grpBtn.add("button", undefined, "Cancel", { name: "cancel" });
    var btnOk = grpBtn.add("button", undefined, "Apply to document", { name: "ok" });

    // --- Preview pane ----------------------------------------------------
    var grpPrev = right.add("group");
    grpPrev.preferredSize = [PREV, PREV];
    var previewImg = null;
    try {
        previewImg = grpPrev.add("image", [0, 0, PREV, PREV], undefined);
    } catch (eImg) {
        previewImg = null;
        grpPrev.add("statictext", undefined, "(Preview pane not supported on this Photoshop build.\nApply still works.)", { multiline: true });
    }
    right.add("statictext", undefined, "Preview shows ink on white paper. Final layers use transparent paper.");

    // =================================================================
    // DIALOG LOGIC
    // =================================================================
    var busy = false;

    function setStatus(t) { lblStatus.text = t; }

    function readParams() {
        var mi = ddlMode.selection ? ddlMode.selection.index : 0;
        var pa = [], k;
        for (k = 0; k < 4; k++) pa.push(num(paTxt[k].text, paDefault[k]));
        return {
            algo: ddlAlgo.selection ? ddlAlgo.selection.index : 0,
            mode: ["mono", "cmyk", "rgb"][mi],
            lpi: clamp(num(rLpi.txt.text, 35), 5, 120),
            angle: clamp(num(rAngle.txt.text, 45), -180, 180),
            pa: pa,
            pix: clamp(Math.round(num(rPix.txt.text, 1)), 1, 12),
            bright: clamp(Math.round(num(rBr.txt.text, 0)), -100, 100),
            contrast: clamp(Math.round(num(rCo.txt.text, 0)), -100, 100),
            whiteCut: clamp(Math.round(num(rWc.txt.text, 255)), 128, 255),
            invert: chkInvert.value,
            ink: inkRGB,
            hideSrc: chkHide.value,
            paper: chkPaper.value,
            prevKind: (ddlPrev.selection && ddlPrev.selection.index === 1) ? "whole" : "detail"
        };
    }

    function updateEnabled() {
        var a = ALGOS[ddlAlgo.selection.index], mode = ddlMode.selection.index;
        var isHt = a.t === "ht";
        rLpi.grp.enabled = isHt;
        rAngle.grp.enabled = isHt && mode === 0;
        rPix.grp.enabled = !isHt;
        grpPa.enabled = isHt && mode !== 0;
        btnInk.enabled = (mode === 0);
        var names = mode === 2 ? ["R", "G", "B", "-"] : ["C", "M", "Y", "K"], k;
        for (k = 0; k < 4; k++) paLbl[k].text = names[k];
    }

    function updateStatus() {
        var P = readParams(), a = ALGOS[P.algo], dpi = origDoc.resolution, msgs = [];
        if (a.t === "ht") {
            var pitch = 25.4 / P.lpi, cellPx = dpi / P.lpi;
            msgs.push(P.lpi + " LPI: cell " + pitch.toFixed(2) + " mm (" + cellPx.toFixed(1) + " px). 5% highlight dot is about " + (pitch * 0.2523).toFixed(2) + " mm.");
            if (cellPx < 6) msgs.push("WARNING: cells under 6 px look rough. Use a higher PPI or lower LPI.");
            if (pitch * 0.2523 < 0.5) msgs.push("Tip: dots under 0.5 mm may not hold on DTF film. Lower 'Highlight cut' to drop them.");
        } else {
            var mm = 25.4 / dpi * P.pix;
            msgs.push("Dot size " + P.pix + " px = " + mm.toFixed(2) + " mm at " + Math.round(dpi) + " PPI.");
            if (mm < 0.5) msgs.push("Tip: dots under 0.5 mm may not hold on DTF film. Raise dot size.");
        }
        if (dpi < 300) msgs.push("Document is " + Math.round(dpi) + " PPI (300+ recommended for print/DTF).");
        setStatus(msgs.join("\n"));
    }

    function showPreview(file) {
        if (!previewImg) return;
        try { previewImg.image = file; } catch (e) { }
        try { dlg.layout.layout(true); } catch (e2) { }
    }

    function doPreview() {
        if (busy) return;
        busy = true;
        var savedText = lblStatus.text;
        try {
            setStatus("Rendering preview...");
            try { dlg.update(); } catch (eu) { }
            var P = readParams();
            var W = origDoc.width.as("px"), H = origDoc.height.as("px");
            var spec = (P.prevKind === "detail") ? { kind: "detail", s: 1 } : { kind: "whole", s: Math.min(1, PREV / Math.max(W, H)) };
            var file = new File(Folder.temp + "/dt_prev_" + stamp + "_" + (counter++) + ".png");
            tmpFiles.push(file);
            var masks = renderMasks(P, spec, null);
            compositeToPng(masks, P, file);
            closeTemps();
            showPreview(file);
            updateStatus();
        } catch (e) {
            closeTemps();
            setStatus("Preview failed: " + e.message + (e.line ? " (line " + e.line + ")" : ""));
        }
        busy = false;
    }

    function schedule() { if (chkAuto.value) doPreview(); }

    function bindRow(r, isHtOnly) {
        r.sld.onChanging = function () { r.txt.text = String(Math.round(r.sld.value)); };
        r.sld.onChange = function () { r.txt.text = String(Math.round(r.sld.value)); updateStatus(); schedule(); };
        r.txt.onChange = function () {
            var v = clamp(num(r.txt.text, r.sld.value), r.lo, r.hi);
            r.sld.value = v; r.txt.text = String(Math.round(v));
            updateStatus(); schedule();
        };
    }
    bindRow(rLpi); bindRow(rAngle); bindRow(rPix); bindRow(rBr); bindRow(rCo); bindRow(rWc);

    for (var kk = 0; kk < 4; kk++) { paTxt[kk].onChange = function () { schedule(); }; }

    ddlAlgo.onChange = function () { updateEnabled(); updateStatus(); schedule(); };
    ddlMode.onChange = function () { updateEnabled(); updateStatus(); schedule(); };
    ddlPrev.onChange = function () { schedule(); };
    chkInvert.onClick = function () { schedule(); };
    btnPrev.onClick = function () { doPreview(); };

    btnInk.onClick = function () {
        var start = (inkRGB[0] << 16) | (inkRGB[1] << 8) | inkRGB[2];
        var c = $.colorPicker(start);
        if (c >= 0) {
            inkRGB = [(c >> 16) & 255, (c >> 8) & 255, c & 255];
            lblInk.text = toHex(inkRGB) + "  (single-ink mode)";
            try {
                lblInk.graphics.foregroundColor = lblInk.graphics.newPen(lblInk.graphics.PenType.SOLID_COLOR,
                    [inkRGB[0] / 255, inkRGB[1] / 255, inkRGB[2] / 255, 1], 1);
            } catch (e) { }
            schedule();
        }
    };

    function setRow(r, v) { r.sld.value = v; r.txt.text = String(Math.round(v)); }

    ddlPreset.onChange = function () {
        var p = PRESETS[ddlPreset.selection.index];
        if (p.none) return;
        ddlAlgo.selection = algoIndex(p.a);
        ddlMode.selection = (p.mode === "cmyk") ? 1 : (p.mode === "rgb" ? 2 : 0);
        setRow(rLpi, p.lpi); setRow(rAngle, p.ang); setRow(rPix, p.pix);
        setRow(rBr, p.b); setRow(rCo, p.c); setRow(rWc, p.wc);
        updateEnabled(); updateStatus(); schedule();
    };

    updateEnabled();
    updateStatus();

    // first preview before the window opens so the pane isn't empty
    dlg.onShow = function () { if (chkAuto.value) doPreview(); };

    // =================================================================
    // RUN
    // =================================================================
    try {
        app.displayDialogs = DialogModes.NO;
        var result = dlg.show();
        if (result === 1) applyToDocument(readParams());
    } catch (e) {
        closeTemps();
        alert("Frank's Brew hit a problem:\n" + e.message + (e.line ? "\n(line " + e.line + ")" : ""));
    } finally {
        closeTemps();
        for (var f = 0; f < tmpFiles.length; f++) removeFile(tmpFiles[f]);
        app.displayDialogs = origDialogs;
        try { app.activeDocument = origDoc; } catch (e9) { }
    }

})();
