import React, { useId } from "react";
import {
  C,
  Do,
  Dont,
  DoDont,
  RefTable,
} from "@/storybook-docs/foundation-blocks.jsx";
import { ElevationPanel } from "@/storybook-docs/elevation-folder-figures.jsx";
import { Illustration } from "@/storybook-docs/illustrations/Illustration.jsx";
import {
  Blanket,
  Layer,
  Rect,
  SkeletonBar,
} from "@/storybook-docs/illustrations/primitives.jsx";
import { PAINT } from "@/storybook-docs/illustrations/paint.js";
import { usePageContrast } from "@/storybook-docs/lib/use-page-contrast.js";

/**
 * Figures for Elevation › Material (board EL-D6). A drawing never carries readable
 * text: skeleton bars stand in for it, and the words live in the page around it.
 * The fills are the real material tokens, so the busy backdrop shows through.
 */
const STAGE = { w: 220, h: 108 };
const FRAME = { x: 5, y: 4, w: 210, h: 100 };

const PageCanvas = ({ mode, children }) => {
  const contrast = usePageContrast();
  return (
    <g
      {...(mode ? { "data-color-mode": mode } : {})}
      {...(contrast ? { "data-contrast-mode": contrast } : {})}
    >
      <Layer
        x={FRAME.x}
        y={FRAME.y}
        w={FRAME.w}
        h={FRAME.h}
        fill={PAINT.pageSurface}
        corner="card"
      />
      <Rect
        x={FRAME.x}
        y={FRAME.y}
        w={FRAME.w}
        h={FRAME.h}
        stroke={PAINT.frameDivider}
        corner="card"
      />
      {children}
    </g>
  );
};

/** Busy content to float over: rows of heavy bars, so a see-through surface visibly keeps them. */
const Rows = ({ x, y, w, count = 6, sharp = true }) => (
  <g {...(sharp ? {} : { filter: "url(#material-blur)" })}>
    {Array.from({ length: count }, (_, i) => (
      <React.Fragment key={i}>
        <SkeletonBar
          x={x}
          y={y + i * 10}
          w={Math.round(w * (0.9 - (i % 3) * 0.14))}
          h={5}
          heading
        />
      </React.Fragment>
    ))}
  </g>
);

/** A picture: a block with a dark mark, as an illustration or photo stands in. */
const Picture = ({ x, y, w, h }) => (
  <>
    <Rect x={x} y={y} w={w} h={h} fill={PAINT.placeholderText} corner="card" />
    <Rect
      x={x + w * 0.12}
      y={y + h * 0.2}
      w={w * 0.34}
      h={h * 0.6}
      fill={PAINT.placeholderHeading}
      corner="card"
      opacity={0.7}
    />
  </>
);

const MATERIAL_FILL = {
  media: PAINT.materialMedia,
  control: PAINT.materialControl,
  overlay: PAINT.materialOverlay,
};

/** A material surface: its fill, the bright edge, and the shadow it takes. */
const Plate = ({
  x,
  y,
  w,
  h,
  kind = "overlay",
  edge = true,
  shadow,
  corner = "popup",
  fill,
  opacity,
}) => (
  <g>
    <Layer
      x={x}
      y={y}
      w={w}
      h={h}
      fill={fill ?? MATERIAL_FILL[kind]}
      shadow={shadow}
      corner={corner}
    />
    {edge && (
      <Rect
        x={x}
        y={y}
        w={w}
        h={h}
        stroke={PAINT.materialEdge}
        corner={corner}
        opacity={opacity}
      />
    )}
  </g>
);

const PlateBars = ({ x, y, w }) => (
  <>
    <SkeletonBar x={x + 6} y={y + 6} w={Math.round(w * 0.5)} h={3.5} heading />
    <SkeletonBar x={x + 6} y={y + 13} w={Math.round(w * 0.7)} h={3.5} />
  </>
);

const BlurFilter = ({ id }) => (
  <defs>
    <filter id={id}>
      <feGaussianBlur stdDeviation="1.6" />
    </filter>
  </defs>
);

const Stage = ({ title, children, mode }) => (
  <Illustration width={STAGE.w} height={STAGE.h} title={title}>
    <PageCanvas mode={mode}>{children}</PageCanvas>
  </Illustration>
);

/* ------------------------------------------------------------- ramp */

const RAMP = [
  { kind: "media", label: "media" },
  { kind: "control", label: "control" },
  { kind: "overlay", label: "overlay" },
];

const RampRow = ({ mode }) => (
  <Illustration
    width={STAGE.w}
    height={52}
    title={`Three materials over busy rows, ${mode} mode`}
  >
    <g data-color-mode={mode}>
      <Layer
        x={FRAME.x}
        y={2}
        w={FRAME.w}
        h={48}
        fill={PAINT.pageSurface}
        corner="card"
      />
      <Rect
        x={FRAME.x}
        y={2}
        w={FRAME.w}
        h={48}
        stroke={PAINT.frameDivider}
        corner="card"
      />
      {[0, 1, 2].map((i) => (
        <SkeletonBar
          key={i}
          x={FRAME.x + 6}
          y={10 + i * 12}
          w={198}
          h={6}
          heading
        />
      ))}
      {RAMP.map(({ kind }, i) => (
        <Plate
          key={kind}
          kind={kind}
          x={FRAME.x + 12 + i * 66}
          y={9}
          w={60}
          h={34}
        />
      ))}
    </g>
  </Illustration>
);

/** The three materials from most to least see-through, light over dark. */
export const MaterialRampFigure = () => (
  <ElevationPanel data-testid="material-ramp">
    <div style={{ display: "grid", gap: "var(--stack-md)" }}>
      {["light", "dark"].map((mode) => (
        <figure
          key={mode}
          data-ramp-mode={mode}
          style={{ margin: 0, display: "grid", gap: "var(--stack-sm)" }}
        >
          <RampRow mode={mode} />
          <figcaption
            style={{
              display: "flex",
              gap: "var(--inline-lg)",
              font: "var(--body-default)",
              color: "var(--ds-text-subtle)",
            }}
          >
            <span style={{ textTransform: "capitalize" }}>{mode}</span>
            {RAMP.map(({ kind, label }) => (
              <C key={kind}>{label}</C>
            ))}
          </figcaption>
        </figure>
      ))}
    </div>
  </ElevationPanel>
);

/* ---------------------------------------------------------- anatomy */

const AnatomyStage = ({ title, children }) => (
  <Illustration width={92} height={64} title={title}>
    {children}
  </Illustration>
);

const Operator = ({ children }) => (
  <span
    aria-hidden="true"
    style={{
      font: "var(--heading-md)",
      color: "var(--ds-text-subtle)",
      alignSelf: "center",
    }}
  >
    {children}
  </span>
);

const AnatomyItem = ({ title, token, children, figure }) => (
  <figure
    style={{
      margin: 0,
      display: "grid",
      gap: "var(--stack-sm)",
      justifyItems: "start",
      flex: "1 1 0",
      minWidth: 0,
    }}
  >
    {figure}
    <figcaption style={{ display: "grid", gap: "var(--stack-sm)" }}>
      <strong
        style={{
          font: "var(--body-default)",
          fontWeight: "var(--type-weight-semibold)",
        }}
      >
        {title}
      </strong>
      <C>{token}</C>
      <span
        style={{ font: "var(--body-default)", color: "var(--ds-text-subtle)" }}
      >
        {children}
      </span>
    </figcaption>
  </figure>
);

/** A material surface is three tokens together: the fill, the edge and the shadow. */
export const MaterialAnatomyFigure = () => (
  <ElevationPanel data-testid="material-anatomy">
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--inline-lg)",
        alignItems: "flex-start",
      }}
    >
      <AnatomyItem
        title="Fill"
        token="--ds-surface-material-*"
        figure={
          <AnatomyStage title="A translucent fill over busy rows">
            <Rows x={8} y={6} w={76} count={5} />
            <Layer
              x={14}
              y={14}
              w={64}
              h={36}
              fill={PAINT.materialControl}
              corner="popup"
            />
          </AnatomyStage>
        }
      >
        The translucent background. Applied as is, never with extra opacity.
      </AnatomyItem>
      <Operator>+</Operator>
      <AnatomyItem
        title="Edge"
        token="--ds-border-material"
        figure={
          <AnatomyStage title="A bright one-pixel edge">
            <Rect
              x={14}
              y={14}
              w={64}
              h={36}
              stroke={PAINT.materialEdge}
              corner="popup"
            />
          </AnatomyStage>
        }
      >
        A bright one-pixel border that keeps the edge readable on any content.
      </AnatomyItem>
      <Operator>+</Operator>
      <AnatomyItem
        title="Shadow"
        token="--ds-shadow-overlay"
        figure={
          <AnatomyStage title="The layer's own shadow">
            <Layer
              x={14}
              y={14}
              w={64}
              h={36}
              fill={PAINT.pageSurface}
              shadow={PAINT.popupShadow}
              corner="popup"
            />
          </AnatomyStage>
        }
      >
        The layer’s own shadow: none on media, overlay for Layer 3.
      </AnatomyItem>
      <Operator>=</Operator>
      <AnatomyItem
        title="Material surface"
        token="fill + edge + shadow"
        figure={
          <AnatomyStage title="The three together: a floating surface that keeps what is behind it in view">
            <Rows x={8} y={6} w={76} count={5} />
            <Plate
              kind="control"
              x={14}
              y={14}
              w={64}
              h={36}
              shadow={PAINT.popupShadow}
            />
          </AnatomyStage>
        }
      >
        Floats, and stays connected to what is behind it.
      </AnatomyItem>
    </div>
  </ElevationPanel>
);

/* ------------------------------------------------------ choose + values */

/** The values table, read straight off the shipped tokens by the tables below. */
export const MaterialChooseTable = () => (
  <div data-testid="material-choose-table">
    <RefTable
      head={["Token", "For", "Layer", "Shadow"]}
      rows={[
        [
          <C key="m">--ds-surface-material-media</C>,
          "Small things on an image, illustration or video: a Tag, an icon button, a caption. The most see-through.",
          "Wherever the media is",
          "None; raised for a control",
        ],
        [
          <C key="c">--ds-surface-material-control</C>,
          "Controls that float over the page: a floating button, floating search, a toolbar over scrolling content.",
          "Layer 3 · Non-blocking overlay",
          <C key="cs">--ds-shadow-overlay</C>,
        ],
        [
          <C key="o">--ds-surface-material-overlay</C>,
          "Large floating surfaces with long content: the floating Sidebar, the floating Panel and the Modal. The least see-through, so text stays readable.",
          "Layer 3 · Non-blocking overlay; Layer 4 · Blocking overlay, on the Blanket",
          "Overlay; blocking for the Modal",
        ],
        [
          <C key="b">--ds-border-material</C>,
          "The edge of every material surface. Bright in light mode, a faint light line in dark.",
          "Every material",
          "—",
        ],
        [
          <C key="k">--ds-blanket</C>,
          "Under a blocking surface only. Never a surface by itself; a Modal always sits on it.",
          "Layer 4 · Blocking overlay",
          "—",
        ],
      ]}
    />
  </div>
);

export const MaterialValuesTable = () => (
  <div data-testid="material-values-table">
    <RefTable
      head={["Token", "Light", "Dark", "Falls back to"]}
      rows={[
        [
          <C key="m">--ds-surface-material-media</C>,
          "White, 50%",
          "Overlay surface, 50%",
          <C key="f1">--ds-surface-overlay</C>,
        ],
        [
          <C key="c">--ds-surface-material-control</C>,
          "White, 74%",
          "Overlay surface, 72%",
          <C key="f2">--ds-surface-overlay</C>,
        ],
        [
          <C key="o">--ds-surface-material-overlay</C>,
          "White, 94%",
          "Overlay surface, 94%",
          <C key="f3">--ds-surface-overlay</C>,
        ],
        [
          <C key="e">--ds-border-material</C>,
          "White, 100%",
          "White, 14%",
          <C key="f4">--ds-border</C>,
        ],
      ]}
    />
  </div>
);

/* -------------------------------------------------------- do and don't */

/** Pair 1: over media, use media material. */
export const MaterialOnMedia = () => (
  <DoDont>
    <Do caption="On media: a Tag and an icon button on an illustration take media material and the bright edge, so the picture stays in view.">
      <Stage title="A Tag and an icon button in media material on a picture">
        <Picture x={FRAME.x + 12} y={FRAME.y + 10} w={186} h={80} />
        <Plate
          kind="media"
          corner="tag"
          x={FRAME.x + 20}
          y={FRAME.y + 18}
          w={34}
          h={10}
        />
        <Plate
          kind="media"
          corner="button"
          shadow={PAINT.popupShadow}
          x={FRAME.x + 166}
          y={FRAME.y + 18}
          w={20}
          h={14}
        />
      </Stage>
    </Do>
    <Dont caption="A solid chip on media cuts a hole in the picture: over media, use media material.">
      <Stage title="A solid Tag and a solid icon button hiding part of a picture">
        <Picture x={FRAME.x + 12} y={FRAME.y + 10} w={186} h={80} />
        <Rect
          x={FRAME.x + 20}
          y={FRAME.y + 18}
          w={34}
          h={10}
          fill={PAINT.pageSurface}
          corner="tag"
        />
        <Rect
          x={FRAME.x + 166}
          y={FRAME.y + 18}
          w={20}
          h={14}
          fill={PAINT.pageSurface}
          corner="button"
        />
      </Stage>
    </Dont>
  </DoDont>
);

/** Pair 2: match the material to the surface. */
export const MaterialMatchSurface = () => (
  <DoDont>
    <Do caption="Over the page: a floating Panel takes overlay material, a floating button takes control material, both with the overlay shadow.">
      <Stage title="A floating Panel in overlay material and a floating button in control material over page rows">
        <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
        <Plate
          kind="overlay"
          shadow={PAINT.popupShadow}
          x={FRAME.x + 112}
          y={FRAME.y + 12}
          w={86}
          h={62}
        />
        <PlateBars x={FRAME.x + 112} y={FRAME.y + 12} w={86} />
        <Plate
          kind="control"
          corner="button"
          shadow={PAINT.popupShadow}
          x={FRAME.x + 20}
          y={FRAME.y + 78}
          w={40}
          h={14}
        />
      </Stage>
    </Do>
    <Dont caption="Media material on a large surface: the rows behind collide with the text on top: big surfaces take overlay material.">
      <Stage title="A large Panel in media material with page rows showing through its text">
        <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
        <Plate
          kind="media"
          shadow={PAINT.popupShadow}
          x={FRAME.x + 112}
          y={FRAME.y + 12}
          w={86}
          h={62}
        />
        <PlateBars x={FRAME.x + 112} y={FRAME.y + 12} w={86} />
      </Stage>
    </Dont>
  </DoDont>
);

/** Pair 3: give every material its edge. */
export const MaterialEdge = () => (
  <DoDont>
    <Do caption="Every material carries its edge.">
      <Stage title="A control in material with its bright edge over busy rows">
        <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
        <Plate
          kind="control"
          shadow={PAINT.popupShadow}
          x={FRAME.x + 50}
          y={FRAME.y + 28}
          w={110}
          h={40}
        />
        <PlateBars x={FRAME.x + 50} y={FRAME.y + 28} w={110} />
      </Stage>
    </Do>
    <Dont caption="No edge: on busy content the surface dissolves into what is behind it.">
      <Stage title="A control in material with no edge, dissolving into busy rows">
        <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
        <Plate
          kind="control"
          edge={false}
          shadow={PAINT.popupShadow}
          x={FRAME.x + 50}
          y={FRAME.y + 28}
          w={110}
          h={40}
        />
        <PlateBars x={FRAME.x + 50} y={FRAME.y + 28} w={110} />
      </Stage>
    </Dont>
  </DoDont>
);

/** Pair 4: use material only on what floats. */
export const MaterialOnlyFloating = () => (
  <DoDont>
    <Do caption="A floating Panel over the page: something is behind it to stay tied to.">
      <Stage title="A floating Panel in overlay material over the page">
        <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
        <Plate
          kind="overlay"
          shadow={PAINT.popupShadow}
          x={FRAME.x + 112}
          y={FRAME.y + 12}
          w={86}
          h={62}
        />
        <PlateBars x={FRAME.x + 112} y={FRAME.y + 12} w={86} />
      </Stage>
    </Do>
    <Dont caption="Material on the page, a Section or a card: nothing is behind them, and material is never a page background.">
      <Stage title="A card in material resting on the page with nothing behind it">
        <SkeletonBar x={FRAME.x + 9} y={FRAME.y + 9} w={58} h={5.5} heading />
        <Plate
          kind="control"
          edge={false}
          corner="card"
          x={FRAME.x + 9}
          y={FRAME.y + 21}
          w={92}
          h={56}
        />
        <PlateBars x={FRAME.x + 9} y={FRAME.y + 21} w={92} />
        <Plate
          kind="control"
          edge={false}
          corner="card"
          x={FRAME.x + 109}
          y={FRAME.y + 21}
          w={92}
          h={56}
        />
        <PlateBars x={FRAME.x + 109} y={FRAME.y + 21} w={92} />
      </Stage>
    </Dont>
  </DoDont>
);

/** Pair 5: transparency only, no blur. */
export const MaterialNoBlur = () => {
  const id = `${useId().replace(/:/g, "")}-blur`;
  return (
    <DoDont>
      <Do caption="Control material as it is: the rows behind show through, sharp.">
        <Stage title="Control material with sharp rows showing through">
          <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
          <Plate
            kind="control"
            shadow={PAINT.popupShadow}
            x={FRAME.x + 50}
            y={FRAME.y + 28}
            w={110}
            h={40}
          />
        </Stage>
      </Do>
      <Dont caption="Blur: material is transparency only, so it looks the same in every browser and in Figma and costs nothing on scroll.">
        <Stage title="Control material with the rows behind it blurred">
          <BlurFilter id={id} />
          <g filter={`url(#${id})`}>
            <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
          </g>
          <Plate
            kind="control"
            shadow={PAINT.popupShadow}
            x={FRAME.x + 50}
            y={FRAME.y + 28}
            w={110}
            h={40}
          />
        </Stage>
      </Dont>
    </DoDont>
  );
};

/** Pair 6: apply the token as it is. */
export const MaterialAsIs = () => (
  <DoDont>
    <Do caption="Overlay material at its token value; the text keeps full strength.">
      <Stage title="Overlay material with full-strength text bars">
        <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
        <Plate
          kind="overlay"
          shadow={PAINT.popupShadow}
          x={FRAME.x + 50}
          y={FRAME.y + 24}
          w={110}
          h={48}
        />
        <SkeletonBar x={FRAME.x + 58} y={FRAME.y + 32} w={60} h={4.5} heading />
        <SkeletonBar
          x={FRAME.x + 58}
          y={FRAME.y + 42}
          w={84}
          h={4}
          tone={PAINT.glyph}
        />
      </Stage>
    </Do>
    <Dont caption="Extra opacity on top of the token: the text fades with the surface: apply the token as is.">
      <Stage title="Overlay material with extra opacity, its text faded">
        <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
        <g opacity={0.5}>
          <Plate
            kind="overlay"
            shadow={PAINT.popupShadow}
            x={FRAME.x + 50}
            y={FRAME.y + 24}
            w={110}
            h={48}
          />
          <SkeletonBar
            x={FRAME.x + 58}
            y={FRAME.y + 32}
            w={60}
            h={4.5}
            heading
          />
          <SkeletonBar
            x={FRAME.x + 58}
            y={FRAME.y + 42}
            w={84}
            h={4}
            tone={PAINT.glyph}
          />
        </g>
      </Stage>
    </Dont>
  </DoDont>
);

/** Pair 7: neutral material only. */
export const MaterialNeutralOnly = () => (
  <DoDont>
    <Do caption="A neutral Tag on media: a colored accent takes the colored-material tokens.">
      <Stage title="A neutral Tag in media material on a picture">
        <Picture x={FRAME.x + 12} y={FRAME.y + 10} w={186} h={80} />
        <Plate
          kind="media"
          corner="tag"
          x={FRAME.x + 20}
          y={FRAME.y + 18}
          w={34}
          h={10}
        />
      </Stage>
    </Do>
    <Dont caption="A translucent brand color made up by hand: colored material has its own tokens.">
      <Stage title="A Tag tinted with a translucent brand color on a picture">
        <Picture x={FRAME.x + 12} y={FRAME.y + 10} w={186} h={80} />
        <Rect
          x={FRAME.x + 20}
          y={FRAME.y + 18}
          w={34}
          h={10}
          fill={PAINT.accent}
          corner="tag"
          opacity={0.5}
        />
      </Stage>
    </Dont>
  </DoDont>
);

/** Pair 8: a blocking material sits on the Blanket. */
export const MaterialOnBlanket = () => (
  <DoDont>
    <Do caption="A Modal: overlay material on the Blanket, with the blocking shadow.">
      <Stage title="A Modal in overlay material on the dimmed Blanket">
        <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
        <Blanket
          x={FRAME.x}
          y={FRAME.y}
          w={FRAME.w}
          h={FRAME.h}
          corner="card"
        />
        <Plate
          kind="overlay"
          corner="modal"
          shadow={PAINT.modalShadow}
          x={FRAME.x + 55}
          y={FRAME.y + 20}
          w={100}
          h={60}
        />
        <SkeletonBar x={FRAME.x + 62} y={FRAME.y + 27} w={48} h={4.5} heading />
      </Stage>
    </Do>
    <Dont caption="The Blanket as a surface by itself: something blocking always sits on it.">
      <Stage title="The Blanket drawn as a surface with nothing blocking on it">
        <Rows x={FRAME.x + 9} y={FRAME.y + 10} w={192} count={8} />
        <Rect
          x={FRAME.x + 55}
          y={FRAME.y + 20}
          w={100}
          h={60}
          fill={PAINT.blanket}
          corner="modal"
        />
        <SkeletonBar x={FRAME.x + 62} y={FRAME.y + 27} w={48} h={4.5} heading />
      </Stage>
    </Dont>
  </DoDont>
);
