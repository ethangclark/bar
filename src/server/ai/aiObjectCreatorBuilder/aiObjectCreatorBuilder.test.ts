import { describe, it, expect, vi } from "vitest";
import { aiObjectCreatorBuilder } from "./aiObjectCreatorBuilder";
import { assertIsNotFailure, failure, isFailure } from "~/common/utils/result";
import * as llm from "../llm";

vi.mock("../llm");
vi.mock("~/env");

describe("aiObjectCreatorBuilder", () => {
  it("should build a function that returns the correct structure", async () => {
    const mockLlmResponse = {
      response: "<answer_1>Test Response</answer_1>",
    } as Awaited<ReturnType<typeof llm.getResponseFromLlm>>;
    vi.spyOn(llm, "getResponseFromLlm").mockResolvedValue(mockLlmResponse);

    const builder = aiObjectCreatorBuilder("noImg", "Test Introduction");
    const builtFunction = builder
      .add({
        slug: "testField",
        prompt: "Test Prompt",
      })
      .build();

    const result = await builtFunction({ userId: "testUser" });

    assertIsNotFailure(result);
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("prompts");
    expect(result.data).toHaveProperty("testField", "Test Response");
  });

  it("should handle custom ingest functions", async () => {
    const mockLlmResponse = {
      response: "<answer_1>42</answer_1>",
    } as Awaited<ReturnType<typeof llm.getResponseFromLlm>>;
    vi.spyOn(llm, "getResponseFromLlm").mockResolvedValue(mockLlmResponse);

    const builder = aiObjectCreatorBuilder("noImg", "Test Introduction");
    const builtFunction = builder
      .add({
        slug: "_numberField",
        prompt: "Give me a number",
        ingestResponse: ({ slug, response, prev }) => ({
          ...prev,
          [slug]: response,
          numberField: parseInt(response, 10),
        }),
      })
      .build();

    const result = await builtFunction({ userId: "testUser" });

    expect(isFailure(result)).toBe(false);
    expect(result).toHaveProperty("data");
    expect(result.data).toHaveProperty("numberField", 42);
  });

  it("should handle conditional transforms", async () => {
    const mockLlmResponse = {
      response: "<answer_1>Original</answer_1><answer_2>Transform</answer_2>",
    } as Awaited<ReturnType<typeof llm.getResponseFromLlm>>;
    vi.spyOn(llm, "getResponseFromLlm").mockResolvedValue(mockLlmResponse);

    const builder = aiObjectCreatorBuilder("noImg", "Test Introduction");
    const builtFunction = builder
      .add({
        slug: "originalField",
        prompt: "Original prompt",
      })
      .conditionalTransform({
        condition: true,
        slug: "transformField",
        prompt: "Transform prompt",
        transform: (response, base) => ({
          ...base,
          transformField: response.toUpperCase(),
        }),
      })
      .build();

    const result = await builtFunction({ userId: "testUser" });

    expect(result).toHaveProperty("data");
    expect(isFailure(result)).toBe(false);
    expect(result.data).toHaveProperty("originalField", "Original");
    expect(result.data).toHaveProperty("transformField", "TRANSFORM");
  });

  it("should handle LLM failures", async () => {
    vi.spyOn(llm, "getResponseFromLlm").mockResolvedValue(
      failure("LLM Error.", "badAiResponse"),
    );

    const builder = aiObjectCreatorBuilder("noImg", "Test Introduction");
    const builtFunction = builder
      .add({
        slug: "testField",
        prompt: "Test Prompt",
      })
      .build();

    const result = await builtFunction({ userId: "testUser" });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.problem).toBe("LLM Error.");
      expect(result.type).toBe("badAiResponse");
    }
  });

  it("should handle invalid response format", async () => {
    const mockLlmResponse = {
      response: "Invalid response without XML tags",
    } as Awaited<ReturnType<typeof llm.getResponseFromLlm>>;
    vi.spyOn(llm, "getResponseFromLlm").mockResolvedValue(mockLlmResponse);

    const builder = aiObjectCreatorBuilder("noImg", "Test Introduction");
    const builtFunction = builder
      .add({
        slug: "testField",
        prompt: "Test Prompt",
      })
      .build();

    const result = await builtFunction({ userId: "testUser" });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.problem).toContain(
        "Response received from AI did not contain response for field",
      );
      expect(result.type).toBe("badAiResponse");
    }
  });

  it("should handle ingest function failures", async () => {
    const mockLlmResponse = {
      response: "<answer_1>Invalid Input</answer_1>",
    } as Awaited<ReturnType<typeof llm.getResponseFromLlm>>;
    vi.spyOn(llm, "getResponseFromLlm").mockResolvedValue(mockLlmResponse);

    const builder = aiObjectCreatorBuilder("noImg", "Test Introduction");
    const builtFunction = builder
      .add({
        slug: "testField",
        prompt: "Test Prompt",
        ingestResponse: () =>
          failure("Ingest function error.", "badAiResponse"),
      })
      .build();

    const result = await builtFunction({ userId: "testUser" });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.problem).toContain("Error ingesting response for field");
      expect(result.type).toBe("badAiResponse");
    }
  });

  it("should handle transform function failures", async () => {
    const mockLlmResponse = {
      response: "<answer_1>Original</answer_1><answer_2>Transform</answer_2>",
    } as Awaited<ReturnType<typeof llm.getResponseFromLlm>>;
    vi.spyOn(llm, "getResponseFromLlm").mockResolvedValue(mockLlmResponse);

    const builder = aiObjectCreatorBuilder("noImg", "Test Introduction");
    const builtFunction = builder
      .add({
        slug: "originalField",
        prompt: "Original prompt",
      })
      .conditionalTransform({
        condition: true,
        slug: "transformField",
        prompt: "Transform prompt",
        transform: () => failure("Transform function error.", "badAiResponse"),
      })
      .build();

    const result = await builtFunction({ userId: "testUser" });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.problem).toContain("Error transforming response for field");
      expect(result.type).toBe("badAiResponse");
    }
  });

  it("should not apply conditional transforms when condition is false", async () => {
    const mockLlmResponse = {
      response: "<answer_1>Original</answer_1>",
    } as Awaited<ReturnType<typeof llm.getResponseFromLlm>>;
    vi.spyOn(llm, "getResponseFromLlm").mockResolvedValue(mockLlmResponse);

    const builder = aiObjectCreatorBuilder("noImg", "Test Introduction");
    const builtFunction = builder
      .add({
        slug: "originalField",
        prompt: "Original prompt",
      })
      .conditionalTransform({
        condition: false,
        slug: "transformField",
        prompt: "Transform prompt",
        transform: (response, base) => ({
          ...base,
          transformField: response.toUpperCase(),
        }),
      })
      .build();

    const result = await builtFunction({ userId: "testUser" });

    expect(isFailure(result)).toBe(false);
    expect(result).toHaveProperty("data");
    expect(result.data).toHaveProperty("originalField", "Original");
    expect(result.data).not.toHaveProperty("transformField");
  });
});
