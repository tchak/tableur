import type * as d from './document.contract';
import { compute } from './expression';
import type { Data, SubData } from './shared.contract';
import { formatValue } from './value';

interface Context {
  data: Data;
  subData?: SubData;
}

export function compile(doc: d.Doc, context: Context): string {
  const content = doc.content.map((block) => {
    if (block.type == 'section') {
      return compileSection(block, context);
    }
    return compileBlock(block, context);
  });
  content.unshift(config(doc.attrs));
  return content.join('');
}

function compileSection(section: d.Section, context: Context): string {
  if (!compute(section.attrs.condition, context.data)) {
    return '';
  }
  return compileBlockContent(section.content, context);
}

function compileParagraph(
  paragraph: d.Paragraph,
  context: Context,
  simple = false,
): string {
  const content = compileInlineContent(paragraph.content, context);
  if (simple) {
    return content;
  }
  return `#par[${content}]\n`;
}

function compileHeading(heading: d.Heading, context: Context): string {
  let content = compileInlineContent(heading.content, context);
  const depth = heading.attrs.level;
  content = `#heading(depth: ${depth})[${content}]`;
  if (
    heading.attrs.textAlign == 'center' ||
    heading.attrs.textAlign == 'right'
  ) {
    content = `#align(${heading.attrs.textAlign})[${content}]`;
  }
  return content + '\n';
}

function compileBlockContent(content: d.Block[], context: Context): string {
  return content.map((block) => compileBlock(block, context)).join('');
}

function compileInlineContent(content: d.Inline[], context: Context): string {
  return content.map((inline) => compileInline(inline, context)).join('');
}

function compileBlock(block: d.Block, context: Context): string {
  switch (block.type) {
    case 'heading':
      return compileHeading(block, context);
    case 'paragraph':
      return compileParagraph(block, context);
    case 'orderedList':
    case 'bulletList':
      return compileList(block, context);
    case 'orderedListPlaceholder':
    case 'bulletListPlaceholder':
      return compileListPlaceholder(block, context);
  }
}

function compileListItemContent(
  block: d.ListItem['content'][0],
  context: Context,
  simple = false,
): string {
  switch (block.type) {
    case 'heading':
      return compileHeading(block, context);
    case 'paragraph':
      return compileParagraph(block, context, simple);
  }
}

function compileInline(inline: d.Inline, context: Context): string {
  switch (inline.type) {
    case 'text':
      return compileText(inline);
    case 'textPlaceholder':
      return compileTextPlaceholder(inline, context);
  }
}

function compileListItem(listItem: d.ListItem, context: Context): string {
  const first = listItem.content.at(0);
  if (listItem.content.length == 1 && first) {
    const content = compileListItemContent(first, context, true);
    return `[${content}]`;
  }
  const content = listItem.content.map((block) =>
    compileListItemContent(block, context),
  );
  return `[${content.join('')}]`;
}

function compileList(
  list: d.OrderedList | d.BulletList,
  context: Context,
): string {
  if (list.content.length == 0) return '';
  const content = list.content.map((listItem) =>
    compileListItem(listItem, context),
  );
  const ordered = list.type == 'orderedList';
  return `${ordered ? '#enum' : '#list'}(` + content.join(',') + ')\n';
}

function compileListPlaceholder(
  listPlaceholder: d.OrderedListPlaceholder | d.BulletListPlaceholder,
  context: Context,
): string {
  const data = context.subData?.[listPlaceholder.attrs.id];
  if (!data) return '';
  if (listPlaceholder.content.length == 0) return '';

  const filter = listPlaceholder.attrs.filter;
  const items = filter ? data.filter((data) => compute(filter, data)) : data;
  if (items.length == 0) return '';

  const listItem: d.ListItem = {
    type: 'listItem',
    content: listPlaceholder.content,
  };
  const content = items.map((data) => compileListItem(listItem, { data }));
  const ordered = listPlaceholder.type == 'orderedListPlaceholder';
  return `${ordered ? '#enum' : '#list'}(` + content.join(',') + ')\n';
}

function compileText(text: d.Text): string {
  const escapedText = escapeForTypst(text.text);
  if (!text.marks) return escapedText;
  return text.marks.reduce((text, mark) => {
    switch (mark.type) {
      case 'italic':
        return `#emph[${text}]`;
      case 'bold':
        return `#strong[${text}]`;
      case 'underline':
        return `#underline[${text}]`;
      case 'highlight':
        return `#highlight[${text}]`;
      case 'strike':
        return `#strike[${text}]`;
      case 'code':
        return `#raw[${text}]`;
      case 'link':
        return `#link("${mark.attrs.href}")[${text}]`;
      default:
        return text;
    }
  }, escapedText);
}

function compileTextPlaceholder(
  textPlaceholder: d.TextPlaceholder,
  context: Context,
): string {
  const value = context.data[textPlaceholder.attrs.id];
  if (!value) return '';
  const formattedValue = formatValue(value);
  return escapeForTypst(formattedValue);
}

function config(attrs: d.Doc['attrs']) {
  const content = ['#show link: set text(fill: blue)'];

  const lang = attrs.language;
  if (lang) {
    content.push(`#set text(lang: "${lang}")`);
  }
  content.push(`#set document(title: "${escapeForTypst(attrs.title)}")`);
  return content.join('\n') + '\n';
}

function escapeForTypst(input: string): string {
  return input
    .replace(/\\/g, '\\\\') // backslash
    .replace(/#/g, '\\#') // hash (used for markup commands)
    .replace(/{/g, '\\{') // opening brace
    .replace(/}/g, '\\}') // closing brace
    .replace(/\[/g, '\\[') // opening bracket
    .replace(/\]/g, '\\]') // closing bracket
    .replace(/\*/g, '\\*') // asterisk
    .replace(/_/g, '\\_') // underscore
    .replace(/~/g, '\\~') // tilde (used for non-breaking space)
    .replace(/\^/g, '\\^') // caret (for superscripts)
    .replace(/\|/g, '\\|'); // vertical bar
}
