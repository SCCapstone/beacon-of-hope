interface HSLColor {
    h: number; // hue
    s: number; // saturation
    l: number; // lightness
  }

  export const generateDistinctColors = (count: number): string[] => {
    // Predefined distinct base colors (carefully chosen for visibility)
    const baseColors: HSLColor[] = [
      { h: 200, s: 75, l: 45 },  // Blue
      { h: 0, s: 75, l: 45 },    // Red
      { h: 120, s: 75, l: 45 },  // Green
      { h: 280, s: 75, l: 45 },  // Purple
      { h: 40, s: 75, l: 45 },   // Orange
      { h: 160, s: 75, l: 45 },  // Teal
      { h: 320, s: 75, l: 45 },  // Pink
      { h: 80, s: 75, l: 45 },   // Lime
      { h: 240, s: 75, l: 45 },  // Indigo
      { h: 20, s: 75, l: 45 },   // Red-Orange
    ];

    // If we need more colors than our base colors, generate additional ones
    if (count <= baseColors.length) {
      return baseColors
        .slice(0, count)
        .map(color => `hsl(${color.h}, ${color.s}%, ${color.l}%)`);
    }

    // For additional colors, modify the base colors with different lightness levels
    const colors: HSLColor[] = [];
    const lightnessLevels = [45, 60, 75];
    let baseColorIndex = 0;
    let lightnessIndex = 0;

    while (colors.length < count) {
      const baseColor = baseColors[baseColorIndex];
      colors.push({
        h: baseColor.h,
        s: baseColor.s,
        l: lightnessLevels[lightnessIndex],
      });

      baseColorIndex++;
      if (baseColorIndex >= baseColors.length) {
        baseColorIndex = 0;
        lightnessIndex = (lightnessIndex + 1) % lightnessLevels.length;
      }
    }

    return colors.map(color => `hsl(${color.h}, ${color.s}%, ${color.l}%)`);
  };

  // Color assignment with categorization
  export class ColorManager {
    private colorMap: Map<string, string> = new Map();
    private usedColors: Set<string> = new Set();
    private availableColors: string[] = [];

    constructor(initialIngredients: string[]) {
      this.availableColors = generateDistinctColors(Math.max(10, initialIngredients.length));
      initialIngredients.forEach(ingredient => this.getColor(ingredient));
    }

    public getColor(ingredient: string): string {
      if (this.colorMap.has(ingredient)) {
        return this.colorMap.get(ingredient)!;
      }

      // Find the most distinct color from currently used colors
      let bestColor = this.availableColors[0];
      let maxDistance = -1;

      for (const color of this.availableColors) {
        if (this.usedColors.has(color)) continue;

        let minDistanceToUsed = Infinity;
        for (const usedColor of this.usedColors) {
          const distance = this.getColorDistance(color, usedColor);
          minDistanceToUsed = Math.min(minDistanceToUsed, distance);
        }

        if (minDistanceToUsed > maxDistance) {
          maxDistance = minDistanceToUsed;
          bestColor = color;
        }
      }

      this.colorMap.set(ingredient, bestColor);
      this.usedColors.add(bestColor);
      return bestColor;
    }

    private getColorDistance(color1: string, color2: string): number {
      // Convert HSL colors to RGB for distance calculation
      const rgb1 = this.hslToRgb(color1);
      const rgb2 = this.hslToRgb(color2);

      // Calculate Euclidean distance in RGB space
      return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
      );
    }

    private hslToRgb(hslStr: string): { r: number; g: number; b: number } {
      // Parse HSL string
      const matches = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (!matches) return { r: 0, g: 0, b: 0 };

      const h = parseInt(matches[1]) / 360;
      const s = parseInt(matches[2]) / 100;
      const l = parseInt(matches[3]) / 100;

      let r: number, g: number, b: number;

      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }

      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
      };
    }
  }
