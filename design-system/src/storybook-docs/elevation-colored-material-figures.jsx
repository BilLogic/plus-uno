import React from "react";
import { StatusTag, Tag } from "@/components";
import {
  C,
  Do,
  Dont,
  DoDont,
  RefTable,
} from "@/storybook-docs/foundation-blocks.jsx";

/**
 * Figures for Elevation › Material › Colored material. Every figure is the real
 * Tag and Status tag over a picture, so the tokens, the text pairing and the
 * edge are the shipped ones. The picture is a stand-in for any image or video.
 */
const COLORS = [
  "brand",
  "success",
  "warning",
  "danger",
  "information",
  "discovery",
];
const APPEARANCE_OF = { information: "info" };
const TEXT_OF = { warning: "--ds-text-warning-inverse" };

const picture = {
  position: "relative",
  minHeight: "var(--width-1000)",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
  backgroundImage:
    "linear-gradient(135deg, var(--ds-background-accent-orange-subtler), var(--ds-background-accent-teal-bolder) 45%, var(--ds-background-neutral-bold))",
};
const onPicture = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start",
  gap: "var(--stack-sm)",
  padding: "var(--pad-y-md) var(--pad-x-md)",
};

/** A picture with its accents laid on it. */
const Picture = ({ children, testId }) => (
  <div style={picture} data-testid={testId}>
    <div style={onPicture}>{children}</div>
  </div>
);

const label = (c) => c[0].toUpperCase() + c.slice(1);

export const ColoredTreatmentsTable = () => (
  <div data-testid="colored-treatments-table">
    <RefTable
      head={["Treatment", "Fill and text", "For"]}
      rows={[
        [
          "Bold",
          <span key="b">
            <C>--ds-background-{"{color}"}-material-bold</C> with the on-bold text
          </span>,
          "A status, brand or category that must read at a glance: a “New” tag, a rating, a count.",
        ],
        [
          "Subtle",
          <span key="s">
            <C>--ds-surface-material-overlay</C> with <C>--ds-text-{"{color}"}</C>
          </span>,
          "Low-emphasis status on media, where a bold chip would shout.",
        ],
        [
          "Every one",
          <span key="e">
            <C>--ds-border-material</C> edge; transparency only, no blur, no gradient
          </span>,
          "Small accents only: Tag, Status tag, a rating or count chip.",
        ],
      ]}
    />
  </div>
);

export const ColoredTokensTable = () => (
  <div data-testid="colored-tokens-table">
    <RefTable
      head={["Token", "Light", "Dark", "Text on it"]}
      rows={COLORS.map((c) => [
        <C key={c}>--ds-background-{c}-material-bold</C>,
        `${c}-bold, 95%`,
        `${c}-bold, 92%`,
        <C key={`t${c}`}>{TEXT_OF[c] ?? "--ds-text-inverse"}</C>,
      ])}
    />
  </div>
);

export const ColoredComposeTable = () => (
  <div data-testid="colored-compose-table">
    <RefTable
      head={["Sits on", "Rule"]}
      rows={[
        ["Media: an image, illustration or video", "Bold or subtle, directly on the media."],
        [
          "A media, control or overlay material surface",
          "Allowed. On the 94% overlay (a floating Panel, a Modal) the chip reads as on a near-solid surface.",
        ],
        ["Another colored material", "Never. One colored layer only."],
        [
          "A solid page, Section or card",
          <span key="s">
            Not material: use the solid <C>--ds-background-{"{color}"}-bold</C> or the subtle background token.
          </span>,
        ],
        ["A large surface", "Never colored: no colored control, overlay or panel."],
      ]}
    />
  </div>
);

/** Every color, bold and subtle, as a Tag and as a Status tag, over one picture. */
export const ColoredMaterialLive = () => (
  <div style={{ display: "grid", gap: "var(--stack-md)" }} data-testid="colored-material-live">
    {["bold", "subtle"].map((m) => (
      <Picture key={m} testId={`colored-${m}`}>
        {COLORS.map((c) => (
          <Tag key={`t${c}`} material={m} materialColor={c}>
            {label(c)}
          </Tag>
        ))}
        {COLORS.filter((c) => c !== "brand").map((c) => (
          <StatusTag
            key={`s${c}`}
            material={m}
            appearance={APPEARANCE_OF[c] ?? c}
          >
            {label(c)}
          </StatusTag>
        ))}
      </Picture>
    ))}
  </div>
);

/** Pair 1: keep colored material small. */
export const ColoredMaterialSmall = () => (
  <DoDont>
    <Do caption="Tags and a count: small accents with a color identity.">
      <Picture>
        <Tag material="bold" materialColor="brand">New</Tag>
        <StatusTag material="subtle" appearance="success">Open</StatusTag>
      </Picture>
    </Do>
    <Dont caption="A colored floating Panel. Large surfaces take neutral overlay material.">
      <div style={picture}>
        <div
          style={{
            margin: "var(--pad-y-md) var(--pad-x-md)",
            minHeight: "var(--width-500)",
            padding: "var(--pad-y-md) var(--pad-x-md)",
            borderRadius: "var(--radius-lg)",
            border: "var(--border-width-default) solid var(--ds-border-material)",
            background: "var(--ds-background-brand-material-bold)",
            color: "var(--ds-text-inverse)",
          }}
        >
          Floating panel
        </div>
      </div>
    </Dont>
  </DoDont>
);

/** Pair 2: pair the fill with its on-bold text. */
export const ColoredMaterialPairText = () => (
  <DoDont>
    <Do caption="On-bold text on the bold fill.">
      <Picture>
        <Tag material="bold" materialColor="danger">Overdue</Tag>
      </Picture>
    </Do>
    <Dont caption="Colored text on a colored fill fails contrast.">
      <Picture>
        <span
          style={{
            padding: "0 var(--pad-x-xs)",
            borderRadius: "var(--radius-md)",
            border: "var(--border-width-default) solid var(--ds-border-material)",
            background: "var(--ds-background-danger-material-bold)",
            color: "var(--ds-text-danger)",
          }}
        >
          Overdue
        </span>
      </Picture>
    </Dont>
  </DoDont>
);

/** Pair 3: give it the material edge. */
export const ColoredMaterialEdge = () => (
  <DoDont>
    <Do caption="The bright edge keeps the chip apart from the picture.">
      <Picture>
        <Tag material="bold" materialColor="information">Beta</Tag>
      </Picture>
    </Do>
    <Dont caption="No edge: the chip bleeds into a busy picture.">
      <Picture>
        <span
          style={{
            padding: "0 var(--pad-x-xs)",
            borderRadius: "var(--radius-md)",
            background: "var(--ds-background-information-material-bold)",
            color: "var(--ds-text-inverse)",
          }}
        >
          Beta
        </span>
      </Picture>
    </Dont>
  </DoDont>
);

/** Pair 4: material only over something. */
export const ColoredMaterialOverSomething = () => (
  <DoDont>
    <Do caption="Over media, the color stays tied to the picture.">
      <Picture>
        <Tag material="bold" materialColor="discovery">Featured</Tag>
      </Picture>
    </Do>
    <Dont caption="Colored material on a plain card. On a solid surface use the solid bold token.">
      <div
        style={{
          padding: "var(--pad-y-md) var(--pad-x-md)",
          borderRadius: "var(--radius-lg)",
          background: "var(--ds-surface-raised)",
          border: "var(--border-width-default) solid var(--ds-border)",
        }}
      >
        <Tag material="bold" materialColor="discovery">Featured</Tag>
      </div>
    </Dont>
  </DoDont>
);
