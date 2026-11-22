# Look browser sample picture -> plugins/<tool>/look-sample.js
#   python3 tools/make_look_sample.py tools/look-samples/<tool>.png plugins/<tool>/look-sample.js
# The picture is centre-cropped to 4:3 and stored as raw RGB in base64 (320x240, or 200x150 for small sources).
# Sources in tools/look-samples/ are free images Frank picked (2026-11-22).
import sys, base64
from PIL import Image, ImageOps
im = Image.open(sys.argv[1]).convert("RGB")
size = (320, 240) if im.width >= 320 and im.height >= 240 else (200, 150)
im = ImageOps.fit(im, size, Image.LANCZOS)
b = base64.b64encode(im.tobytes()).decode()
open(sys.argv[2], "w").write('"use strict";\n// Look browser sample picture (%dx%d RGB, base64). Regenerate with tools/make_look_sample.py\nmodule.exports = { w: %d, h: %d, rgb: "%s" };\n' % (size + size + (b,)))
