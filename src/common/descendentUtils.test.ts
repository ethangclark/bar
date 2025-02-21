/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createEmptyDescendents,
  indexDescendents,
  selectDescendents,
  type Descendents,
} from "./descendentUtils";

describe(selectDescendents.name, () => {
  const tables = indexDescendents({
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
    const selected = selectDescendents(tables, new Set());
    expect(selected).toEqual({
      ...createEmptyDescendents(),
      threads: [],
      messages: [],
    });
  });

  it("should return only the descendents with the given ids", () => {
    const selected = selectDescendents(tables, new Set(["1", "4"]));
    expect(selected).toEqual({
      ...createEmptyDescendents(),
      threads: [{ id: "1", name: "Task 1" }],
      messages: [{ id: "4", name: "Subtask 1", taskId: "1" }],
    });
  });

  it("should return an empty array for a descendent type if none of the ids match", () => {
    const selected = selectDescendents(tables, new Set(["99", "100"]));
    expect(selected).toEqual({
      ...createEmptyDescendents(),
      threads: [],
      messages: [],
    });
  });
});
