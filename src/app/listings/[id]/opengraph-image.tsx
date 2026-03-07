import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt     = 'Mazingira Listing';
export const size    = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';

export default async function Image({ params }: { params: { id: string } }) {
  try {
    const res  = await fetch(`${API}/listings/${params.id}`);
    const data = await res.json();
    const l    = data.data;

    const img = l?.images?.[0]?.url || null;
    const price = l?.price_kes
      ? `KES ${parseInt(l.price_kes).toLocaleString()}/mo`
      : '';

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            backgroundColor: '#0f172a', position: 'relative',
          }}>
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.95) 40%, transparent)' }} />
          <div style={{ position: 'absolute', bottom: 48, left: 56, right: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>M</span>
              </div>
              <span style={{ color: '#f59e0b', fontSize: 18, fontWeight: 600 }}>Mazingira</span>
            </div>
            <p style={{ color: 'white', fontSize: 36, fontWeight: 700, margin: 0, lineHeight: 1.2, marginBottom: 12 }}>
              {l?.title || 'Rental Listing'}
            </p>
            <div style={{ display: 'flex', gap: 24, color: '#94a3b8', fontSize: 20 }}>
              {l?.area_name && <span>📍 {l.area_name}</span>}
              {price         && <span style={{ color: '#f59e0b', fontWeight: 600 }}>{price}</span>}
              {l?.bedrooms   && <span>🛏 {l.bedrooms} bed</span>}
            </div>
          </div>
        </div>
      ),
      { ...size }
    );
  } catch {
    return new ImageResponse(
      <div style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#f59e0b', fontSize: 48, fontWeight: 700 }}>Mazingira</span>
      </div>,
      { ...size }
    );
  }
}
