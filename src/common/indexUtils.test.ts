// src/common/indexUtils.test.ts
import { groupBy } from "./indexUtils";

describe("groupBy", () => {
  it("should group objects by the specified key", () => {
    const items = [
      { id: "1", category: "fruit", name: "apple" },
      { id: "2", category: "vegetable", name: "carrot" },
      { id: "3", category: "fruit", name: "banana" },
      { id: "4", category: "dairy", name: "milk" },
      { id: "5", category: "fruit", name: "orange" },
    ];

    const result = groupBy(items, "category");

    expect(result).toEqual({
      fruit: [
        { id: "1", category: "fruit", name: "apple" },
        { id: "3", category: "fruit", name: "banana" },
        { id: "5", category: "fruit", name: "orange" },
      ],
      vegetable: [{ id: "2", category: "vegetable", name: "carrot" }],
      dairy: [{ id: "4", category: "dairy", name: "milk" }],
    });
  });

  it("should handle empty arrays", () => {
    const items: Array<{ id: string; group: string }> = [];
    const result = groupBy(items, "group");
    expect(result).toEqual({});
  });

  it("should handle arrays with a single item", () => {
    const items = [{ id: "1", type: "single", value: 42 }];
    const result = groupBy(items, "type");
    expect(result).toEqual({
      single: [{ id: "1", type: "single", value: 42 }],
    });
  });

  it("should throw an error when objects have missing keys", () => {
    const items = [
      { id: "1", category: "fruit" },
      { id: "2" }, // missing category
      { id: "3", category: "vegetable" },
    ];

    expect(() => {
      groupBy(items, "category");
    }).toThrow("Item value for key category is undefined");
  });

  it("should group by numeric keys", () => {
    const items = [
      { id: "1", priority: 1, task: "Task A" },
      { id: "2", priority: 2, task: "Task B" },
      { id: "3", priority: 1, task: "Task C" },
    ];

    const result = groupBy(items, "priority");

    expect(result).toEqual({
      "1": [
        { id: "1", priority: 1, task: "Task A" },
        { id: "3", priority: 1, task: "Task C" },
      ],
      "2": [{ id: "2", priority: 2, task: "Task B" }],
    });
  });

  it("should group by boolean keys", () => {
    const items = [
      { id: "1", completed: true, task: "Task A" },
      { id: "2", completed: false, task: "Task B" },
      { id: "3", completed: true, task: "Task C" },
    ];

    const result = groupBy(items, "completed");

    expect(result).toEqual({
      true: [
        { id: "1", completed: true, task: "Task A" },
        { id: "3", completed: true, task: "Task C" },
      ],
      false: [{ id: "2", completed: false, task: "Task B" }],
    });
  });
});
