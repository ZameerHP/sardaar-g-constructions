"use client";
import { newId } from "@/lib/id";
import { useEffect, useRef, useState } from "react";
import { Choice } from "@/app/quote-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, uploadAdminImage } from "@/lib/backend/upload-client";
import {
  fields,
  sections,
  newRecord,
  cleanRecord,
  type Field,
} from "./editor-config";
const allSections = [
  ["leads", "Quote requests"],
  ...sections,
  ["assets", "Image library"],
];
export function AdminPanel({ email }: { email: string }) {
  const [section, setSection] = useState("leads");
  const [records, setRecords] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("All");
  const [editing, setEditing] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [remove, setRemove] = useState<any>(null);
  const [preview, setPreview] = useState(false);
  const request = useRef(0);
  const deepLink = useRef("");
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("section") === "leads" && q.get("id"))
      deepLink.current = q.get("id")!;
  }, []);
  async function load() {
    const sequence = ++request.current;
    setLoading(true);
    try {
      const url =
        section === "assets" ? "/api/admin/uploads" : `/api/admin/${section}`;
      const d = await api(
        `${url}?page=${page}${section === "leads" && filter !== "All" ? "&status=" + filter : ""}${deepLink.current ? "&id=" + encodeURIComponent(deepLink.current) : ""}`,
      );
      if (sequence !== request.current) return;
      setRecords(d.records);
      setTotal(d.total || 0);
      if (deepLink.current && d.records[0]) setEditing(d.records[0]);
      deepLink.current = "";
    } catch (e) {
      if (sequence === request.current)
        setMessage(e instanceof Error ? e.message : "Unable to load content.");
    } finally {
      if (sequence === request.current) setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [section, page, filter]);
  function changeSection(s: string) {
    request.current++;
    setSection(s);
    setPage(0);
    setFilter("All");
    setEditing(null);
    setMessage("");
  }
  function update(key: string, value: any) {
    setEditing((r: any) => ({ ...r, [key]: value }));
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const payload =
        section === "leads"
          ? {
              id: editing.id,
              status: editing.status,
              internal_notes: editing.internal_notes,
            }
          : cleanRecord(section, editing);
      await api(`/api/admin/${section}`, "POST", payload);
      setMessage("Changes saved.");
      await load();
      if (section !== "leads") setEditing(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: File[], key: string) {
    setBusy(true);
    setMessage("");
    try {
      for (const file of files) {
        const asset = await uploadAdminImage(file);
        setEditing((r: any) =>
          key === "gallery"
            ? {
                ...r,
                images: [
                  ...(r.images || []),
                  {
                    id: newId(),
                    asset_id: asset.id,
                    alt_text: "",
                    caption: "",
                    display_order: (r.images || []).length,
                  },
                ],
              }
            : { ...r, [key]: asset.id },
        );
      }
      setMessage("Images uploaded. Add alt text and save your changes.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  async function deleteSelected() {
    if (!remove) return;
    setBusy(true);
    try {
      await api(
        section === "assets" ? "/api/admin/uploads" : `/api/admin/${section}`,
        "DELETE",
        { id: remove.id },
      );
      setEditing(null);
      setRemove(null);
      setMessage("Deleted.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to delete.");
    } finally {
      setBusy(false);
    }
  }
  function renderField(f: Field) {
    const value = editing[f.key];
    if (f.type === "image")
      return (
        <div className="field" key={f.key}>
          <label htmlFor={f.key}>{f.label}</label>
          {value && (
            <img
              className="cms-image-preview"
              src={"/api/media/" + value}
              alt={f.label}
            />
          )}
          <input
            id={f.key}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload([file], f.key);
              e.target.value = "";
            }}
          />
          {value && (
            <button
              type="button"
              className="filter"
              disabled={busy}
              onClick={() => update(f.key, null)}
            >
              Remove from this content
            </button>
          )}
        </div>
      );
    if (f.type === "checkbox")
      return (
        <label className="consent" key={f.key}>
          <Checkbox
            checked={!!value}
            onCheckedChange={(v) => update(f.key, v === true)}
            disabled={busy}
          />
          {f.label}
        </label>
      );
    if (f.type === "select")
      return (
        <Choice
          key={f.key}
          name={f.key}
          label={f.label}
          options={(f.options || []).map((v) => v || "Not set")}
          value={value === null || value === "" ? "Not set" : String(value)}
          onChange={(v) =>
            update(
              f.key,
              f.key === "rating"
                ? v === "Not set"
                  ? null
                  : Number(v)
                : v === "Not set"
                  ? ""
                  : v,
            )
          }
        />
      );
    return (
      <label
        className={
          "field " +
          (["textarea", "lines"].includes(f.type || "") ? "wide" : "")
        }
        key={f.key}
      >
        {f.label}
        {f.type === "textarea" || f.type === "lines" ? (
          <textarea
            required={f.required}
            maxLength={f.max || 25000}
            value={f.type === "lines" ? (value || []).join("\n") : value || ""}
            onChange={(e) =>
              update(
                f.key,
                f.type === "lines"
                  ? e.target.value.split("\n")
                  : e.target.value,
              )
            }
            rows={f.key === "content" ? 16 : 4}
          />
        ) : (
          <input
            required={f.required}
            type={
              f.type === "number"
                ? "number"
                : f.type === "email"
                  ? "email"
                  : f.type === "url"
                    ? "url"
                    : "text"
            }
            min={f.type === "number" ? 0 : undefined}
            max={f.type === "number" ? 10000 : undefined}
            maxLength={f.max || 500}
            pattern={f.key === "slug" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined}
            value={value ?? ""}
            onChange={(e) =>
              update(
                f.key,
                f.type === "number" ? Number(e.target.value) : e.target.value,
              )
            }
          />
        )}
      </label>
    );
  }
  const name = (r: any) =>
    r.title ||
    r.client_name ||
    r.brand_name ||
    r.name ||
    r.filename ||
    (section === "contact_settings"
      ? "Contact details"
      : "New " +
        (sections
          .find(([key]) => key === section)?.[1]
          .replace(/s$/, "")
          .toLowerCase() || "item"));
  return (
    <div className="cms">
      <aside className="cms-sidebar">
        <a href="/" className="cms-brand">
          <img src="/images/logo-mark.webp" alt="" />
          SARDAAR G<small>OWNER DASHBOARD</small>
        </a>
        <nav aria-label="Dashboard sections">
          {allSections.map(([key, label]) => (
            <button
              disabled={busy}
              key={key}
              className={section === key ? "selected" : ""}
              onClick={() => changeSection(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <a href="/" target="_blank" rel="noreferrer" className="text-link">
          View website ↗
        </a>
      </aside>
      <main className="cms-main">
        <header className="cms-toolbar">
          <div>
            <p className="label">Website management</p>
            <h1>{allSections.find(([key]) => key === section)?.[1]}</h1>
          </div>
          <div>
            <p className="form-note">{email}</p>
            <button
              className="filter"
              onClick={async () => {
                await api("/api/auth/logout", "POST", {});
                location.assign("/admin/login");
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        {message && (
          <div role="status" className="form-message cms-message">
            {message}
          </div>
        )}
        {editing ? (
          section === "leads" ? (
            <article className="cms-editor">
              <button className="text-link" onClick={() => setEditing(null)}>
                ← Back to quote requests
              </button>
              <h2>{editing.name}</h2>
              <p className="form-note">
                Received {new Date(editing.created_at).toLocaleString()} ·{" "}
                {editing.source} form
              </p>
              <dl className="cms-lead-details">
                {[
                  ["Company", editing.company],
                  ["Email", editing.email],
                  ["Phone", editing.phone],
                  ["Location", editing.project_location],
                  ["Project type", editing.project_type],
                  ["Approximate size", editing.project_size],
                  [
                    "Required start date",
                    editing.required_start_date || editing.start_timing,
                  ],
                  ["Scope", editing.scope],
                  ["Message", editing.message],
                  ["Reference", editing.reference],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v || "Not supplied"}</dd>
                  </div>
                ))}
              </dl>
              <h3>Private attachments</h3>
              <div className="cms-files">
                {editing.files?.length ? (
                  editing.files.map((f: any) => (
                    <a
                      className="filter"
                      key={f.id}
                      href={`/api/admin/leads/${editing.id}/files/${f.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {f.filename} ↓{" "}
                      <small>{(f.size_bytes / 1048576).toFixed(1)} MB</small>
                    </a>
                  ))
                ) : (
                  <p className="form-note">No files attached.</p>
                )}
              </div>
              <div className="form-grid">
                <Choice
                  name="lead-status"
                  label="Lead status"
                  options={["New", "Contacted", "Quoted", "Won", "Lost"]}
                  value={editing.status}
                  onChange={(v) => update("status", v)}
                />
                <label className="field wide">
                  Internal notes
                  <textarea
                    value={editing.internal_notes || ""}
                    maxLength={15000}
                    onChange={(e) => update("internal_notes", e.target.value)}
                  />
                </label>
              </div>
              <div className="cms-actions">
                <button className="btn dark" disabled={busy} onClick={save}>
                  Save lead
                </button>
                <button
                  className="filter"
                  disabled={busy}
                  onClick={() => setRemove(editing)}
                >
                  Delete spam lead
                </button>
              </div>
              <h3>Email delivery</h3>
              {editing.notifications?.map((n: any) => (
                <p className="form-note" key={n.id}>
                  {n.kind === "admin"
                    ? "Owner notification"
                    : "Customer confirmation"}
                  : {n.status}
                  {n.last_error ? " — " + n.last_error : ""}
                </p>
              ))}
              {editing.notifications?.some(
                (n: any) => n.status === "failed",
              ) && (
                <button
                  className="filter"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api("/api/admin/leads", "POST", {
                        action: "retry",
                        id: editing.id,
                      });
                      const d = await api("/api/admin/leads?id=" + editing.id);
                      setEditing(d.records[0]);
                      setMessage("Delivery retry processed.");
                    } catch (e) {
                      setMessage(
                        e instanceof Error ? e.message : "Retry failed.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Retry failed emails
                </button>
              )}
            </article>
          ) : (
            <form
              className="cms-editor"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <div className="cms-editor-heading">
                <h2>{name(editing)}</h2>
                <button
                  type="button"
                  className="filter"
                  disabled={busy}
                  onClick={() => setEditing(null)}
                >
                  Back to list
                </button>
              </div>
              <fieldset disabled={busy} className="cms-fieldset">
                <div className="form-grid">
                  {fields[section].map(renderField)}
                  {section !== "contact_settings" && (
                    <label className="consent wide">
                      <Checkbox
                        checked={!!editing.published}
                        onCheckedChange={(v) => update("published", v === true)}
                      />
                      Published — visible on the website
                    </label>
                  )}
                </div>
                {section === "projects" && (
                  <section className="cms-gallery">
                    <h3>Project gallery</h3>
                    <p className="form-note">
                      Choose multiple photos. Images are resized to a maximum of
                      2,200px and converted to WebP. Add a useful description
                      for each image.
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp"
                      disabled={busy}
                      onChange={(e) => {
                        upload(Array.from(e.target.files || []), "gallery");
                        e.target.value = "";
                      }}
                    />
                    {editing.images?.map((img: any, i: number) => (
                      <div className="cms-gallery-row" key={img.id}>
                        <img
                          src={"/api/media/" + img.asset_id}
                          alt={img.alt_text || "Gallery preview"}
                        />
                        <label className="field">
                          Alt text
                          <input
                            required={editing.published}
                            maxLength={500}
                            value={img.alt_text}
                            onChange={(e) =>
                              update(
                                "images",
                                editing.images.map((a: any, j: number) =>
                                  j === i
                                    ? { ...a, alt_text: e.target.value }
                                    : a,
                                ),
                              )
                            }
                          />
                        </label>
                        <label className="field">
                          Caption
                          <input
                            maxLength={500}
                            value={img.caption}
                            onChange={(e) =>
                              update(
                                "images",
                                editing.images.map((a: any, j: number) =>
                                  j === i
                                    ? { ...a, caption: e.target.value }
                                    : a,
                                ),
                              )
                            }
                          />
                        </label>
                        <div className="cms-actions">
                          <button
                            type="button"
                            className="filter"
                            disabled={i === 0}
                            onClick={() => {
                              const images = [...editing.images];
                              [images[i - 1], images[i]] = [
                                images[i],
                                images[i - 1],
                              ];
                              update("images", images);
                            }}
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            className="filter"
                            onClick={() =>
                              setEditing({
                                ...editing,
                                featured_image_id: img.asset_id,
                                featured_image_alt: img.alt_text,
                              })
                            }
                          >
                            Set featured
                          </button>
                          <button
                            type="button"
                            className="filter"
                            onClick={() =>
                              update(
                                "images",
                                editing.images.filter(
                                  (_: any, j: number) => i !== j,
                                ),
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </section>
                )}
              </fieldset>
              <div className="cms-actions">
                <button type="submit" className="btn dark" disabled={busy}>
                  {busy ? "Working…" : "Save changes"}
                </button>
                <button
                  type="button"
                  className="filter"
                  onClick={() => setPreview(true)}
                >
                  Preview content
                </button>
              </div>
            </form>
          )
        ) : (
          <>
            <div className="cms-actions">
              {!["leads", "assets", "contact_settings"].includes(section) && (
                <button
                  className="btn dark"
                  disabled={busy}
                  onClick={() => setEditing(newRecord(section))}
                >
                  Add{" "}
                  {sections.find(([k]) => k === section)?.[1].replace(/s$/, "")}
                </button>
              )}
              <button className="filter" onClick={load}>
                Refresh
              </button>
              {section === "leads" && (
                <Choice
                  name="filter"
                  label="Filter by status"
                  options={["All", "New", "Contacted", "Quoted", "Won", "Lost"]}
                  value={filter}
                  onChange={(v) => {
                    setPage(0);
                    setFilter(v);
                  }}
                />
              )}
              <span className="form-note">
                {total} {total === 1 ? "record" : "records"}
              </span>
            </div>
            {section === "assets" && (
              <p className="form-note">
                Images are uploaded through a content editor. Remove image
                references and save that content before deleting an unused image
                here.
              </p>
            )}
            {loading ? (
              <p role="status">Loading…</p>
            ) : records.length === 0 ? (
              <div className="empty-state">
                <h2>
                  {section === "leads"
                    ? "No quote requests yet."
                    : "Nothing here yet."}
                </h2>
                <p>
                  {section === "leads"
                    ? "New enquiries will appear here with their project details and files."
                    : "Add your first item to get started."}
                </p>
              </div>
            ) : (
              <div className="cms-list">
                {records.map((r) => (
                  <article className="cms-list-row" key={r.id}>
                    {section === "assets" && (
                      <img src={"/api/media/" + r.id} alt={r.filename} />
                    )}
                    <div>
                      <h3>{name(r)}</h3>
                      <p className="form-note">
                        {section === "leads"
                          ? `${r.project_type} · ${r.project_location} · ${new Date(r.created_at).toLocaleDateString()}`
                          : r.slug
                            ? "/" + r.slug
                            : section === "assets"
                              ? `${(r.size_bytes / 1048576).toFixed(1)} MB`
                              : "Website content"}
                      </p>
                    </div>
                    {section !== "assets" && section !== "contact_settings" && (
                      <span className="status">
                        {section === "leads"
                          ? r.status
                          : r.published
                            ? "Published"
                            : "Draft"}
                      </span>
                    )}
                    <div className="cms-actions">
                      {section !== "assets" && (
                        <button
                          className="filter"
                          onClick={() => setEditing(structuredClone(r))}
                        >
                          {section === "leads" ? "View details" : "Edit"}
                        </button>
                      )}
                      {section !== "contact_settings" && (
                        <button className="filter" onClick={() => setRemove(r)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="cms-pagination">
              <button
                className="filter"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {Math.max(1, Math.ceil(total / 25))}
              </span>
              <button
                className="filter"
                disabled={(page + 1) * 25 >= total || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent
          className="sm:max-w-3xl max-h-[90vh] overflow-auto"
          data-lenis-prevent
        >
          <DialogTitle>{editing ? name(editing) : "Preview"}</DialogTitle>
          <DialogDescription>
            Draft content preview. Save and publish when approved.
          </DialogDescription>
          {editing?.featured_image_id && (
            <img
              src={"/api/media/" + editing.featured_image_id}
              alt={editing.featured_image_alt || editing.image_alt || ""}
            />
          )}
          <p>{editing?.summary || editing?.excerpt}</p>
          <div style={{ whiteSpace: "pre-wrap" }}>
            {editing?.scope ||
              editing?.description ||
              editing?.content ||
              editing?.review}
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!remove} onOpenChange={(o) => !o && setRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {remove ? name(remove) : "this item"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {section === "leads"
                ? "This permanently removes this enquiry, its internal notes and uploaded documents."
                : "This removes the item. Images used by other content cannot be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                deleteSelected();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
