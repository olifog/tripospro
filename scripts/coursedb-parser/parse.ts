import * as fs from "node:fs";
import * as path from "node:path";
import * as peggy from "peggy";

import { z } from "zod";

const TriposPartSchema = z.intersection(
  z.object({
    teaching_admin: z.record(z.string(), z.string()).optional(),
    title: z.string(),
    _label: z.string(),
    assessmentpage: z.number().optional(),
    note: z.string().optional(),
    showcode: z.number().optional(),
    supervisions: z.number().optional(),
    syllabus: z
      .union([
        z.intersection(
          z.record(z.string(), z.string()),
          z.object({
            editor: z.string().optional(),
            url: z.string().optional(),
            _label: z.string()
          })
        ),
        z.string()
      ])
      .optional(),
    triposexam: z.number().optional()
  }),
  z.record(z.string(), z.any())
);

const ClassSchema = z.intersection(
  z.object({
    _label: z.string(),
    supervisions: z.number().optional(),
    triposexam: z.number().optional()
  }),
  z.record(z.string(), z.any())
);

const CourseSchema = z.intersection(
  z.object({
    lecturer: z
      .union([z.string(), z.record(z.string(), z.string())])
      .optional(),
    classes: z
      .record(
        z.string(),
        z.union([z.string(), z.record(z.string(), z.string())])
      )
      .optional(),
    term: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
    hours: z.union([z.number(), z.record(z.string(), z.string())]).optional(),
    format: z.string().optional(),
    moodle: z.number().optional(),
    supervision_hours: z.number().optional(),
    _label: z.string(),
    prerequisites: z
      .union([z.string(), z.record(z.string(), z.string())])
      .optional()
  }),
  z.record(z.string(), z.any())
);

const LecturerSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.record(z.string(), z.any())
  ])
);

export const CourseDBSchema = z.intersection(
  z.object({
    myear: z.number().optional(),
    edit_url_course: z.string().optional(),
    edit_url_coursedb: z.string().optional(),
    menubar: z.number().optional(),
    recordings: z.number().optional(),
    supervisions: z.number().optional(),
    syllabus: z
      .object({
        editor: z.string().optional(),
        url: z.string().optional(),
        _label: z.string()
      })
      .optional(),
    "teaching-admin": z.record(z.string(), z.string()).optional(),
    "timetable-url": z.string().optional(),
    triposexam: z.number().optional(),
    groups: z.record(z.string(), TriposPartSchema).optional(),
    classes: z
      .record(z.string(), z.union([ClassSchema, z.string()]))
      .optional(),
    courses: z.record(z.string(), CourseSchema),
    lecturers: LecturerSchema
  }),
  z.record(z.string(), z.any())
);

// Define types for the parsed data

interface ParseOptions {
  content: string;
}

interface PeggyError extends Error {
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * Parse coursedb content using the Peggy grammar
 */
export function parseCourseDB({
  content
}: ParseOptions): z.infer<typeof CourseDBSchema> {
  // Load the grammar file
  const grammarPath = path.join(__dirname, "grammar.pegjs");
  const grammar = fs.readFileSync(grammarPath, "utf-8");

  // Create the parser using the grammar
  const parser = peggy.generate(grammar, {
    cache: true,
    allowedStartRules: ["Start"]
  });

  // Parse the content
  const result = parser.parse(content);

  const zodParsed = CourseDBSchema.parse(result);
  return zodParsed;
}
