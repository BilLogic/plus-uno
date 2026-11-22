/**
 * The 3D view the Elevation stacks draw their plates in: the plates lie back
 * and turn, each lifted along its own normal, under a real perspective. The
 * plates are CSS 3D; these numbers place what sits outside them, such as the
 * ticks that run from a plate's edge to its label.
 */
export const VIEW = { perspective: 800, rotateX: 58, rotateZ: -38 };

/** The transform of the rig the plates hang on. */
export const rigTransform = `rotateX(${VIEW.rotateX}deg) rotateZ(${VIEW.rotateZ}deg)`;

const radians = (deg) => (deg * Math.PI) / 180;
const COS_X = Math.cos(radians(VIEW.rotateX));
const SIN_X = Math.sin(radians(VIEW.rotateX));
const COS_Z = Math.cos(radians(VIEW.rotateZ));
const SIN_Z = Math.sin(radians(VIEW.rotateZ));

/** Where a point on the rig (x and y across a plate, z along its normal) lands on screen, from the rig's origin. */
export const projectPoint = (x, y, z = 0) => {
    const turnedX = x * COS_Z - y * SIN_Z;
    const turnedY = x * SIN_Z + y * COS_Z;
    const screenY = turnedY * COS_X - z * SIN_X;
    const depth = turnedY * SIN_X + z * COS_X;
    const scale = VIEW.perspective / (VIEW.perspective - depth);
    return { x: turnedX * scale, y: screenY * scale };
};

/**
 * Lays out `count` plates of `w` by `h`, centered on the rig, so each sits
 * `stepDy` above the one below on screen. Returns each plate's lift, the stage
 * that holds every corner with `pad` around it (`endPad` extra on the right),
 * and the rig's origin on that stage.
 */
export const stackLayout = ({ w, h, count, stepDy, pad, endPad = 0 }) => {
    const rise = stepDy / SIN_X;
    const lifts = Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * rise);
    const corners = lifts.flatMap((z) => [
        projectPoint(-w / 2, -h / 2, z),
        projectPoint(w / 2, -h / 2, z),
        projectPoint(w / 2, h / 2, z),
        projectPoint(-w / 2, h / 2, z),
    ]);
    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    return {
        lifts,
        width: maxX - minX + 2 * pad + endPad,
        height: maxY - minY + 2 * pad,
        origin: { x: pad - minX, y: pad - minY },
    };
};
