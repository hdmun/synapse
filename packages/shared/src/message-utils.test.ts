import { test, expect, describe } from "bun:test";
import { extractMessageSummary, cleanMessageContent } from "./message-utils";

describe("message-utils", () => {
  describe("extractMessageSummary", () => {
    test("falsy content returns undefined", () => {
      expect(extractMessageSummary(null)).toBeUndefined();
      expect(extractMessageSummary(undefined)).toBeUndefined();
      expect(extractMessageSummary("")).toBeUndefined();
    });

    test("plain string returns normalized summary", () => {
      expect(extractMessageSummary("Hello world")).toBe("Hello world");
    });

    test("JSON string starting with { extracts text", () => {
      const jsonStr = JSON.stringify({ text: "Extracted from object JSON" });
      expect(extractMessageSummary(jsonStr)).toBe("Extracted from object JSON");
    });

    test("JSON string starting with [ extracts text from items", () => {
      const jsonArr = JSON.stringify([{ text: "First array item text" }, { text: "Second" }]);
      expect(extractMessageSummary(jsonArr)).toBe("First array item text");
    });

    test("JSON-like string failing to parse falls back to original string", () => {
      const invalidJson = "{ invalid: json, string";
      expect(extractMessageSummary(invalidJson)).toBe("{ invalid: json, string");

      const invalidJsonArr = "[ not really json";
      expect(extractMessageSummary(invalidJsonArr)).toBe("[ not really json");
    });

    test("object with nested parts array traverses recursively", () => {
      const obj = {
        parts: [
          null,
          { notText: 123 },
          { parts: [{ text: "Found in nested parts" }] }
        ]
      };
      expect(extractMessageSummary(obj)).toBe("Found in nested parts");
    });

    test("array input extracts first text item", () => {
      const input = [
        null,
        { content: "Text from content prop in array" },
        "raw string"
      ];
      expect(extractMessageSummary(input)).toBe("Text from content prop in array");
    });

    test("object with text or content keys", () => {
      expect(extractMessageSummary({ text: "Hello text" })).toBe("Hello text");
      expect(extractMessageSummary({ content: "Hello content" })).toBe("Hello content");
    });

    test("normalizes multiple whitespace and newlines", () => {
      const input = "  Hello \n\n  world\t\r from   synapse! \n";
      expect(extractMessageSummary(input)).toBe("Hello world from synapse!");
    });

    test("truncates long input exceeding default maxLength (80)", () => {
      const longText = "a".repeat(100);
      const result = extractMessageSummary(longText);
      expect(result).toBe("a".repeat(80) + "...");
      expect(result?.length).toBe(83);
    });

    test("truncates input exceeding custom maxLength", () => {
      const text = "1234567890abcdef";
      const result = extractMessageSummary(text, 10);
      expect(result).toBe("1234567890...");
      expect(result?.length).toBe(13);
    });

    test("object where text cannot be found falls back to JSON.stringify", () => {
      const obj = { foo: "bar", count: 42 };
      expect(extractMessageSummary(obj)).toBe(JSON.stringify(obj));
    });
  });

  describe("cleanMessageContent", () => {
    test("string input returns identical string", () => {
      expect(cleanMessageContent("plain text message")).toBe("plain text message");
      expect(cleanMessageContent("")).toBe("");
    });

    test("array containing only { text: '' } filters out to empty string", () => {
      const input = [{ text: "" }, { text: "" }];
      expect(cleanMessageContent(input)).toBe("");
    });

    test("array with single item remaining after filter returns that item if string", () => {
      const input = [{ text: "" }, "remaining text", { text: "" }];
      expect(cleanMessageContent(input)).toBe("remaining text");
    });

    test("array with multiple items remaining after filter returns JSON string", () => {
      const input = [{ text: "" }, "first", "second"];
      expect(cleanMessageContent(input)).toBe(JSON.stringify(["first", "second"]));

      const objInput = [{ text: "" }, { text: "valid" }, { other: 123 }];
      expect(cleanMessageContent(objInput)).toBe(JSON.stringify([{ text: "valid" }, { other: 123 }]));
    });

    test("standalone { text: '' } returns empty string", () => {
      expect(cleanMessageContent({ text: "" })).toBe("");
    });

    test("regular object returns JSON string", () => {
      const obj = { text: "hello", status: "ok" };
      expect(cleanMessageContent(obj)).toBe(JSON.stringify(obj));

      const emptyObj = {};
      expect(cleanMessageContent(emptyObj)).toBe(JSON.stringify(emptyObj));
    });
  });
});
