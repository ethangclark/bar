/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  selectDescendents,
  mergeDescendents,
  createEmptyDescendents,
  indexDescendents,
} from "./descendentUtils";
import { type Descendents } from "~/server/descendents/types";

describe(selectDescendents.name, () => {
  const descendentTables = indexDescendents({
    ...createEmptyDescendents(),
    threads: [
      { id: "1", name: "Task 1" },
      { id: "2", name: "Task 2" },
      { id: "3", name: "Task 3" },
    ],
    messages: [
      { id: "4", name: "Subtask 1", taskId: "1" },
      { id: "5", name: "Subtask 2", taskId: "2" },
    ],
  } as any as Descendents);

  it("should return an empty object if no ids are provided", () => {
    const selected = selectDescendents(descendentTables, new Set());
    expect(selected).toEqual({
      ...createEmptyDescendents(),
      threads: [],
      messages: [],
    });
  });

  it("should return only the descendents with the given ids", () => {
    const selected = selectDescendents(descendentTables, new Set(["1", "4"]));
    expect(selected).toEqual({
      ...createEmptyDescendents(),
      threads: [{ id: "1", name: "Task 1" }],
      messages: [{ id: "4", name: "Subtask 1", taskId: "1" }],
    });
  });

  it("should return an empty array for a descendent type if none of the ids match", () => {
    const selected = selectDescendents(
      descendentTables,
      new Set(["99", "100"]),
    );
    expect(selected).toEqual({
      ...createEmptyDescendents(),
      threads: [],
      messages: [],
    });
  });
});

describe(mergeDescendents.name, () => {
  it("should add new descendents and update existing ones", () => {
    const initialDescendents = {
      ...createEmptyDescendents(),
      threads: [
        { id: "1", name: "Task 1" },
        { id: "2", name: "Task 2" },
      ],
      messages: [{ id: "3", name: "Subtask 1", taskId: "1" }],
    } as any as Descendents;
    const newDescendents = {
      ...createEmptyDescendents(),
      threads: [
        { id: "2", name: "Task 2 Updated" },
        { id: "4", name: "Task 4" },
      ],
      messages: [
        { id: "3", name: "Subtask 1 Updated", taskId: "1" },
        { id: "5", name: "Subtask 2", taskId: "4" },
      ],
    } as any as Descendents;
    const result = mergeDescendents(initialDescendents, newDescendents);
    expect(result).toEqual({
      ...createEmptyDescendents(),
      threads: [
        { id: "1", name: "Task 1" },
        { id: "2", name: "Task 2 Updated" },
        { id: "4", name: "Task 4" },
      ],
      messages: [
        { id: "3", name: "Subtask 1 Updated", taskId: "1" },
        { id: "5", name: "Subtask 2", taskId: "4" },
      ],
    });
  });

  it("should handle empty initial descendents", () => {
    const initialDescendents = {
      ...createEmptyDescendents(),
      threads: [],
      messages: [],
    } as any as Descendents;
    const newDescendents = {
      ...createEmptyDescendents(),
      threads: [{ id: "1", name: "Task 1" }],
      messages: [{ id: "2", name: "Subtask 1", taskId: "1" }],
    } as any as Descendents;
    const result = mergeDescendents(initialDescendents, newDescendents);
    expect(result).toEqual({
      ...createEmptyDescendents(),
      threads: [{ id: "1", name: "Task 1" }],
      messages: [{ id: "2", name: "Subtask 1", taskId: "1" }],
    });
  });

  it("should handle empty new descendents", () => {
    const initialDescendents = {
      ...createEmptyDescendents(),
      threads: [{ id: "1", name: "Task 1" }],
      messages: [{ id: "2", name: "Subtask 1", taskId: "1" }],
    } as any as Descendents;
    const newDescendents = {
      ...createEmptyDescendents(),
      threads: [],
      messages: [],
    } as any as Descendents;
    const result = mergeDescendents(initialDescendents, newDescendents);
    expect(result).toEqual(initialDescendents);
  });
});
