import * as v from 'valibot';

import { ID } from './shared.contract';
import { Expression } from './expression';

const Align = v.picklist(['left', 'center', 'right', 'justify']);

const Link = v.object({
  type: v.literal('link'),
  attrs: v.object({
    href: v.string(),
    rel: v.optional(v.string()),
    target: v.optional(v.string()),
  }),
});

const TextStyle = v.object({
  type: v.literal('textStyle'),
  attrs: v.object({ color: v.pipe(v.string(), v.hexColor()) }),
});

const Mark = v.variant('type', [
  v.object({ type: v.literal('bold') }),
  v.object({ type: v.literal('italic') }),
  v.object({ type: v.literal('underline') }),
  v.object({ type: v.literal('highlight') }),
  v.object({ type: v.literal('strike') }),
  v.object({ type: v.literal('code') }),
  TextStyle,
  Link,
]);

const Text = v.object({
  type: v.literal('text'),
  text: v.string(),
  marks: v.optional(v.array(Mark)),
});

const TextPlaceholder = v.object({
  type: v.literal('textPlaceholder'),
  attrs: v.object({ id: ID }),
  marks: v.optional(v.array(Mark)),
});

const Inline = v.variant('type', [Text, TextPlaceholder]);

const Heading = v.object({
  type: v.literal('heading'),
  attrs: v.object({
    level: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(3)),
    textAlign: v.optional(Align),
  }),
  content: v.array(Inline),
});

const Paragraph = v.object({
  type: v.literal('paragraph'),
  attrs: v.optional(v.object({ textAlign: Align })),
  content: v.array(Inline),
});

const ListItemContent = v.variant('type', [Heading, Paragraph]);

const ListPlaceholder = v.object({
  attrs: v.object({
    id: ID,
    filter: v.optional(Expression),
  }),
  content: v.array(ListItemContent),
});

const OrderedListPlaceholder = v.object({
  type: v.literal('orderedListPlaceholder'),
  ...ListPlaceholder.entries,
});

const BulletListPlaceholder = v.object({
  type: v.literal('bulletListPlaceholder'),
  ...ListPlaceholder.entries,
});

const ListItem = v.object({
  type: v.literal('listItem'),
  content: v.array(ListItemContent),
});

const List = v.object({
  content: v.array(ListItem),
});

const OrderedList = v.object({
  type: v.literal('orderedList'),
  ...List.entries,
});

const BulletList = v.object({
  type: v.literal('bulletList'),
  ...List.entries,
});

const Block = v.variant('type', [
  Heading,
  Paragraph,
  OrderedList,
  BulletList,
  OrderedListPlaceholder,
  BulletListPlaceholder,
]);

const Section = v.object({
  type: v.literal('section'),
  attrs: v.object({ condition: Expression }),
  content: v.array(Block),
});

export const Doc = v.object({
  type: v.literal('doc'),
  attrs: v.object({
    language: v.optional(v.string()),
    title: v.string(),
  }),
  content: v.array(v.variant('type', [Section, Block])),
});

export type Text = v.InferOutput<typeof Text>;

export type TextPlaceholder = v.InferOutput<typeof TextPlaceholder>;
export type OrderedListPlaceholder = v.InferOutput<
  typeof OrderedListPlaceholder
>;
export type BulletListPlaceholder = v.InferOutput<typeof BulletListPlaceholder>;
export type ListPlaceholder = v.InferOutput<typeof ListPlaceholder>;

export type ListItem = v.InferOutput<typeof ListItem>;
export type List = v.InferOutput<typeof List>;
export type OrderedList = v.InferOutput<typeof OrderedList>;
export type BulletList = v.InferOutput<typeof BulletList>;

export type Align = v.InferOutput<typeof Align>;
export type Link = v.InferOutput<typeof Link>;
export type Mark = v.InferOutput<typeof Mark>;

export type Inline = v.InferOutput<typeof Inline>;
export type Doc = v.InferOutput<typeof Doc>;
export type Section = v.InferOutput<typeof Section>;
export type Block = v.InferOutput<typeof Block>;
export type Paragraph = v.InferOutput<typeof Paragraph>;
export type Heading = v.InferOutput<typeof Heading>;
