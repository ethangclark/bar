import { relations, type InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";
import { z } from "zod";
import { type Role, roleSchema } from "../ai/llm/schemas";

export const createTable = pgTableCreator((name) => `drizzle_${name}`);

export const posts = createTable(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (example) => ({
    createdByIdIdx: index("post_created_by_id_idx").on(example.createdById),
    nameIndex: index("post_name_idx").on(example.name),
  }),
);

export const users = createTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }),
  tokensUsed: integer("tokens_used").default(0).notNull(),
  image: text("image"),
});
export type User = InferSelectModel<typeof users>;
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  courseEnrollments: many(courseEnrollments),
}));

export const ipUsers = createTable(
  "ip_user",
  {
    ipAddress: text("ip_address").notNull().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (ipu) => ({
    userIdIdx: index("ip_user_user_id_idx").on(ipu.userId),
  }),
);
export type IpUser = InferSelectModel<typeof ipUsers>;
export const ipUsersRelations = relations(ipUsers, ({ one }) => ({
  user: one(users, { fields: [ipUsers.userId], references: [users.id] }),
}));

export const accounts = createTable(
  "account",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);
export type Account = InferSelectModel<typeof accounts>;
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: text("session_token").notNull().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);
export type Session = InferSelectModel<typeof sessions>;
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);
export type VerificationToken = InferSelectModel<typeof verificationTokens>;

export const courseTypes = createTable(
  "course_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
  },
  (course) => ({
    nameIndex: index("course_type_name_idx").on(course.name),
  }),
);
export type CourseType = InferSelectModel<typeof courseTypes>;
export const courseTypesRelations = relations(courseTypes, ({ many }) => ({
  courses: many(courses),
  courseTypeVariants: many(variantTypes),
}));
export const courseTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
}) satisfies z.ZodType<CourseType>;

// E.g.: jurisdiction would be a course type variant on the bar exam course type.
// A course type could have multiple variants types.
export const variantTypes = createTable(
  "variant_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseTypeId: uuid("course_type_id")
      .notNull()
      .references(() => courseTypes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (variantType) => ({
    courseTypeIdIdx: index("variant_type_course_type_id_idx").on(
      variantType.courseTypeId,
    ),
    nameIndex: index("variant_type_name_idx").on(variantType.name),
  }),
);
export type VariantType = InferSelectModel<typeof variantTypes>;
export const variantTypesRelations = relations(
  variantTypes,
  ({ one, many }) => ({
    courseType: one(courseTypes, {
      fields: [variantTypes.courseTypeId],
      references: [courseTypes.id],
    }),
    options: many(variantOptions),
  }),
);
export const variantTypeSchema = z.object({
  id: z.string(),
  courseTypeId: z.string(),
  name: z.string(),
}) satisfies z.ZodType<VariantType>;

export const variantOptions = createTable(
  "variant_option",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantTypeId: uuid("variant_type_id")
      .notNull()
      .references(() => variantTypes.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
  },
  (variantOption) => ({
    compoundKey: primaryKey({
      columns: [variantOption.variantTypeId, variantOption.value],
    }),
  }),
);
export type VariantOption = InferSelectModel<typeof variantOptions>;
export const variantOptionsRelations = relations(
  variantOptions,
  ({ one, many }) => ({
    courseTypeVariant: one(variantTypes, {
      fields: [variantOptions.variantTypeId],
      references: [variantTypes.id],
    }),
    selections: many(variantSelections),
  }),
);

export const courses = createTable(
  "course",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    typeId: uuid("type_id")
      .notNull()
      .references(() => courseTypes.id, { onDelete: "cascade" }),
    creationDate: timestamp("creation_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (course) => ({
    typeIdIdx: index("course_type_id_idx").on(course.typeId),
  }),
);
export type Course = InferSelectModel<typeof courses>;
export const coursesRelations = relations(courses, ({ one, many }) => ({
  courseType: one(courseTypes, {
    fields: [courses.typeId],
    references: [courseTypes.id],
  }),
  units: many(units),
  enrollments: many(courseEnrollments),
}));
export const courseSchema = z.object({
  id: z.string(),
  typeId: z.string(),
  creationDate: z.date(),
}) satisfies z.ZodType<Course>;

export const courseEnrollments = createTable(
  "course_enrollment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (courseEnrollment) => ({
    userIdIdx: index("course_enrollment_user_id_idx").on(
      courseEnrollment.userId,
    ),
    courseIdIdx: index("course_enrollment_course_id_idx").on(
      courseEnrollment.courseId,
    ),
  }),
);
export type CourseEnrollment = InferSelectModel<typeof courseEnrollments>;
export const courseEnrollmentsRelations = relations(
  courseEnrollments,
  ({ one, many }) => ({
    user: one(users, {
      fields: [courseEnrollments.userId],
      references: [users.id],
    }),
    course: one(courses, {
      fields: [courseEnrollments.courseId],
      references: [courses.id],
    }),
    tutoringSessions: many(tutoringSessions),
  }),
);

export const variantSelections = createTable(
  "variant_selection",
  {
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => courseEnrollments.id, { onDelete: "cascade" }),
    variantOptionId: uuid("variant_option_id")
      .notNull()
      .references(() => variantOptions.id, { onDelete: "cascade" }),
  },
  (variantSelection) => ({
    compoundKey: primaryKey({
      columns: [
        variantSelection.enrollmentId,
        variantSelection.variantOptionId,
      ],
    }),
  }),
);
export type VariantSelection = InferSelectModel<typeof variantSelections>;
export const variantSelectionsRelations = relations(
  variantSelections,
  ({ one }) => ({
    enrollment: one(courseEnrollments, {
      fields: [variantSelections.enrollmentId],
      references: [courseEnrollments.id],
    }),
    variantOption: one(variantOptions, {
      fields: [variantSelections.variantOptionId],
      references: [variantOptions.id],
    }),
  }),
);

export const units = createTable(
  "unit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
  },
  (unit) => ({
    courseIdIdx: index("unit_course_id_idx").on(unit.courseId),
    nameIndex: index("unit_name_idx").on(unit.name),
  }),
);
export type Unit = InferSelectModel<typeof units>;
export const unitsRelations = relations(units, ({ one, many }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  modules: many(modules),
}));
export const unitSchema = z.object({
  id: z.string(),
  name: z.string(),
  courseId: z.string(),
}) satisfies z.ZodType<Unit>;

export const modules = createTable(
  "module",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
  },
  (module) => ({
    unitIdIdx: index("module_unit_id_idx").on(module.unitId),
    nameIndex: index("module_name_idx").on(module.name),
  }),
);
export type Module = InferSelectModel<typeof modules>;
export const modulesRelations = relations(modules, ({ one, many }) => ({
  unit: one(units, {
    fields: [modules.unitId],
    references: [units.id],
  }),
  topics: many(topics),
}));
export const moduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  unitId: z.string(),
}) satisfies z.ZodType<Module>;

export const topics = createTable(
  "topic",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
  },
  (topic) => ({
    moduleIdIdx: index("topic_module_id_idx").on(topic.moduleId),
    nameIndex: index("topic_name_idx").on(topic.name),
  }),
);
export type Topic = InferSelectModel<typeof topics>;
export const topicsRelations = relations(topics, ({ one }) => ({
  module: one(modules, {
    fields: [topics.moduleId],
    references: [modules.id],
  }),
}));
export const topicSchema = z.object({
  id: z.string(),
  name: z.string(),
  moduleId: z.string(),
}) satisfies z.ZodType<Topic>;

export const topicContextSchema = z.object({
  course: courseSchema,
  courseType: courseTypeSchema,
  unit: unitSchema,
  module: moduleSchema,
  topic: topicSchema,
});
export type TopicContext = z.infer<typeof topicContextSchema>;

export const detailedCourseSchema = courseSchema.extend({
  courseType: courseTypeSchema,
  units: z.array(
    unitSchema.extend({
      modules: z.array(
        moduleSchema.extend({
          topics: z.array(topicSchema),
        }),
      ),
    }),
  ),
});
export type DetailedCourse = z.infer<typeof detailedCourseSchema>;
export type DetailedEnrollment = CourseEnrollment & {
  course: DetailedCourse;
};

export const tutoringSessions = createTable(
  "tutoring_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => courseEnrollments.id, { onDelete: "cascade" }),
    conclusion: text("conclusion"),
    demonstratesMastery: boolean("demonstrates_mastery").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tutoringSession) => ({
    userIdIdx: index("tutoring_session_user_id_idx").on(tutoringSession.userId),
    topicIdIdx: index("tutoring_session_topic_id_idx").on(
      tutoringSession.topicId,
    ),
    enrollmentIdIdx: index("tutoring_session_enrollment_id_idx").on(
      tutoringSession.enrollmentId,
    ),
  }),
);
export type TutoringSession = InferSelectModel<typeof tutoringSessions>;
export const tutoringSessionsRelations = relations(
  tutoringSessions,
  ({ one }) => ({
    user: one(users, {
      fields: [tutoringSessions.userId],
      references: [users.id],
    }),
    topic: one(topics, {
      fields: [tutoringSessions.topicId],
      references: [topics.id],
    }),
    enrollment: one(courseEnrollments, {
      fields: [tutoringSessions.enrollmentId],
      references: [courseEnrollments.id],
    }),
  }),
);

export const chatMessages = createTable(
  "tutor_chat_message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tutoringSessionId: uuid("tutoring_session_id")
      .notNull()
      .references(() => tutoringSessions.id, { onDelete: "cascade" }),
    senderRole: text("sender_role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tcm) => ({
    userIdIdx: index("tutor_chat_message_user_id_idx").on(tcm.userId),
    tutoringSessionIdIdx: index(
      "tutor_chat_message_tutoring_session_id_idx",
    ).on(tcm.tutoringSessionId),
  }),
);
export type ChatMessage = Omit<
  InferSelectModel<typeof chatMessages>,
  "senderRole"
> & {
  senderRole: Role;
};
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
  tutoringSession: one(tutoringSessions, {
    fields: [chatMessages.tutoringSessionId],
    references: [tutoringSessions.id],
  }),
}));
export const chatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tutoringSessionId: z.string(),
  senderRole: roleSchema,
  content: z.string(),
  createdAt: z.date(),
}) satisfies z.ZodType<ChatMessage>;
