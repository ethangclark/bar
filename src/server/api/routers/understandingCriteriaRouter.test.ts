const exampleResponse = `Here's a list of criteria that could be used to assess understanding of the Bar Exam Overview:

Knowledge Assessment Criteria:

1. Exam Components
- Ability to identify and describe all sections of the bar exam (MBE, MEE, MPT)
- Understanding of the weight/importance of each section
- Knowledge of time allocations for each component

2. Test Format
- Understanding of question types in each section
- Knowledge of scoring methods
- Comprehension of passing score requirements
- Understanding of test day procedures and timing

3. Subject Matter Coverage
- Ability to list all subjects tested on the MBE
- Knowledge of potential topics for MEE questions
- Understanding of skills tested in the MPT

4. Jurisdictional Requirements
- Knowledge of state-specific requirements
- Understanding of differences between UBE and non-UBE jurisdictions
- Awareness of jurisdiction-specific passing scores

5. Administrative Understanding
- Knowledge of application deadlines
- Understanding of character and fitness requirements
- Awareness of registration procedures
- Knowledge of testing accommodations process

6. Test-Taking Logistics
- Understanding of permitted/prohibited items
- Knowledge of exam day protocols
- Awareness of dress code and conduct requirements
- Understanding of break times and procedures

7. Preparation Requirements
- Understanding of recommended study timeline
- Knowledge of available preparation resources
- Awareness of common preparation strategies

Application Skills:

1. Planning Abilities
- Capability to create a study schedule
- Ability to prioritize subjects based on testing weight
- Skill in organizing preparation materials

2. Strategic Understanding
- Ability to explain effective approaches for each section
- Understanding of time management strategies
- Knowledge of common pitfalls and how to avoid them

Assessment Methods Could Include:

1. Written Evaluations
- Short answer questions about exam structure
- Essays explaining various components
- Creating study schedules

2. Multiple Choice Tests
- Questions about exam format
- Questions about administrative requirements
- Questions about subject matter coverage

3. Practical Demonstrations
- Explaining the exam structure to peers
- Creating sample study plans
- Identifying resources needed for preparation

4. Interactive Assessments
- Group discussions about preparation strategies
- Mock registration processes
- Timeline planning exercises

Success Indicators:

1. Basic Understanding
- Ability to accurately describe all exam components
- Knowledge of basic requirements and deadlines
- Understanding of scoring system

2. Intermediate Understanding
- Ability to explain relationships between components
- Knowledge of preparation strategies
- Understanding of jurisdiction-specific requirements

3. Advanced Understanding
- Ability to create comprehensive study plans
- Knowledge of advanced preparation techniques
- Understanding of strategic approaches to each section

Red Flags (Indicating Need for Review):

1. Confusion about:
- Basic exam structure
- Testing timeline
- Subject matter coverage
- Registration requirements

2. Inability to:
- Identify all exam components
- Understand scoring systems
- Recognize preparation requirements
- Plan study schedules

This criteria list can be adapted based on:
- Specific jurisdictional requirements
- Course duration and depth
- Student needs and backgrounds
- Available resources and materials`;

describe("exampleResponse", () => {
  it("is real long", () => {
    expect(exampleResponse.length).toBeGreaterThan(1000);
  });
});
