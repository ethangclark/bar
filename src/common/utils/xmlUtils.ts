import { failure, failureType } from "./result";

export function allTagContents({ tag, xml }: { tag: string; xml: string }) {
  const startTag = `<${tag}>`;
  const endTag = `</${tag}>`;

  const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, "gs");
  const matches = Array<string>();
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const m = match[1];
    if (m) {
      if (m.includes(startTag) || m.includes(endTag)) {
        return [];
      }
      matches.push(m.trim());
    }
  }

  const emptyTagCount =
    xml.split(new RegExp(`<${tag}>\s*</${tag}>`, "gs")).length - 1;
  for (let i = 0; i < emptyTagCount; i++) {
    matches.push("");
  }

  return matches;
}

export function oneOrNoneTagContents({
  tag,
  xml,
}: {
  tag: string;
  xml: string;
}) {
  const matches = allTagContents({ tag, xml: xml });
  const match = matches[0];
  if (matches.length > 1) {
    return failure(
      `Found ${matches.length} matches; expected 1 or 0.`,
      failureType.badXml,
      { xml, tag },
    );
  }
  return match ?? null;
}

export function oneTagContent({ tag, xml }: { tag: string; xml: string }) {
  const matches = allTagContents({ tag, xml });
  const match = matches[0];
  if (match === undefined || matches.length !== 1) {
    return failure(
      `Found ${matches.length} matches; expected 1.`,
      failureType.badXml,
      { xml, tag },
    );
  }
  return match;
}
