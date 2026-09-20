# Owner guide

After setup, visit `/admin/login`. Sign in with your approved Supabase email/password. Use **Sign out** when finished. The public website does not change layout when you edit content.

## Projects and photos

Select Projects → Add Project. Enter the name, URL slug, location, project type, scope, materials and Completed/Ongoing status. Upload a featured image, add its alt text, and optionally choose before/after images and their descriptions. Upload multiple gallery images, enter alt text/captions, reorder them with Move up or choose Set featured. Uploaded images are optimized automatically; original inputs must be JPG, PNG or WebP under 10 MB.

Save with Published unchecked for a private draft. Preview content before publishing. Check Published and save to display it on the public Projects page. Feature on homepage controls placement. Uncheck Published and save to hide it again. Use a meaningful slug such as `surrey-townhouse-fiber-cement`; changing a published slug changes its URL and does not automatically create a redirect.

The Image library shows uploaded photos. First remove any references from content and save those changes, then delete the unused asset. Deleting a project removes its gallery references but leaves its assets available in the image library. Only publish approved company work. Existing reference architecture and the hero concept are labelled as reference/concept imagery.

## Other content

- Services: edit title, description, bullet points, imagery and SEO fields. Existing service images remain as references unless replaced.
- Testimonials: enter client name, optional company/rating/project type, and review text. Publish only approved reviews.
- Manufacturers: enter brand name, optional logo/HTTPS website, display order and publication state.
- Contact details: update phone, email, Instagram, service area, optional address and Google Maps embed URL. Paste the iframe's HTTPS `src` URL, not iframe HTML.
- Articles: enter title, slug, image, excerpt, plain-text paragraphs and SEO fields. Drafts remain private; published articles appear at `/insights/your-slug` and enable the footer Articles link.

Smaller display-order numbers appear first. Save changes before leaving an editor. Uploading a photo does not by itself publish it.

## Quote requests

Select Quote requests. Filter or page through New, Contacted, Quoted, Won and Lost enquiries. Open a request to see every submitted field, download private files, change status and add internal notes. Save lead to retain notes/status. Delete spam lead asks for confirmation and permanently removes the enquiry and its documents.

Owner and customer email states appear in lead details. Retry failed emails for recent failures; if the status is review or failures persist, ask the website administrator to inspect Resend and cron logs. A saved enquiry remains in the dashboard when email delivery fails.

## Images and original visual work

The supplied company logo is retained. Existing architectural reference imagery remains labelled and is not presented as completed Sardaar G projects. Reference sources:

- Matt Reames: https://unsplash.com/photos/aFk1RLZgJTs
- Kevin Angelsø: https://unsplash.com/photos/black-concrete-building-BJcn5j83MVA
- Timber facade reference: https://images.unsplash.com/photo-1704307023984-813727deade9
- Hero: generated architectural concept, `public/images/hero-foreground.webp`.

The hero scene, brand rise, building zoom-out, typography, colors and page layouts remain from the existing website. Lenis adds smooth desktop wheel motion; mobile uses native touch scrolling. The services accordion animates its height and text. Reduced-motion settings disable smooth scrolling and transitions.
