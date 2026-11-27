// Browser stand-in for @resvg/resvg-js: the Chamber shows the modules' SVG directly, so "PNG" bytes are the SVG text.
export class Resvg {
  constructor(svg) { this.svg = String(svg); }
  render() { const svg = this.svg; return { asPng: () => new TextEncoder().encode(svg), width: 0, height: 0 }; }
}
export default { Resvg };
