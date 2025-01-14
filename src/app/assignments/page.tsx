import React, { useCallback, useState } from "react";
import { stringAsNumberOr } from "~/common/utils/numberUtils";
import { api } from "~/trpc/react";

export function AssignmentsPage() {
  const [title, setTitle] = useState("");
  const [maxScoreStr, setMaxScoreStr] = useState("100");

  const { data: assignments = [], refetch } = api.lti.assignments.useQuery();
  const _createAssignmentMutation = api.lti.createAssignment.useMutation();

  const createAssignment = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const maxScore = stringAsNumberOr(maxScoreStr, -1);
      if (maxScore <= 0) {
        alert("Max score must be a positive number.");
      }
      await _createAssignmentMutation.mutateAsync({ title, maxScore });
      await refetch();
      alert("Assignment created!");
    },
    [_createAssignmentMutation, title, maxScoreStr, refetch],
  );

  return (
    <div style={{ margin: "40px" }}>
      <h1>Assignments</h1>
      <form
        onSubmit={createAssignment}
        style={{ width: "400px", display: "flex", flexDirection: "column" }}
      >
        <label>Assignment Title:</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>Max Score:</label>
        <input
          type="number"
          value={maxScoreStr}
          onChange={(e) => setMaxScoreStr(e.target.value)}
        />
        <br />
        <button type="submit">Create Assignment</button>
      </form>

      <hr />
      <h2>Existing Assignments</h2>
      <ul>
        {assignments.map((a) => (
          <li key={a.id}>
            {a.title} (Max Score: {a.maxScore})
          </li>
        ))}
      </ul>
    </div>
  );
}
export default AssignmentsPage;
