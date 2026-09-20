"use client";
import { Turnstile } from "./turnstile";
import { api, directUpload } from "@/lib/backend/upload-client";
import { newId } from "@/lib/id";
import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, Upload, CheckCircle2, X, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
export function Choice({
  name,
  label,
  options,
  value,
  onChange,
  required = false,
}: {
  name: string;
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="field">
      <label id={name + "-label"}>
        {label}
        {required ? " *" : ""}
      </label>
      <Select
        name={name}
        value={value}
        onValueChange={onChange}
        required={required}
      >
        <SelectTrigger aria-labelledby={name + "-label"}>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem value={o} key={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function QuoteForm({ compact = false }: { compact?: boolean }) {
  const [type, setType] = useState("");
  const [challenge, setChallenge] = useState("");
  const [challengeReset, setChallengeReset] = useState(0);
  const pending = useRef<any>(null);
  const uploadSecret = useRef("");
  const completedUploads = useRef(new Set<string>());
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [refProject, setRef] = useState("");
  const [timing, setTiming] = useState("To be discussed");
  const form = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const token = useRef("");
  useEffect(() => {
    token.current = newId();
    uploadSecret.current = newId() + newId();
    const q = new URLSearchParams(location.search);
    if (q.get("type")) setType(q.get("type")!);
    setRef(q.get("project") || q.get("service") || "");
    const mc = (document as any).modelContext;
    if (!mc?.registerTool) return;
    const ac = new AbortController();
    Promise.resolve(
      mc.registerTool(
        {
          name: "stage_project_enquiry",
          title: "Prepare project enquiry",
          description:
            "Fill visible enquiry fields for review. Does not submit an enquiry or grant privacy consent.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              location: { type: "string" },
              scope: { type: "string" },
            },
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: (input: any) => {
            if (
              !input ||
              typeof input !== "object" ||
              Object.entries(input).some(
                ([k, v]) =>
                  !["name", "email", "location", "scope"].includes(k) ||
                  typeof v !== "string" ||
                  v.length > 5000,
              )
            )
              throw new Error("Invalid enquiry fields");
            for (const [k, v] of Object.entries(input)) {
              const el = form.current?.elements.namedItem(
                k,
              ) as HTMLInputElement;
              if (el) el.value = v as string;
            }
            return { staged: true, submitted: false };
          },
        },
        { signal: ac.signal },
      ),
    ).catch(() => {});
    return () => ac.abort();
  }, []);
  function addFiles(incoming: File[]) {
    const next = [...files, ...incoming];
    if (
      next.length > 6 ||
      next.some((f) => f.size > 20 * 1024 * 1024) ||
      next.reduce((a, f) => a + f.size, 0) > 60 * 1024 * 1024
    ) {
      setMessage("Choose up to 6 files, 20 MB each and 60 MB in total.");
      return;
    }
    if (
      next.some(
        (f) =>
          ![
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
          ].includes(f.type),
      )
    ) {
      setMessage("Use PDF, JPG, PNG or WebP files.");
      return;
    }
    setMessage("");
    setFiles(next);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.current || busy) return;
    if (!consent) {
      setMessage("Please confirm that we may use your details to respond.");
      return;
    }
    if (!pending.current && !challenge) {
      setMessage("Please complete the security check.");
      return;
    }
    setBusy(true);
    setMessage("");
    setProgress(0);
    try {
      if (!pending.current) {
        const data = Object.fromEntries(new FormData(form.current));
        const result = await api("/api/quotes/start", "POST", {
          ...data,
          type,
          token: token.current,
          uploadSecret: uploadSecret.current,
          consent: "yes",
          reference: refProject,
          source: compact ? "contact" : "quote",
          turnstile: challenge,
          files: files.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
            category: f.type === "application/pdf" ? "drawing" : "photo",
          })),
        });
        if (result.saved) {
          setSuccess(true);
          setMessage(result.message);
          return;
        }
        pending.current = result;
      }
      const session = pending.current;
      for (let i = 0; i < session.uploads.length; i++) {
        const u = session.uploads[i];
        if (!completedUploads.current.has(u.id)) {
          await directUpload(u, files[i]);
          completedUploads.current.add(u.id);
        }
        setProgress(
          Math.round(((i + 1) / Math.max(1, session.uploads.length)) * 90),
        );
      }
      setProgress(95);
      const result = await api("/api/quotes/finalize", "POST", {
        id: session.id,
        secret: session.secret,
      });
      setSuccess(true);
      setProgress(100);
      setMessage(result.message);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to submit. Please retry.",
      );
      setChallenge("");
      setChallengeReset((v) => v + 1);
    } finally {
      setBusy(false);
      setTimeout(() => messageRef.current?.focus(), 20);
    }
  }

  return (
    <form ref={form} onSubmit={submit} className="form-grid">
      {success ? (
        <div
          className="field wide form-message"
          ref={messageRef}
          tabIndex={-1}
          role="status"
        >
          <CheckCircle2 size={32} />
          <h3 style={{ fontSize: 26, marginTop: 16 }}>Thank you.</h3>
          <p>{message}</p>
        </div>
      ) : (
        <>
          <fieldset
            disabled={busy || !!pending.current}
            className="form-grid quote-fields"
          >
            <h3 className="form-section-title">01 / Your details</h3>
            <label className="field">
              Full name *
              <input name="name" autoComplete="name" required maxLength={120} />
            </label>
            <label className="field">
              Company
              <input
                name="company"
                autoComplete="organization"
                maxLength={160}
              />
            </label>
            <label className="field">
              Email address *
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label className="field">
              Phone number *
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                minLength={7}
                maxLength={35}
              />
            </label>
            <h3 className="form-section-title">02 / Your project</h3>
            <label className="field">
              Project location *
              <input
                name="location"
                placeholder="City or region in BC"
                required
                maxLength={180}
              />
            </label>
            <Choice
              name="type"
              label="Project type"
              required
              value={type}
              onChange={setType}
              options={[
                "Residential",
                "Multi-Family",
                "Commercial",
                "New Construction",
                "Exterior Renovation",
                "Other",
              ]}
            />
            {!compact && (
              <>
                <label className="field">
                  Approximate project size
                  <input
                    name="size"
                    placeholder="e.g. 12 townhomes, 5,000 sq ft, or not sure"
                    maxLength={180}
                  />
                </label>
                <Choice
                  name="timing"
                  label="Start date"
                  value={timing}
                  onChange={setTiming}
                  options={["To be discussed", "Flexible", "Specific date"]}
                />
                {timing === "Specific date" && (
                  <label className="field">
                    Preferred start date
                    <input type="date" name="startDate" />
                  </label>
                )}
              </>
            )}
            <label className="field wide">
              Scope of work *
              <textarea
                name="scope"
                required
                minLength={10}
                maxLength={10000}
                placeholder="Tell us about the exterior systems, materials and installation scope you have in mind."
              />
            </label>
            {refProject && (
              <p className="field wide form-note">
                Project reference: {refProject}
              </p>
            )}
            {!compact && (
              <>
                <h3 className="form-section-title">
                  03 / Drawings & additional details
                </h3>
                <div
                  className="field wide"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (busy || pending.current) return;
                    addFiles(Array.from(e.dataTransfer.files));
                  }}
                >
                  <label htmlFor="drawings">Drawings, plans or photos</label>
                  <p className="form-note">
                    PDF, JPG, PNG or WebP. Up to 6 files; 20 MB per file, 60 MB
                    total. Drag files here or choose below. Files are stored
                    privately.
                  </p>
                  <input
                    id="drawings"
                    disabled={busy || !!pending.current}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      addFiles(Array.from(e.target.files || []));
                      e.target.value = "";
                    }}
                  />
                  {files.map((f, i) => (
                    <div
                      className="flex items-center justify-between gap-3"
                      key={i}
                    >
                      <FileText size={20} />
                      <span style={{ flex: 1, overflowWrap: "anywhere" }}>
                        {f.name}{" "}
                        <small>({(f.size / 1024 / 1024).toFixed(1)} MB)</small>
                      </span>
                      <button
                        type="button"
                        disabled={busy || !!pending.current}
                        aria-label={"Remove " + f.name}
                        className="filter"
                        onClick={() =>
                          setFiles(files.filter((_, j) => j !== i))
                        }
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="field wide">
                  Additional message
                  <textarea
                    name="message"
                    maxLength={5000}
                    placeholder="Anything else we should know?"
                  />
                </label>
              </>
            )}
            <label className="hidden-honey" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <div className="field wide">
              <div className="consent">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                />
                <label htmlFor="consent">
                  I agree to the use of my details and documents to respond to
                  this enquiry.{" "}
                  <a style={{ textDecoration: "underline" }} href="/privacy">
                    Privacy information
                  </a>
                  .
                </label>
              </div>
            </div>
          </fieldset>
          <Turnstile
            action="quote"
            onToken={setChallenge}
            resetKey={challengeReset}
          />
          {pending.current && !success && (
            <p className="field wide form-note">
              Your submission is in progress. Retry to finish uploading the same
              files. Keep this page open.{" "}
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() => {
                  pending.current = null;
                  completedUploads.current.clear();
                  token.current = newId();
                  uploadSecret.current = newId() + newId();
                  setChallenge("");
                  setChallengeReset((v) => v + 1);
                  setMessage("Start a new enquiry with the details below.");
                }}
              >
                Start a new enquiry
              </button>
            </p>
          )}
          {message && (
            <div
              className="field wide form-message error"
              role="alert"
              tabIndex={-1}
              ref={messageRef}
            >
              {message}
              {!pending.current && (
                <button
                  type="button"
                  className="text-link"
                  disabled={busy}
                  onClick={() => {
                    token.current = newId();
                    uploadSecret.current = newId() + newId();
                    setChallenge("");
                    setChallengeReset((v) => v + 1);
                    setMessage("");
                  }}
                >
                  Start a new enquiry
                </button>
              )}
            </div>
          )}
          <div className="field wide">
            <button
              className="btn dark"
              disabled={busy || (!challenge && !pending.current)}
              type="submit"
            >
              {busy
                ? progress < 100
                  ? `Sending ${progress}%`
                  : "Saving your enquiry…"
                : "Send project enquiry"}
              <ArrowUpRight />
            </button>
            <p className="form-note">
              Your enquiry is saved securely. No marketing subscription.
            </p>
          </div>
        </>
      )}
    </form>
  );
}
