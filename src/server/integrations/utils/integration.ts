export type IntegrationType = "canvas";

type Assignment = { id: string; title: string };
type LmsAssignment = { exIdJson: string; title: string };

export type Integration = {
  type: IntegrationType;
  getAssignments: (userId: string) => Promise<Assignment[]>;
  submitAssignmentPoints: (
    assignmentId: string,
    points: number,
  ) => Promise<void>;
  getLmsAssignments: (userId: string) => Promise<LmsAssignment[]>;
};
