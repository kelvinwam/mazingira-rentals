'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, DollarSign, Info, Home } from 'lucide-react';
import { landlordAPI, areasAPI, amenitiesAPI } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { Area, Amenity } from '../../types';
import toast from 'react-hot-toast';

interface FormData {
  title:        string;
  description:  string;
  price_kes:    string;
  deposit_kes:  string;
  area_id:      string;
  bedrooms:     string;
  bathrooms:    string;
  floor_level:  string;
  address_hint: string;
  latitude:     string;
  longitude:    string;
  amenity_ids:  string[];
}

const BLANK: FormData = {
  title: '', description: '', price_kes: '', deposit_kes: '',
  area_id: '', bedrooms: '', bathrooms: '', floor_level: '',
  address_hint: '', latitude: '', longitude: '', amenity_ids: [],
};

interface Props {
  listingId?: string;
  initial?:   Partial<FormData>;
  mode:       'create' | 'edit';
}

export default function ListingForm({ listingId, initial, mode }: Props) {
  const router = useRouter();
  const [form,       setForm]       = useState<FormData>({ ...BLANK, ...initial });
  const [areas,      setAreas]      = useState<Area[]>([]);
  const [amenities,  setAmenities]  = useState<Record<string, Amenity[]>>({});
  const [loading,    setLoading]    = useState(false);
  const [loadingRef, setLoadingRef] = useState(true);

  useEffect(() => {
    Promise.all([areasAPI.list(), amenitiesAPI.list()])
      .then(([aRes, amRes]) => {
        setAreas(aRes.data.data);
        setAmenities(amRes.data.data.grouped);
      })
      .catch(() => toast.error('Could not load form data. Refresh and try again.'))
      .finally(() => setLoadingRef(false));
  }, []);

  const set = (key: keyof FormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const toggleAmenity = (id: string) => {
    setForm(f => ({
      ...f,
      amenity_ids: f.amenity_ids.includes(id)
        ? f.amenity_ids.filter(a => a !== id)
        : [...f.amenity_ids, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim())       return toast.error('Title is required.');
    if (!form.description.trim()) return toast.error('Description is required.');
    if (!form.price_kes)          return toast.error('Monthly rent is required.');
    if (!form.area_id)            return toast.error('Please select an area.');
    if (!form.latitude || !form.longitude) return toast.error('GPS coordinates are required.');

    setLoading(true);
    try {
      const payload = {
        ...form,
        price_kes:   parseInt(form.price_kes),
        deposit_kes: form.deposit_kes ? parseInt(form.deposit_kes) : 0,
        bedrooms:    form.bedrooms   ? parseInt(form.bedrooms)    : undefined,
        bathrooms:   form.bathrooms  ? parseInt(form.bathrooms)   : undefined,
        floor_level: form.floor_level? parseInt(form.floor_level) : undefined,
        latitude:    parseFloat(form.latitude),
        longitude:   parseFloat(form.longitude),
      };

      if (mode === 'create') {
        const res = await landlordAPI.createListing(payload);
        toast.success(res.data.message);
        router.push(`/landlord/listings/${res.data.data.id}/edit?tab=images`);
      } else {
        await landlordAPI.updateListing(listingId!, payload);
        toast.success('Listing updated.');
        router.push('/landlord/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save listing.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRef) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={28} className="animate-spin text-amber-500" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Basic info */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Info size={16} className="text-amber-500" />
          <h3 className="font-display font-bold text-base text-navy-900 dark:text-white">Basic Information</h3>
        </div>

        <div>
          <label className="label">Listing Title</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. Modern 2-bedroom apartment near Machakos bus stage"
            className="input" required />
          <p className="text-xs text-navy-400 mt-1">{form.title.length}/200 characters</p>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Describe the apartment in detail — size, condition, what's nearby, what's included…"
            rows={5} className="input resize-none" required />
          <p className="text-xs text-navy-400 mt-1">{form.description.length} characters (min 50)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Area / Location</label>
            <select value={form.area_id} onChange={e => set('area_id', e.target.value)} className="input" required>
              <option value="">Select area…</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Address Hint</label>
            <input value={form.address_hint} onChange={e => set('address_hint', e.target.value)}
              placeholder="e.g. Near Equity Bank, off Mwatu road" className="input" />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign size={16} className="text-amber-500" />
          <h3 className="font-display font-bold text-base text-navy-900 dark:text-white">Pricing</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Monthly Rent (KES)</label>
            <input type="number" min="1" value={form.price_kes} onChange={e => set('price_kes', e.target.value)}
              placeholder="e.g. 8000" className="input" required />
          </div>
          <div>
            <label className="label">Deposit (KES) <span className="text-navy-400 font-normal text-xs">optional</span></label>
            <input type="number" min="0" value={form.deposit_kes} onChange={e => set('deposit_kes', e.target.value)}
              placeholder="e.g. 16000" className="input" />
          </div>
        </div>
      </div>

      {/* Property details */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Home size={16} className="text-amber-500" />
          <h3 className="font-display font-bold text-base text-navy-900 dark:text-white">Property Details</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Bedrooms</label>
            <select value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} className="input">
              <option value="">Any</option>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Bathrooms</label>
            <select value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} className="input">
              <option value="">Any</option>
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Floor Level</label>
            <select value={form.floor_level} onChange={e => set('floor_level', e.target.value)} className="input">
              <option value="">N/A</option>
              <option value="0">Ground</option>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* GPS */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={16} className="text-amber-500" />
          <h3 className="font-display font-bold text-base text-navy-900 dark:text-white">GPS Location</h3>
        </div>
        <p className="text-sm text-navy-500 dark:text-navy-400 -mt-2">
          Open{' '}
          <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer"
            className="text-amber-600 underline">Google Maps</a>
          {' '}on your phone, long-press your apartment location, and copy the coordinates shown at the top.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Latitude</label>
            <input type="number" step="any" value={form.latitude}
              onChange={e => set('latitude', e.target.value)}
              placeholder="e.g. -1.516700" className="input" required />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input type="number" step="any" value={form.longitude}
              onChange={e => set('longitude', e.target.value)}
              placeholder="e.g. 37.261600" className="input" required />
          </div>
        </div>
      </div>

      {/* Amenities */}
      {Object.keys(amenities).length > 0 && (
        <div className="card p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-navy-900 dark:text-white">Amenities</h3>
          {Object.entries(amenities).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-2 capitalize">{cat}</p>
              <div className="flex flex-wrap gap-2">
                {items.map(a => {
                  const selected = form.amenity_ids.includes(a.id);
                  return (
                    <button key={a.id} type="button" onClick={() => toggleAmenity(a.id)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        selected
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-700 dark:text-navy-300 hover:border-amber-400')}>
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="btn-secondary px-6">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-3">
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
            : mode === 'create' ? 'Submit Listing' : 'Save Changes'}
        </button>
      </div>

      {mode === 'create' && (
        <p className="text-xs text-center text-navy-400">
          Your listing will be reviewed by our admin team before going live. This usually takes a few hours.
        </p>
      )}
    </form>
  );
}
