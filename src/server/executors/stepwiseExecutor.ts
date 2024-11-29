type ExecBase = (step: string) => Promise<ExecBase>;

async function execBase(
  params: Record<string, unknown> | null = null,
  initialStep: string,
): Promise<ExecBase> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const beginSteps = eval(`async (${Object.keys(params ?? {}).join(", ")}) => {
    ${initialStep}
    const execNextStep = (step) => {
      return eval(\`async () => {
        \${step};
        return (innerStep) => eval(execNextStep.toString())(innerStep)
      }\`)();
    }
    return execNextStep;
  }`);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const execNextStep: ExecBase = await beginSteps(
    ...Object.values(params ?? {}),
  );
  return execNextStep;
}

export type StepExecutor = { exec: (step: string) => Promise<void> };

export async function initializeStepwiseExecutor(
  params: Record<string, unknown> | null = null,
  initialStep: string,
): Promise<StepExecutor> {
  let execStep = await execBase(params, initialStep);
  return {
    async exec(step: string) {
      execStep = await execStep(step);
    },
  };
}
