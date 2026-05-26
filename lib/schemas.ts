import { z } from "zod";
import { QUESTIONS, type Question } from "@/content/survey-questions";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_KEY_RE = /^surveys\/[0-9a-f-]+\.(jpg|jpeg|png|webp)$/;

function trimmedRequired(max: number, label: string) {
  return z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, { error: `${label} is required.` })
    .max(max, { error: `${label} must be ${max} characters or fewer.` });
}

function optionalTrimmed(max: number, label: string) {
  return z.preprocess(
    (value) => {
      if (value == null) return null;
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    },
    z
      .string({ error: `${label} must be text.` })
      .max(max, { error: `${label} must be ${max} characters or fewer.` })
      .nullable(),
  );
}

function numberFromForm(
  label: string,
  opts: { min?: number; max?: number; int?: boolean } = {},
) {
  let schema = z.coerce.number({ error: `${label} must be a number.` });
  if (opts.int) {
    schema = schema.int({ error: `${label} must be a whole number.` });
  }
  if (opts.min !== undefined) {
    schema = schema.min(opts.min, {
      error: `${label} must be at least ${opts.min}.`,
    });
  }
  if (opts.max !== undefined) {
    schema = schema.max(opts.max, {
      error: `${label} must be at most ${opts.max}.`,
    });
  }

  return z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") return undefined;
      return value;
    },
    schema,
  );
}

function questionSchema(question: Question): z.ZodTypeAny {
  switch (question.type) {
    case "short_text":
    case "long_text": {
      const maxLength = question.maxLength ?? 1000;
      return z
        .string({ error: `${question.label} must be text.` })
        .trim()
        .max(maxLength, {
          error: `${question.label} must be ${maxLength} characters or fewer.`,
        });
    }
    case "number": {
      return numberFromForm(question.label, {
        min: question.min,
        max: question.max,
      });
    }
    case "scale_1_10":
      return numberFromForm(question.label, { min: 1, max: 10, int: true });
    case "single_choice":
      if (question.choices.length === 0) {
        return z.never({ error: `${question.label} has no choices.` });
      }
      return z.enum(question.choices as [string, ...string[]], {
        error: `${question.label} must be one of the listed choices.`,
      });
    case "multi_choice":
      if (question.choices.length === 0) {
        return z.array(z.never({ error: `${question.label} has no choices.` }));
      }
      return z.array(
        z.enum(question.choices as [string, ...string[]], {
          error: `${question.label} contains an invalid choice.`,
        }),
      );
  }
}

const AnswerShape: Record<string, z.ZodTypeAny> = {};
for (const question of QUESTIONS) {
  AnswerShape[question.id] = questionSchema(question).optional();
}

const UNIVERSITY_CHOICE = "University";
const COLLEGE_CHOICE = "College";

export const SurveyAnswersSchema = z
  .object(AnswerShape)
  .strict()
  .superRefine((answers, ctx) => {
    if (
      answers.whats_next !== UNIVERSITY_CHOICE &&
      answers.whats_next !== COLLEGE_CHOICE
    ) {
      return;
    }

    const schoolWorkplace = answers.school_workplace;
    if (
      typeof schoolWorkplace === "string" &&
      schoolWorkplace.trim().length > 0
    ) {
      return;
    }

    ctx.addIssue({
      code: "custom",
      path: ["school_workplace"],
      message: "Where you're going / working is required.",
    });
  });

export const SurveyFormSchema = z.object({
  display_name: trimmedRequired(80, "Display name"),
  photo_key: z
    .string({ error: "Photo is required." })
    .trim()
    .regex(PHOTO_KEY_RE, { error: "Upload a JPEG, PNG, or WebP photo first." }),
  instagram_handle: optionalTrimmed(60, "Instagram handle").refine(
    (value) => value == null || !value.startsWith("@"),
    { error: "Instagram handle should not include @." },
  ),
  linkedin: z
    .string({ error: "LinkedIn handle must be text." })
    .trim()
    .max(200, { error: "LinkedIn handle must be 200 characters or fewer." })
    .optional(),
  answers: SurveyAnswersSchema,
});

export type SurveyFormInput = z.infer<typeof SurveyFormSchema>;
export { MAX_PHOTO_BYTES };
