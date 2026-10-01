import { requireRole } from "@/lib/session";
import { getProviderByUser } from "@/lib/services/providers";
import { listAreas, listCategories } from "@/lib/services/catalog";
import { deletePhotoAction, saveProfileAction, uploadPhotosAction } from "@/app/actions/provider";
import { Icon } from "@/components/Icon";
import { ProviderBadge } from "@/components/StatusBadge";
import { Flash, one, type PageSearchParams } from "@/components/Flash";

export const dynamic = "force-dynamic";
export const metadata = { title: "My artisan profile | Artisan" };

export default async function ProfilePage({ searchParams }: { searchParams: PageSearchParams }) {
  const session = await requireRole("provider");
  const sp = await searchParams;
  const [provider, categories, areas] = await Promise.all([getProviderByUser(session.userId), listCategories(), listAreas()]);

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <div className="page-head">
        <div className="row" style={{ gap: 8 }}>
          <h1 style={{ fontSize: "2.2rem", margin: 0 }}>{provider ? "Your artisan profile" : "Set up your artisan profile"}</h1>
          {provider && <ProviderBadge status={provider.status} />}
        </div>
        <p className="muted">Tell customers what you do and where you work. Admins review every new profile before it goes live.</p>
      </div>
      <Flash error={one(sp.error)} ok={one(sp.ok)} />

      <form action={saveProfileAction} className="card" data-testid="profile-form">
        <div className="grid grid-2">
          <div className="field"><label htmlFor="businessName">Business name</label><input id="businessName" name="businessName" className="input" defaultValue={provider?.businessName} required /></div>
          <div className="field">
            <label htmlFor="categoryId">Trade</label>
            <select id="categoryId" name="categoryId" className="input" defaultValue={categories.find((c) => c.slug === provider?.categorySlug)?.id ?? ""} required>
              <option value="" disabled>Choose your trade</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name.replace(/s$/, "")}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="areaId">Area you work in</label>
            <select id="areaId" name="areaId" className="input" defaultValue={areas.find((a) => a.slug === provider?.areaSlug)?.id ?? ""} required>
              <option value="" disabled>Choose an area</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="field"><label htmlFor="yearsExperience">Years of experience</label><input id="yearsExperience" name="yearsExperience" type="number" min={0} max={60} className="input" defaultValue={provider?.yearsExperience ?? 1} required /></div>
            <div className="field"><label htmlFor="startingPrice">Starting price (₦)</label><input id="startingPrice" name="startingPrice" type="number" min={0} className="input" defaultValue={provider?.startingPrice ?? 5000} required /></div>
          </div>
        </div>
        <div className="field"><label htmlFor="bio">About your work</label><textarea id="bio" name="bio" className="input" defaultValue={provider?.bio} minLength={20} required placeholder="What jobs do you take on? What makes your work stand out?" /></div>
        {!provider && (
          <div className="field">
            <label htmlFor="photos">Photos of past work</label>
            <input id="photos" name="photos" type="file" accept="image/*" multiple className="input" />
            <div className="hint">JPG, PNG or WEBP, up to 4 MB each. Clear photos get verified faster.</div>
          </div>
        )}
        <button className="btn">{provider ? "Save changes" : "Submit for verification"}</button>
      </form>

      {provider && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3><Icon name="camera" size={20} /> Past work photos</h3>
          <div className="gallery" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 16 }} data-testid="my-photos">
            {provider.photos.map((ph) => (
              <figure key={ph.id}>
                <img src={ph.url} alt={ph.caption} />
                <form action={deletePhotoAction} style={{ position: "absolute", top: 6, right: 6 }}>
                  <input type="hidden" name="photoId" value={ph.id} />
                  <button className="btn sm white" title="Remove photo" aria-label="Remove photo"><Icon name="trash" size={14} /></button>
                </form>
                {ph.caption && <figcaption>{ph.caption}</figcaption>}
              </figure>
            ))}
          </div>
          <form action={uploadPhotosAction} className="row wrap" style={{ alignItems: "flex-end" }} data-testid="upload-form">
            <div style={{ flex: 2, minWidth: 220 }}><label htmlFor="morePhotos">Add photos</label><input id="morePhotos" name="photos" type="file" accept="image/*" multiple className="input" required /></div>
            <div style={{ flex: 1, minWidth: 160 }}><label htmlFor="caption">Caption</label><input id="caption" name="caption" className="input" placeholder="e.g. Bathroom remodel" /></div>
            <button className="btn"><Icon name="upload" size={18} /> Upload</button>
          </form>
        </div>
      )}
    </div>
  );
}
