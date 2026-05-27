"use client";

import {
  Fragment,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import colleges from "@/content/colleges.json";
import collegePrograms from "@/content/collegeprograms.json";
import { QUESTIONS, type Question } from "@/content/survey-questions";
import universities from "@/content/universities.json";
import universityPrograms from "@/content/universityprograms.json";
import { submitSurvey, type SubmitSurveyState } from "@/app/survey/actions";
import { LongText } from "@/components/survey/LongText";
import { MultiChoice } from "@/components/survey/MultiChoice";
import { NumberInput } from "@/components/survey/NumberInput";
import { PhotoUpload } from "@/components/survey/PhotoUpload";
import { ScaleSlider } from "@/components/survey/ScaleSlider";
import { ShortText } from "@/components/survey/ShortText";
import { SingleChoice } from "@/components/survey/SingleChoice";

function SubmitButton({
  disabled,
  pending,
}: {
  disabled: boolean;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="jf-survey-btn-submit"
    >
      {pending ? "Submitting..." : "Submit survey"}
    </button>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="jf-survey-error">
      {error}
    </p>
  );
}

function firstError(state: SubmitSurveyState, field: string) {
  return state?.fieldErrors?.[field]?.[0];
}

const UNIVERSITY_CHOICE = "University";
const COLLEGE_CHOICE = "College";
const TRADES_CHOICE = "Trades/Apprenticeship";

type UploadURLResponse = {
  url: string;
  key: string;
  expires_at: string;
};

async function responseBody(response: Response) {
  const text = await response.text();
  if (!text) return response.statusText;

  try {
    const body = JSON.parse(text) as unknown;
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      body.error &&
      typeof body.error === "object" &&
      "message" in body.error &&
      typeof body.error.message === "string"
    ) {
      return body.error.message;
    }
  } catch {
    // Fall through to the raw response text.
  }

  return text;
}

async function uploadPhotoOnSubmit(file: File) {
  const signedUrlResponse = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content_type: file.type,
      content_length: file.size,
    }),
  });

  if (!signedUrlResponse.ok) {
    throw new Error(await responseBody(signedUrlResponse));
  }

  const signed = (await signedUrlResponse.json()) as UploadURLResponse;
  const putResponse = await fetch(signed.url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error(await responseBody(putResponse));
  }

  return signed.key;
}

function SchoolWorkplaceInput({
  question,
  name,
  error,
  whatsNext,
}: {
  question: Extract<Question, { type: "short_text" }>;
  name: string;
  error?: string;
  whatsNext: string;
}) {
  const id = `answer-${question.id}`;
  const list =
    whatsNext === UNIVERSITY_CHOICE
      ? { id: "universities-list", values: universities }
      : whatsNext === COLLEGE_CHOICE
        ? { id: "colleges-list", values: colleges }
        : null;

  if (!list) {
    return <ShortText question={question} name={name} error={error} />;
  }

  return (
    <div className="jf-survey-field">
      <label htmlFor={id}>{question.label}</label>
      <input
        id={id}
        name={name}
        type="text"
        list={list.id}
        maxLength={question.maxLength}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <datalist id={list.id}>
        {list.values.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      {error ? (
        <p id={`${id}-error`} className="jf-survey-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ProgramMajorInput({
  question,
  name,
  error,
  whatsNext,
}: {
  question: Extract<Question, { type: "short_text" }>;
  name: string;
  error?: string;
  whatsNext: string;
}) {
  const id = `answer-${question.id}`;
  const list =
    whatsNext === UNIVERSITY_CHOICE
      ? { id: "university-programs-list", values: universityPrograms }
      : whatsNext === COLLEGE_CHOICE || whatsNext === TRADES_CHOICE
        ? { id: "college-programs-list", values: collegePrograms }
        : null;

  if (!list) {
    return <ShortText question={question} name={name} error={error} />;
  }

  return (
    <div className="jf-survey-field">
      <label htmlFor={id}>{question.label}</label>
      <input
        id={id}
        name={name}
        type="text"
        list={list.id}
        maxLength={question.maxLength}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <datalist id={list.id}>
        {list.values.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      {error ? (
        <p id={`${id}-error`} className="jf-survey-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function QuestionInput({
  question,
  error,
  whatsNext,
}: {
  question: Question;
  error?: string;
  whatsNext: string;
}) {
  const name = `answers.${question.id}`;

  if (question.id === "school_workplace" && question.type === "short_text") {
    return (
      <SchoolWorkplaceInput
        question={question}
        name={name}
        error={error}
        whatsNext={whatsNext}
      />
    );
  }

  if (question.id === "program_major" && question.type === "short_text") {
    return (
      <ProgramMajorInput
        question={question}
        name={name}
        error={error}
        whatsNext={whatsNext}
      />
    );
  }

  switch (question.type) {
    case "short_text":
      return <ShortText question={question} name={name} error={error} />;
    case "long_text":
      return <LongText question={question} name={name} error={error} />;
    case "number":
      return <NumberInput question={question} name={name} error={error} />;
    case "scale_1_10":
      return <ScaleSlider question={question} name={name} error={error} />;
    case "single_choice":
      return <SingleChoice question={question} name={name} error={error} />;
    case "multi_choice":
      return <MultiChoice question={question} name={name} error={error} />;
  }
}

type Step = 1 | 2 | 3 | 4 | 5;

const TOTAL_STEPS = 5;
const STEP_LABELS = ["Profile", "School", "Looking Back", "What's Next", "Review"];
const QUESTION_BY_ID = new Map(QUESTIONS.map((question) => [question.id, question]));

const FIELD_STEP: Record<string, Step> = {
  display_name: 1,
  photo_key: 1,
  instagram_handle: 1,
  linkedin: 1,
  "answers.senior_quote": 1,
  "answers.pronouns": 1,
  "answers.top_courses": 2,
  "answers.hardest_course": 2,
  "answers.specialized_program": 2,
  "answers.final_grade_bucket": 2,
  "answers.avg_sleep": 2,
  "answers.study_hours": 2,
  "answers.stress": 2,
  "answers.screen_time": 2,
  "answers.class_defined": 3,
  "answers.miss_most": 3,
  "answers.relive_event": 3,
  "answers.advice_grade9": 3,
  "answers.whats_next": 4,
  "answers.school_workplace": 4,
  "answers.program_major": 4,
  "answers.excited_for": 4,
  "answers.ten_years": 4,
};

function question(id: string) {
  const found = QUESTION_BY_ID.get(id);
  if (!found) {
    throw new Error(`Missing survey question: ${id}`);
  }
  return found;
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { first: parts[0] ?? "", last: "" };
  }

  return {
    first: parts[0],
    last: parts.slice(1).join(" "),
  };
}

function fullDisplayName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function scrollToTop() {
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function earliestErrorStep(fieldErrors?: Record<string, string[]>) {
  if (!fieldErrors) return null;

  let earliest: Step | null = null;
  for (const field of Object.keys(fieldErrors)) {
    const candidate = FIELD_STEP[field];
    if (!candidate) continue;
    if (earliest === null || candidate < earliest) earliest = candidate;
  }

  return earliest;
}

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="jf-survey-progress" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
      <div className="jf-survey-progress-steps" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => {
          const current = (index + 1) as Step;
          const dotState =
            current < step ? "done" : current === step ? "active" : "inactive";

          return (
            <Fragment key={current}>
              <span className="jf-survey-step-dot" data-state={dotState}>
                <span>{current}</span>
              </span>
              {current < TOTAL_STEPS ? (
                <span
                  className="jf-survey-step-line"
                  data-state={current < step ? "done" : "inactive"}
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
      <div className="jf-survey-step-labels">
        {STEP_LABELS.map((label, index) => (
          <span
            key={label}
            className="jf-survey-step-label"
            data-state={index + 1 === step ? "active" : "inactive"}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function WizardStep({
  step,
  activeStep,
  children,
}: {
  step: Step;
  activeStep: Step;
  children: ReactNode;
}) {
  const isActive = step === activeStep;

  return (
    <section
      className={`jf-survey-step${isActive ? " is-active" : ""}`}
      style={{ display: isActive ? undefined : "none" }}
      aria-hidden={isActive ? undefined : true}
    >
      {children}
    </section>
  );
}

function valueFrom(formData: FormData | null, name: string) {
  const value = formData?.get(name);
  if (typeof value !== "string") return "—";
  const trimmed = value.trim();
  return trimmed ? trimmed : "—";
}

function sliderValue(
  formData: FormData | null,
  name: string,
  suffix: string,
  decimals: number,
  trailing = "",
) {
  const value = formData?.get(name);
  if (typeof value !== "string") return "—";

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";

  return `${parsed.toFixed(decimals)}${suffix}${trailing}`;
}

function quoted(value: string) {
  return value === "—" ? value : `"${value}"`;
}

function ReviewBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="jf-survey-review-block">
      <div className="jf-survey-review-block-title">{title}</div>
      {children}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  alignCenter = false,
}: {
  label: string;
  value: ReactNode;
  alignCenter?: boolean;
}) {
  return (
    <div
      className="jf-survey-review-row"
      style={alignCenter ? { alignItems: "center" } : undefined}
    >
      <span className="jf-survey-review-key">{label}</span>
      <span className="jf-survey-review-val">{value}</span>
    </div>
  );
}

function ReviewPanel({
  formData,
  firstName,
  lastName,
  photoPreviewUrl,
  photoFile,
  photoKey,
}: {
  formData: FormData | null;
  firstName: string;
  lastName: string;
  photoPreviewUrl: string | null;
  photoFile: File | null;
  photoKey: string;
}) {
  const name = fullDisplayName(firstName, lastName) || "—";
  const photoLabel = photoPreviewUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoPreviewUrl}
      alt=""
      style={{
        width: 64,
        height: 64,
        borderRadius: 6,
        objectFit: "cover",
      }}
    />
  ) : photoKey ? (
    "Uploaded"
  ) : photoFile ? (
    photoFile.name
  ) : (
    "— no photo —"
  );

  return (
    <div>
      <ReviewBlock title="Profile">
        <ReviewRow label="Photo" value={photoLabel} alignCenter />
        <ReviewRow label="Name" value={name} />
        <ReviewRow
          label="Senior Quote"
          value={quoted(valueFrom(formData, "answers.senior_quote"))}
        />
        <ReviewRow label="Pronouns" value={valueFrom(formData, "answers.pronouns")} />
        <ReviewRow label="Instagram" value={valueFrom(formData, "instagram_handle")} />
        <ReviewRow label="LinkedIn" value={valueFrom(formData, "linkedin")} />
      </ReviewBlock>

      <ReviewBlock title="School Life">
        <ReviewRow
          label="Favourite course"
          value={valueFrom(formData, "answers.top_courses")}
        />
        <ReviewRow
          label="Hardest course"
          value={valueFrom(formData, "answers.hardest_course")}
        />
        <ReviewRow
          label="Specialized program"
          value={valueFrom(formData, "answers.specialized_program")}
        />
        <ReviewRow
          label="Sem 2 midterm avg"
          value={valueFrom(formData, "answers.final_grade_bucket")}
        />
        <ReviewRow
          label="Sleep"
          value={sliderValue(formData, "answers.avg_sleep", "h", 1, "/night")}
        />
        <ReviewRow
          label="Study"
          value={sliderValue(formData, "answers.study_hours", "h", 0, "/week")}
        />
        <ReviewRow
          label="Stress"
          value={sliderValue(formData, "answers.stress", "/10", 0)}
        />
        <ReviewRow
          label="Screen time"
          value={sliderValue(formData, "answers.screen_time", "h", 1, "/day")}
        />
      </ReviewBlock>

      <ReviewBlock title="Looking Back">
        <ReviewRow
          label="Class of '26 was"
          value={valueFrom(formData, "answers.class_defined")}
        />
        <ReviewRow label="Will miss" value={valueFrom(formData, "answers.miss_most")} />
        <ReviewRow
          label="Would relive"
          value={valueFrom(formData, "answers.relive_event")}
        />
        <ReviewRow
          label="Advice to G9"
          value={quoted(valueFrom(formData, "answers.advice_grade9"))}
        />
      </ReviewBlock>

      <ReviewBlock title="What's Next">
        <ReviewRow
          label="After grad"
          value={valueFrom(formData, "answers.whats_next")}
        />
        <ReviewRow
          label="Going / working"
          value={valueFrom(formData, "answers.school_workplace")}
        />
        <ReviewRow
          label="Program / major"
          value={valueFrom(formData, "answers.program_major")}
        />
        <ReviewRow
          label="Excited for"
          value={valueFrom(formData, "answers.excited_for")}
        />
        <ReviewRow label="In 10 years" value={valueFrom(formData, "answers.ten_years")} />
      </ReviewBlock>
    </div>
  );
}

function SuccessScreen() {
  return (
    <section className="jf-survey-success is-active">
      <div className="jf-survey-success-icon" aria-hidden="true">
        🎓
      </div>
      <h2 className="jf-survey-success-title">Information is submitted!</h2>
      <p className="jf-survey-success-sub">Class of 26&apos;</p>
      <p className="jf-survey-success-desc">
        May take up to one day to show on the directory and stats page!
      </p>
      <a href="/directory" className="jf-survey-btn-next">
        View Directory →
      </a>
    </section>
  );
}

export function SurveyForm({
  defaultDisplayName,
}: {
  defaultDisplayName: string;
}) {
  const initialName = splitDisplayName(defaultDisplayName);
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState(initialName.first);
  const [lastName, setLastName] = useState(initialName.last);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoKey, setPhotoKey] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [whatsNext, setWhatsNext] = useState("");
  const [reviewFormData, setReviewFormData] = useState<FormData | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (
      prev: SubmitSurveyState,
      formData: FormData,
    ): Promise<SubmitSurveyState> => {
      formData.set("display_name", fullDisplayName(firstName, lastName));

      let key = photoKey;

      if (!key) {
        if (!photoFile) {
          setStep(1);
          scrollToTop();
          return {
            error: "Please fix the highlighted fields.",
            fieldErrors: { photo_key: ["Photo is required."] },
          };
        }

        setIsUploadingPhoto(true);
        try {
          key = await uploadPhotoOnSubmit(photoFile);
          setPhotoKey(key);
        } catch (e) {
          setStep(1);
          scrollToTop();
          return {
            error: "Photo upload failed.",
            fieldErrors: {
              photo_key: [e instanceof Error ? e.message : String(e)],
            },
          };
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      formData.set("photo_key", key);
      const result = await submitSurvey(prev, formData);
      const targetStep = earliestErrorStep(result?.fieldErrors);
      if (targetStep) {
        setStep(targetStep);
        scrollToTop();
      }
      if (!result?.error && !result?.fieldErrors) {
        setSubmitted(true);
      }
      return result;
    },
    null,
  );
  const displayName = fullDisplayName(firstName, lastName);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  function handleChange(event: ChangeEvent<HTMLFormElement>) {
    const target = event.target;
    if (
      target instanceof HTMLInputElement &&
      target.name === "answers.whats_next"
    ) {
      setWhatsNext(target.value);
    }
  }

  function goTo(nextStep: Step) {
    if (nextStep === 5 && formRef.current) {
      setReviewFormData(new FormData(formRef.current));
    }
    setStep(nextStep);
    scrollToTop();
  }

  function handlePhotoSelected(file: File | null) {
    setPhotoFile(file);
    setPhotoKey("");
    setPhotoPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  if (submitted) {
    return (
      <div className="jf-survey-form-outer">
        <div className="jf-survey-form-card">
          <SuccessScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="jf-survey-form-outer">
      <ProgressBar step={step} />
      <form
        ref={formRef}
        action={formAction}
        onChange={handleChange}
        className="jf-survey-form-card"
      >
        <input type="hidden" name="display_name" value={displayName} readOnly />

        {state?.error ? (
          <div role="alert" className="jf-survey-alert">
            {state.error}
          </div>
        ) : null}

        <WizardStep step={1} activeStep={step}>
          <p className="jf-survey-step-eyebrow">Step 1 of 5</p>
          <h2 className="jf-survey-step-title">About You</h2>
          <p className="jf-survey-step-desc">
            This is what shows up on your profile in the directory.
          </p>

          <div className="jf-survey-field-group">
            <div className="jf-survey-name-photo-row">
              <PhotoUpload
                value={photoKey}
                onFileSelected={handlePhotoSelected}
                isUploading={isUploadingPhoto}
                disabled={isPending}
                error={firstError(state, "photo_key")}
              />

              <div className="jf-survey-field">
                <label htmlFor="survey-first-name">First Name</label>
                <input
                  id="survey-first-name"
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Alex"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  aria-invalid={
                    firstError(state, "display_name") ? "true" : undefined
                  }
                  aria-describedby={
                    firstError(state, "display_name")
                      ? "display-name-error"
                      : undefined
                  }
                />
              </div>

              <div className="jf-survey-field">
                <label htmlFor="survey-last-name">Last Name</label>
                <input
                  id="survey-last-name"
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Chen"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  aria-invalid={
                    firstError(state, "display_name") ? "true" : undefined
                  }
                  aria-describedby={
                    firstError(state, "display_name")
                      ? "display-name-error"
                      : undefined
                  }
                />
                <FieldError
                  id="display-name-error"
                  error={firstError(state, "display_name")}
                />
              </div>
            </div>

            <QuestionInput
              question={question("senior_quote")}
              error={firstError(state, "answers.senior_quote")}
              whatsNext={whatsNext}
            />

            <div className="jf-survey-divider" />

            <QuestionInput
              question={question("pronouns")}
              error={firstError(state, "answers.pronouns")}
              whatsNext={whatsNext}
            />

            <div className="jf-survey-divider" />

            <div className="jf-survey-field-row">
              <div className="jf-survey-field">
                <label htmlFor="instagram_handle">Instagram handle</label>
                <input
                  id="instagram_handle"
                  name="instagram_handle"
                  type="text"
                  maxLength={60}
                  placeholder="@yourhandle"
                  autoComplete="off"
                  aria-invalid={
                    firstError(state, "instagram_handle") ? "true" : undefined
                  }
                  aria-describedby={
                    firstError(state, "instagram_handle")
                      ? "instagram-handle-error"
                      : undefined
                  }
                />
                <span className="jf-survey-field-hint">
                  Optional - shown on your profile
                </span>
                <FieldError
                  id="instagram-handle-error"
                  error={firstError(state, "instagram_handle")}
                />
              </div>

              <div className="jf-survey-field">
                <label htmlFor="linkedin">LinkedIn handle</label>
                <input
                  id="linkedin"
                  name="linkedin"
                  type="text"
                  maxLength={200}
                  placeholder="linkedin.com/in/you"
                  autoComplete="off"
                  aria-invalid={firstError(state, "linkedin") ? "true" : undefined}
                  aria-describedby={
                    firstError(state, "linkedin") ? "linkedin-error" : undefined
                  }
                />
                <span className="jf-survey-field-hint">
                  Optional - shown on your profile
                </span>
                <FieldError
                  id="linkedin-error"
                  error={firstError(state, "linkedin")}
                />
              </div>
            </div>
          </div>

          <div className="jf-survey-actions">
            <span className="jf-survey-field-hint">Takes about 5 minutes.</span>
            <button
              type="button"
              className="jf-survey-btn-next"
              onClick={() => goTo(2)}
            >
              Next →
            </button>
          </div>
        </WizardStep>

        <WizardStep step={2} activeStep={step}>
          <p className="jf-survey-step-eyebrow">Step 2 of 5</p>
          <h2 className="jf-survey-step-title">School Life</h2>
          <p className="jf-survey-step-desc">Just some fun questions!</p>

          <div className="jf-survey-field-group">
            <QuestionInput
              question={question("top_courses")}
              error={firstError(state, "answers.top_courses")}
              whatsNext={whatsNext}
            />
            <QuestionInput
              question={question("hardest_course")}
              error={firstError(state, "answers.hardest_course")}
              whatsNext={whatsNext}
            />

            <div className="jf-survey-field-row">
              <QuestionInput
                question={question("specialized_program")}
                error={firstError(state, "answers.specialized_program")}
                whatsNext={whatsNext}
              />
              <QuestionInput
                question={question("final_grade_bucket")}
                error={firstError(state, "answers.final_grade_bucket")}
                whatsNext={whatsNext}
              />
            </div>

            <div className="jf-survey-divider" />

            <QuestionInput
              question={question("avg_sleep")}
              error={firstError(state, "answers.avg_sleep")}
              whatsNext={whatsNext}
            />
            <QuestionInput
              question={question("study_hours")}
              error={firstError(state, "answers.study_hours")}
              whatsNext={whatsNext}
            />
            <QuestionInput
              question={question("stress")}
              error={firstError(state, "answers.stress")}
              whatsNext={whatsNext}
            />
            <QuestionInput
              question={question("screen_time")}
              error={firstError(state, "answers.screen_time")}
              whatsNext={whatsNext}
            />
          </div>

          <div className="jf-survey-actions">
            <button
              type="button"
              className="jf-survey-btn-back"
              onClick={() => goTo(1)}
            >
              ← Back
            </button>
            <button
              type="button"
              className="jf-survey-btn-next"
              onClick={() => goTo(3)}
            >
              Next →
            </button>
          </div>
        </WizardStep>

        <WizardStep step={3} activeStep={step}>
          <p className="jf-survey-step-eyebrow">Step 3 of 5</p>
          <h2 className="jf-survey-step-title">Looking Back</h2>
          <p className="jf-survey-step-desc">Some reflection!</p>

          <div className="jf-survey-field-group">
            <QuestionInput
              question={question("class_defined")}
              error={firstError(state, "answers.class_defined")}
              whatsNext={whatsNext}
            />
            <QuestionInput
              question={question("miss_most")}
              error={firstError(state, "answers.miss_most")}
              whatsNext={whatsNext}
            />
            <QuestionInput
              question={question("relive_event")}
              error={firstError(state, "answers.relive_event")}
              whatsNext={whatsNext}
            />

            <div className="jf-survey-divider" />

            <QuestionInput
              question={question("advice_grade9")}
              error={firstError(state, "answers.advice_grade9")}
              whatsNext={whatsNext}
            />
          </div>

          <div className="jf-survey-actions">
            <button
              type="button"
              className="jf-survey-btn-back"
              onClick={() => goTo(2)}
            >
              ← Back
            </button>
            <button
              type="button"
              className="jf-survey-btn-next"
              onClick={() => goTo(4)}
            >
              Next →
            </button>
          </div>
        </WizardStep>

        <WizardStep step={4} activeStep={step}>
          <p className="jf-survey-step-eyebrow">Step 4 of 5</p>
          <h2 className="jf-survey-step-title">What&apos;s Next</h2>
          <p className="jf-survey-step-desc">
            Where you&apos;re headed and what you&apos;re chasing.
          </p>

          <div className="jf-survey-field-group">
            <QuestionInput
              question={question("whats_next")}
              error={firstError(state, "answers.whats_next")}
              whatsNext={whatsNext}
            />

            <div className="jf-survey-field-row">
              <QuestionInput
                question={question("school_workplace")}
                error={firstError(state, "answers.school_workplace")}
                whatsNext={whatsNext}
              />
              <QuestionInput
                question={question("program_major")}
                error={firstError(state, "answers.program_major")}
                whatsNext={whatsNext}
              />
            </div>

            <div className="jf-survey-divider" />

            <QuestionInput
              question={question("excited_for")}
              error={firstError(state, "answers.excited_for")}
              whatsNext={whatsNext}
            />
            <QuestionInput
              question={question("ten_years")}
              error={firstError(state, "answers.ten_years")}
              whatsNext={whatsNext}
            />
          </div>

          <div className="jf-survey-actions">
            <button
              type="button"
              className="jf-survey-btn-back"
              onClick={() => goTo(3)}
            >
              ← Back
            </button>
            <button
              type="button"
              className="jf-survey-btn-next"
              onClick={() => goTo(5)}
            >
              Review →
            </button>
          </div>
        </WizardStep>

        <WizardStep step={5} activeStep={step}>
          <p className="jf-survey-step-eyebrow">Step 5 of 5</p>
          <h2 className="jf-survey-step-title">Review &amp; Submit</h2>
          <p className="jf-survey-step-desc">Take a look before we lock it in.</p>

          <ReviewPanel
            formData={reviewFormData}
            firstName={firstName}
            lastName={lastName}
            photoPreviewUrl={photoPreviewUrl}
            photoFile={photoFile}
            photoKey={photoKey}
          />

          <div className="jf-survey-actions">
            <button
              type="button"
              className="jf-survey-btn-back"
              onClick={() => goTo(4)}
            >
              ← Edit
            </button>
            <SubmitButton disabled={false} pending={isPending || isUploadingPhoto} />
          </div>
        </WizardStep>
      </form>
    </div>
  );
}
