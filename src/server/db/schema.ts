import { relations, type InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

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
  }).defaultNow(),
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
}));

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

export const courseEnrollments = createTable(
  "course_enrollment",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
  },
  (ce) => ({
    compoundKey: primaryKey({ columns: [ce.userId, ce.courseId] }),
  }),
);
export type CourseEnrollment = InferSelectModel<typeof courseEnrollments>;
export const courseEnrollmentsRelations = relations(
  courseEnrollments,
  ({ one }) => ({
    user: one(users, {
      fields: [courseEnrollments.userId],
      references: [users.id],
    }),
    course: one(courses, {
      fields: [courseEnrollments.courseId],
      references: [courses.id],
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
export const topicsRelations = relations(topics, ({ one, many }) => ({
  module: one(modules, {
    fields: [topics.moduleId],
    references: [modules.id],
  }),
  activities: many(activities),
}));

export const activities = createTable(
  "activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (activity) => ({
    topicIdIdx: index("activity_topic_id_idx").on(activity.topicId),
    nameIndex: index("activity_name_idx").on(activity.name),
    userIdIdx: index("activity_user_id_idx").on(activity.userId),
  }),
);
export type Activity = InferSelectModel<typeof activities>;
export const activitiesRelations = relations(activities, ({ one }) => ({
  topic: one(topics, {
    fields: [activities.topicId],
    references: [topics.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));
