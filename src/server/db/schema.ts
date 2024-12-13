import { relations, type InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";
import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";

export const pgTable = pgTableCreator((name) => `drizzle_${name}`);

export const posts = pgTable(
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
  (example) => [
    index("post_created_by_id_idx").on(example.createdById),
    index("post_name_idx").on(example.name),
  ],
);
export type Post = InferSelectModel<typeof posts>;
export const postsRelations = relations(posts, ({ one }) => ({
  createdBy: one(users, {
    fields: [posts.createdById],
    references: [users.id],
  }),
}));
export const postSchema = createSelectSchema(posts);

export const users = pgTable("user", {
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
  enrollments: many(enrollments),
}));
export const userSchema = createSelectSchema(users);

export const ipUsers = pgTable(
  "ip_user",
  {
    ipAddress: text("ip_address").notNull().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (ipu) => [index("ip_user_user_id_idx").on(ipu.userId)],
);
export type IpUser = InferSelectModel<typeof ipUsers>;
export const ipUsersRelations = relations(ipUsers, ({ one }) => ({
  user: one(users, { fields: [ipUsers.userId], references: [users.id] }),
}));
export const ipUserSchema = createSelectSchema(ipUsers);

export const accounts = pgTable(
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
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    index("account_user_id_idx").on(account.userId),
  ],
);
export type Account = InferSelectModel<typeof accounts>;
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
export const accountSchema = createSelectSchema(accounts);

export const sessions = pgTable(
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
  (session) => [index("session_user_id_idx").on(session.userId)],
);
export type Session = InferSelectModel<typeof sessions>;
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
export const sessionSchema = createSelectSchema(sessions);

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);
export type VerificationToken = InferSelectModel<typeof verificationTokens>;
export const verificationTokensRelations = relations(
  verificationTokens,
  ({}) => ({}),
);
export const verificationTokensSchema = createSelectSchema(verificationTokens);

export const courseTypes = pgTable(
  "course_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
  },
  (course) => [index("course_type_name_idx").on(course.name)],
);
export type CourseType = InferSelectModel<typeof courseTypes>;
export const courseTypesRelations = relations(courseTypes, ({ many }) => ({
  courses: many(courses),
}));
export const courseTypeSchema = createSelectSchema(courseTypes);

export const courses = pgTable(
  "course",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    typeId: uuid("type_id")
      .notNull()
      .references(() => courseTypes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    acceptingEnrollments: boolean("accepting_enrollments").default(false),
  },
  (course) => [index("course_type_id_idx").on(course.typeId)],
);
export type Course = InferSelectModel<typeof courses>;
export const coursesRelations = relations(courses, ({ one, many }) => ({
  courseType: one(courseTypes, {
    fields: [courses.typeId],
    references: [courseTypes.id],
  }),
  units: many(units),
  enrollments: many(enrollments),
}));
export const courseSchema = createSelectSchema(courses);

export const enrollments = pgTable(
  "enrollment",
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
  (enrollment) => [
    index("enrollment_user_id_idx").on(enrollment.userId),
    index("enrollment_course_id_idx").on(enrollment.courseId),
  ],
);
export type Enrollment = InferSelectModel<typeof enrollments>;
export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  tutoringSessions: many(tutoringSessions),
}));
export const enrollmentSchema = createSelectSchema(enrollments);

export const units = pgTable(
  "unit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
  },
  (unit) => [
    index("unit_course_id_idx").on(unit.courseId),
    index("unit_name_idx").on(unit.name),
  ],
);
export type Unit = InferSelectModel<typeof units>;
export const unitsRelations = relations(units, ({ one, many }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  modules: many(modules),
}));
export const unitSchema = createSelectSchema(units);

export const modules = pgTable(
  "module",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
  },
  (module) => [
    index("module_unit_id_idx").on(module.unitId),
    index("module_name_idx").on(module.name),
  ],
);
export type Module = InferSelectModel<typeof modules>;
export const modulesRelations = relations(modules, ({ one, many }) => ({
  unit: one(units, {
    fields: [modules.unitId],
    references: [units.id],
  }),
  topics: many(topics),
}));
export const moduleSchema = createSelectSchema(modules);

export const topics = pgTable(
  "topic",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
  },
  (topic) => [
    index("topic_module_id_idx").on(topic.moduleId),
    index("topic_name_idx").on(topic.name),
  ],
);
export type Topic = InferSelectModel<typeof topics>;
export const topicsRelations = relations(topics, ({ one }) => ({
  module: one(modules, {
    fields: [topics.moduleId],
    references: [modules.id],
  }),
}));
export const topicSchema = createSelectSchema(topics);

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
export type DetailedEnrollment = Enrollment & {
  course: DetailedCourse;
};

export const tutoringSessions = pgTable(
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
      .references(() => enrollments.id, { onDelete: "cascade" }),
    conclusion: text("conclusion"),
    demonstratesMastery: boolean("demonstrates_mastery").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tutoringSession) => [
    index("tutoring_session_user_id_idx").on(tutoringSession.userId),
    index("tutoring_session_topic_id_idx").on(tutoringSession.topicId),
    index("tutoring_session_enrollment_id_idx").on(
      tutoringSession.enrollmentId,
    ),
  ],
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
    enrollment: one(enrollments, {
      fields: [tutoringSessions.enrollmentId],
      references: [enrollments.id],
    }),
  }),
);
export const tutoringSessionSchema = createSelectSchema(tutoringSessions);

export const senderRoleEnum = pgEnum("sender_role", [
  "user",
  "assistant",
  "system",
]);
export const senderRoleSchema = z.enum(senderRoleEnum.enumValues);
export type SenderRole = z.infer<typeof senderRoleSchema>;

export const chatMessages = pgTable(
  "chat_message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tutoringSessionId: uuid("tutoring_session_id")
      .notNull()
      .references(() => tutoringSessions.id, { onDelete: "cascade" }),
    senderRole: senderRoleEnum("sender_role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (cm) => [
    index("chat_message_user_id_idx").on(cm.userId),
    index("chat_message_tutoring_session_id_idx").on(cm.tutoringSessionId),
  ],
);
export type ChatMessage = InferSelectModel<typeof chatMessages>;
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
export const chatMessageSchema = createSelectSchema(chatMessages);
