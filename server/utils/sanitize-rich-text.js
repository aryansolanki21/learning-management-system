import sanitizeHtml from "sanitize-html";

const richTextOptions = {
  allowedTags: [
    "p",
    "br",
    "hr",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "del",
    "strike",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ol",
    "ul",
    "li",
    "blockquote",
    "pre",
    "code",
    "a",
    "span",
    "div",
    "sub",
    "sup",
  ],

  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    li: ["data-list", "class"],
    ol: ["class"],
    ul: ["class"],
    p: ["class"],
    div: ["class"],
    h1: ["class"],
    h2: ["class"],
    h3: ["class"],
    h4: ["class"],
    h5: ["class"],
    h6: ["class"],
    span: ["class"],
  },

  allowedClasses: {
    p: [/^ql-align-(left|center|right|justify)$/],
    div: [/^ql-align-(left|center|right|justify)$/],
    h1: [/^ql-align-(left|center|right|justify)$/],
    h2: [/^ql-align-(left|center|right|justify)$/],
    h3: [/^ql-align-(left|center|right|justify)$/],
    h4: [/^ql-align-(left|center|right|justify)$/],
    h5: [/^ql-align-(left|center|right|justify)$/],
    h6: [/^ql-align-(left|center|right|justify)$/],
    ol: [/^ql-indent-[1-8]$/],
    ul: [/^ql-indent-[1-8]$/],
    li: [/^ql-indent-[1-8]$/],
    span: ["ql-ui"],
  },

  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,

  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
  },
};

const sanitizeRichText = (html) => {
  if (typeof html !== "string") {
    return "";
  }

  return sanitizeHtml(html, richTextOptions);
};

export default sanitizeRichText;
