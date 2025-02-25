# Summit

Summit is a lesson administrator that drills students until they prove that they understand the material.

# A note on the DB schema

We assume that foreign keys imply a dependence on the referenced record. This is important for our descendent management pattern (see the `rectifyModifications` function), where we skip creation and editing of instances that reference an entity that is scheduled to be deleted in the same operation, and delete them instead

As an implication of the above: All columns should be limited to null | boolean | number | string values. This lets us make nice assumptions. (Can revisit this, but if we do, want to make sure we think through it thoroughly.)

# A note on the controller pattern

Controllers should not affect anything outside of the core CRUD objects they're abstractly designed for except through `enqueueSideEffect` callbacks (which can publish events to the FE using descendentPubSub)

# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

If you are not familiar with the different technologies used in this project, please refer to the respective docs and/or ask for help :)

- [Next.js](https://nextjs.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Ant Design](https://ant.design/)
- [What Changed](https://www.npmjs.com/package/@simbathesailor/use-what-changed)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
