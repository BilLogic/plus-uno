// One frame in two versions, in the shapes Figma's REST API answers with:
// `GET /v1/files/:key/nodes` (now, and `?version=` for the older one) and
// `GET /v1/files/:key/versions`. The node fields are the ones the frame
// reader keeps — `fills`, `annotations`, `absoluteBoundingBox`, `characters`
// — as Figma's REST spec types them (Paint, Annotation, Rectangle); the
// version entries carry the keys the 2026-09-30 probe saw on this token.
// Everything else Figma sends is left out, because the reader drops it.

import type { FigmaNode } from "../../src/integrations/figma-reading";
import type { FigmaVersionsResponse } from "../../src/figma/client";

export const FILE = "AbC123xyz";
export const NODE = "158:21725";
export const LINK = `https://www.figma.com/design/${FILE}/Sessions?node-id=158-21725`;

const BLUE = { r: 0.1450980392, g: 0.3882352941, b: 0.9215686275, a: 1 };
const WHITE = { r: 1, g: 1, b: 1, a: 1 };
const GREEN = { r: 0.0862745098, g: 0.6392156863, b: 0.2901960784, a: 1 };

/** The frame as it stands now. */
export const FRAME_NOW: FigmaNode = {
  id: NODE,
  name: "Session card",
  type: "FRAME",
  absoluteBoundingBox: { x: 0, y: 0, width: 360, height: 200 },
  fills: [{ type: "SOLID", visible: true, opacity: 1, blendMode: "NORMAL", color: WHITE }],
  annotations: [{ label: "Card collapses to one column below 576px", properties: [{ type: "width" }] }],
  children: [
    { id: "158:21726", name: "Title", type: "TEXT", characters: "Today's session", fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }] },
    {
      id: "158:21731",
      name: "Join button",
      type: "INSTANCE",
      absoluteBoundingBox: { x: 16, y: 140, width: 120, height: 40 },
      fills: [{ type: "SOLID", color: GREEN, boundVariables: { color: { type: "VARIABLE_ALIAS", id: "VariableID:1:42" } } }],
      annotations: [{ labelMarkdown: "Opens the **session room**; disabled until 5 min before start", categoryId: "1:1" }],
      children: [{ id: "158:21732", name: "Label", type: "TEXT", characters: "Join", fills: [{ type: "SOLID", color: WHITE }] }],
    },
    {
      id: "158:21740",
      name: "Hidden badge",
      type: "RECTANGLE",
      fills: [{ type: "SOLID", visible: false, color: BLUE }],
    },
    {
      id: "158:21745",
      name: "Reschedule link",
      type: "TEXT",
      characters: "Reschedule",
      fills: [{ type: "SOLID", color: BLUE, opacity: 0.5 }],
    },
  ],
};

/** The frame at the version saved on 2026-10-01. */
export const FRAME_THEN: FigmaNode = {
  id: NODE,
  name: "Session card",
  type: "FRAME",
  absoluteBoundingBox: { x: 0, y: 0, width: 320, height: 200 },
  fills: [{ type: "SOLID", color: WHITE }],
  children: [
    { id: "158:21726", name: "Heading", type: "TEXT", characters: "Your session", fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }] },
    {
      id: "158:21731",
      name: "Join button",
      type: "INSTANCE",
      absoluteBoundingBox: { x: 16, y: 140, width: 120, height: 40 },
      fills: [{ type: "SOLID", color: BLUE }],
      annotations: [{ label: "Opens the session room" }],
      children: [{ id: "158:21732", name: "Label", type: "TEXT", characters: "Enter", fills: [{ type: "SOLID", color: WHITE }] }],
    },
    {
      id: "158:21740",
      name: "Hidden badge",
      type: "RECTANGLE",
      fills: [{ type: "SOLID", visible: false, color: BLUE }],
    },
    { id: "158:21750", name: "Cancel link", type: "TEXT", characters: "Cancel" },
  ],
};

/** The version saved on 2026-10-01, the one `since: 2026-10-02` compares with. */
export const VERSION_THEN = "2001";

/** The file's history, newest first, as `/versions` lists it. */
export const VERSIONS: FigmaVersionsResponse = {
  versions: [
    { id: "2003", label: null, description: null, created_at: "2026-10-12T09:00:00Z", user: { handle: "coco", id: "u1" } },
    { id: "2002", label: "Join copy", description: "Join, not Enter", created_at: "2026-10-05T16:30:00Z", user: { handle: "maya", id: "u2" } },
    { id: VERSION_THEN, label: "Handoff v1", description: null, created_at: "2026-10-01T18:00:00Z", user: { handle: "coco", id: "u1" } },
    { id: "2000", label: null, description: null, created_at: "2026-09-20T10:00:00Z", user: { handle: "coco", id: "u1" } },
  ],
};
