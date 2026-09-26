import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { get, put } from '../services/api.js';
import { useFetch } from '../utils/hooks.js';
import { useSite } from '../context/site.jsx';
import { Field, ErrorState, Skeleton, Seo } from '../components/Common.jsx';
import { ImageUploader, PageHead } from './ui.jsx';

function Rows({ label, value = [], onChange, fields, blank }) {
  const setRow = (i, k, v) => onChange(value.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="field"><label>{label}</label>
      {value.map((r, i) => (
        <div className="flex gap wrap" key={i} style={{ marginBottom: 6 }}>
          {fields.map(([k, ph, w]) => <input key={k} className="input" style={{ flex: w || 1, minWidth: 120 }} placeholder={ph} aria-label={ph} value={r[k] ?? ''} onChange={(e) => setRow(i, k, e.target.value)} />)}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove row">✕</button>
        </div>))}
      <div><button type="button" className="btn btn-outline btn-sm" onClick={() => onChange([...value, { ...blank }])}>+ Add</button></div>
    </div>
  );
}

export default function Settings() {
  const { reload: reloadSite } = useSite();
  const { data, loading, error, reload } = useFetch(() => get('/admin/settings').then((r) => r.data.settings), []);
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setS(JSON.parse(JSON.stringify(data))); }, [data]);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !s) return <Skeleton h={400} />;
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const setIn = (o, k, v) => setS((x) => ({ ...x, [o]: { ...x[o], [k]: v } }));
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    const body = { ...s, freeDeliveryThreshold: Number(s.freeDeliveryThreshold), deliveryCharge: Number(s.deliveryCharge), taxPercent: Number(s.taxPercent),
      announcements: s.announcements.filter(Boolean), popup: { ...s.popup, priority: Number(s.popup.priority), delaySeconds: Number(s.popup.delaySeconds) } };
    try { await put('/admin/settings', body); toast.success('Settings saved'); reloadSite(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const t = (k, label, type = 'text') => <Field label={label} id={`s-${k}`}><input id={`s-${k}`} className="input" type={type} step="any" value={s[k] ?? ''} onChange={(e) => set(k, e.target.value)} /></Field>;
  return (
    <form onSubmit={save}><Seo title="Settings (admin)" description="Admin" />
      <PageHead title="Site settings"><button className="btn btn-yellow btn-sm" disabled={busy}>{busy ? 'Saving...' : 'Save settings'}</button></PageHead>
      <div className="adm-grid-2">
        <div className="adm-card form-stack"><b>Store</b>{t('storeName', 'Store name')}{t('email', 'Contact email', 'email')}{t('phone', 'Phone')}{t('address', 'Address')}
          <Field label="Logo"><ImageUploader multiple={false} folder="branding" value={s.logo ? [{ url: s.logo }] : []} onChange={(a) => set('logo', a[0]?.url || '/img/logo.jpg')} /></Field>
          <div className="grid-2"><Field label="Facebook URL" id="fb"><input id="fb" className="input" value={s.social?.facebook || ''} onChange={(e) => setIn('social', 'facebook', e.target.value)} /></Field><Field label="Instagram URL" id="ig"><input id="ig" className="input" value={s.social?.instagram || ''} onChange={(e) => setIn('social', 'instagram', e.target.value)} /></Field></div></div>
        <div className="adm-card form-stack"><b>Delivery &amp; tax</b>{t('freeDeliveryThreshold', 'Free delivery threshold (Rs.)', 'number')}{t('deliveryCharge', 'Default delivery charge (Rs.)', 'number')}{t('taxPercent', 'GST / tax % added at checkout (0 = prices include tax)', 'number')}
          <b style={{ marginTop: 8 }}>Announcement ticker</b><Rows label="Messages" value={s.announcements.map((a) => ({ a }))} onChange={(v) => set('announcements', v.map((x) => x.a))} fields={[['a', 'Offer text']]} blank={{ a: '' }} /></div>
      </div>
      <div className="adm-card form-stack" style={{ marginBottom: 18 }}><b>Limited time offers popup</b>
        <label style={{ display: 'flex', gap: 8, fontSize: 13 }}><input type="checkbox" checked={s.popup.enabled} onChange={(e) => setIn('popup', 'enabled', e.target.checked)} />Enabled</label>
        <div className="grid-2"><Field label="Title" id="pt"><input id="pt" className="input" value={s.popup.title} onChange={(e) => setIn('popup', 'title', e.target.value)} /></Field><Field label="Subtitle" id="ps"><input id="ps" className="input" value={s.popup.subtitle} onChange={(e) => setIn('popup', 'subtitle', e.target.value)} /></Field>
          <Field label="Button text" id="pc"><input id="pc" className="input" value={s.popup.ctaText} onChange={(e) => setIn('popup', 'ctaText', e.target.value)} /></Field><Field label="Button link" id="pu"><input id="pu" className="input" value={s.popup.ctaUrl} onChange={(e) => setIn('popup', 'ctaUrl', e.target.value)} /></Field>
          <Field label="Priority" id="pp"><input id="pp" className="input" type="number" value={s.popup.priority} onChange={(e) => setIn('popup', 'priority', e.target.value)} /></Field><Field label="Show after (seconds)" id="pd"><input id="pd" className="input" type="number" min="0" value={s.popup.delaySeconds} onChange={(e) => setIn('popup', 'delaySeconds', e.target.value)} /></Field></div>
        <Rows label="Offer cards" value={s.popup.offers} onChange={(v) => setIn('popup', 'offers', v)} fields={[['title', 'Heading e.g. Buy 2 Get 2 free'], ['subtitle', 'Product'], ['note', 'Note'], ['image', 'Image URL or /img/walnuts.jpg'], ['url', 'Link']]} blank={{ title: '', subtitle: '', note: '', image: '', url: '' }} /></div>
      <div className="adm-grid-2">
        <div className="adm-card form-stack"><b>Navigation</b><Rows label="Menu links (leave empty for defaults)" value={s.navLinks} onChange={(v) => set('navLinks', v)} fields={[['label', 'Label'], ['to', '/category/nuts']]} blank={{ label: '', to: '' }} /></div>
        <div className="adm-card form-stack"><b>Shop by purpose</b><Rows label="Items" value={s.purposes} onChange={(v) => set('purposes', v)} fields={[['label', 'Label'], ['to', 'Link']]} blank={{ label: '', to: '' }} /><b>Store stats</b><Rows label="Numbers" value={s.stats} onChange={(v) => set('stats', v)} fields={[['value', '500+'], ['label', 'Label']]} blank={{ value: '', label: '' }} /></div>
      </div>
      <div className="adm-card form-stack" style={{ marginBottom: 18 }}><b>FAQs</b><Rows label="Questions" value={s.faqs} onChange={(v) => set('faqs', v)} fields={[['q', 'Question', 1], ['a', 'Answer', 2]]} blank={{ q: '', a: '' }} /></div>
      <div className="adm-card form-stack"><b>Testimonials</b><Rows label="Customer quotes" value={s.testimonials} onChange={(v) => set('testimonials', v.map((x) => ({ ...x, rating: Number(x.rating) || 5 })))} fields={[['name', 'Name'], ['text', 'Quote', 3], ['rating', '5']]} blank={{ name: '', text: '', rating: 5 }} /></div>
    </form>
  );
}
