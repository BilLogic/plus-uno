import { describe, expect, it } from 'vitest';
import { composeShadow, groundDarkness, parseShadow, shadowReach, slotted } from './shadow-anatomy';

const TOKEN = '0px 0px 0px 1px rgb(29 27 22 / 0.071), 0px 8px 16px rgb(29 27 22 / 0.071), 0px 24px 56px rgb(29 27 22 / 0.161)';
const COMPUTED = 'rgba(29, 27, 22, 0.07) 0px 0px 0px 1px, rgba(29, 27, 22, 0.07) 0px 8px 16px 0px, rgba(29, 27, 22, 0.16) 0px 24px 56px 0px';

describe('parseShadow', () => {
    it('reads a token value: offset, blur, spread and ink per layer', () => {
        const [edge, key, ambient] = parseShadow(TOKEN);
        expect(edge).toMatchObject({ x: 0, y: 0, blur: 0, spread: 1, inset: false });
        expect(edge.color).toEqual({ r: 29, g: 27, b: 22, a: 0.071 });
        expect(key).toMatchObject({ y: 8, blur: 16, spread: 0 });
        expect(ambient).toMatchObject({ y: 24, blur: 56, spread: 0 });
        expect(ambient.color.a).toBeCloseTo(0.161);
    });

    it('reads the computed form, color first and commas in rgba()', () => {
        const layers = parseShadow(COMPUTED);
        expect(layers).toHaveLength(3);
        expect(layers[1]).toMatchObject({ y: 8, blur: 16, spread: 0 });
        expect(layers[2].color).toEqual({ r: 29, g: 27, b: 22, a: 0.16 });
    });

    it('reads none and an empty value as no layers', () => {
        expect(parseShadow('none')).toEqual([]);
        expect(parseShadow('')).toEqual([]);
    });
});

describe('slotted', () => {
    it('names the layers edge, key and ambient, in order', () => {
        expect(slotted(parseShadow(TOKEN)).map((l) => l.slot)).toEqual(['edge', 'key', 'ambient']);
    });
});

describe('composeShadow', () => {
    it('writes back only the slots left on', () => {
        const layers = slotted(parseShadow(TOKEN));
        const out = composeShadow(layers, { edge: true, key: false, ambient: true });
        expect(parseShadow(out)).toHaveLength(2);
        expect(parseShadow(out)[1]).toMatchObject({ y: 24, blur: 56 });
    });

    it('writes none when every slot is off', () => {
        expect(composeShadow(slotted(parseShadow(TOKEN)), { edge: false, key: false, ambient: false })).toBe('none');
    });
});

describe('shadowReach', () => {
    it('is how far below the edge the farthest layer still paints', () => {
        expect(shadowReach(parseShadow(TOKEN))).toBe(80);
        expect(shadowReach([])).toBe(0);
    });
});

describe('groundDarkness', () => {
    const layers = parseShadow(TOKEN);

    it('is darkest at the edge and fades to nothing past the reach', () => {
        const near = groundDarkness(layers, 2);
        const mid = groundDarkness(layers, 30);
        expect(near).toBeGreaterThan(mid);
        expect(mid).toBeGreaterThan(0);
        expect(groundDarkness(layers, 120)).toBeLessThan(0.002);
    });

    it('counts the edge ring only inside its 1px', () => {
        const ring = parseShadow('0px 0px 0px 1px rgb(0 0 0 / 0.5)');
        expect(groundDarkness(ring, 0.5)).toBeCloseTo(0.5);
        expect(groundDarkness(ring, 2)).toBe(0);
    });

    it('leaves out a light ink: it lifts the edge rather than darkening the ground', () => {
        const light = parseShadow('0px 0px 0px 1px rgb(247 246 245 / 0.12), 0px 8px 12px rgb(20 20 19 / 0.36)');
        expect(groundDarkness(light, 0.5)).toBeCloseTo(groundDarkness(light.slice(1), 0.5));
    });
});
