require('dotenv').config();
const { query, connectDB } = require('./connection');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Seeding database...\n');

    // Areas
    const areas = [
      { name: 'Machakos CBD',  slug: 'machakos-cbd',  description: 'Town centre with shops and offices',       lat: -1.5177,  lng: 37.2634 },
      { name: 'Athi River',    slug: 'athi-river',    description: 'Industrial suburb with good transport',     lat: -1.4544,  lng: 36.9773 },
      { name: 'Mlolongo',      slug: 'mlolongo',      description: 'Growing estate near Nairobi highway',       lat: -1.4316,  lng: 36.9898 },
      { name: 'Syokimau',      slug: 'syokimau',      description: 'Residential estate near SGR station',       lat: -1.3823,  lng: 36.9742 },
      { name: 'Kathiani',      slug: 'kathiani',      description: 'Quiet rural town east of Machakos',         lat: -1.4833,  lng: 37.3500 },
      { name: 'Masii',         slug: 'masii',         description: 'Small market town in lower Machakos',       lat: -1.7167,  lng: 37.5833 },
    ];

    for (const a of areas) {
      await query(
        `INSERT INTO areas (name, slug, description, center_lat, center_lng)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING`,
        [a.name, a.slug, a.description, a.lat, a.lng]
      );
    }
    console.log(`✅  ${areas.length} areas seeded`);

    // Amenities
    const amenities = [
      { name: 'WiFi',              category: 'connectivity', icon: 'wifi'         },
      { name: 'Parking',           category: 'transport',    icon: 'parking'      },
      { name: 'Security Guard',    category: 'security',     icon: 'shield'       },
      { name: 'CCTV',              category: 'security',     icon: 'camera'       },
      { name: 'Water 24/7',        category: 'utilities',    icon: 'droplets'     },
      { name: 'Electricity Backup',category: 'utilities',    icon: 'zap'          },
      { name: 'Garbage Collection',category: 'utilities',    icon: 'trash'        },
      { name: 'Furnished',         category: 'interior',     icon: 'sofa'         },
      { name: 'Swimming Pool',     category: 'recreation',   icon: 'waves'        },
      { name: 'Gym',               category: 'recreation',   icon: 'dumbbell'     },
      { name: 'Balcony',           category: 'interior',     icon: 'layout'       },
      { name: 'Garden',            category: 'exterior',     icon: 'trees'        },
      { name: 'Lift / Elevator',   category: 'accessibility',icon: 'arrow-up'     },
      { name: 'Wheelchair Access', category: 'accessibility',icon: 'accessibility'},
      { name: 'Pet Friendly',      category: 'policies',     icon: 'paw-print'    },
      { name: 'Kids Allowed',      category: 'policies',     icon: 'baby'         },
      { name: 'Shop Nearby',       category: 'nearby',       icon: 'store'        },
      { name: 'School Nearby',     category: 'nearby',       icon: 'school'       },
      { name: 'Hospital Nearby',   category: 'nearby',       icon: 'hospital'     },
      { name: 'Bus Stage Nearby',  category: 'nearby',       icon: 'bus'          },
    ];

    for (const a of amenities) {
      await query(
        `INSERT INTO amenities (name, category, icon) VALUES ($1,$2,$3) ON CONFLICT (name) DO NOTHING`,
        [a.name, a.category, a.icon]
      );
    }
    console.log(`✅  ${amenities.length} amenities seeded`);

    // Admin user
    const pw   = await bcrypt.hash('admin1234', 12);
    const admin = await query(
      `INSERT INTO users (phone, password_hash, role, full_name, is_phone_verified)
       VALUES ('+254700000000', $1, 'ADMIN', 'Mazingira Admin', true)
       ON CONFLICT (phone) DO UPDATE SET password_hash=$1, role='ADMIN'
       RETURNING id, phone, role`,
      [pw]
    );
    console.log(`✅  Admin user: +254700000000 / admin1234`);
    console.log(`    ID: ${admin.rows[0].id}`);

    console.log('\n🎉 Seeding complete!\n');
    console.log('──────────────────────────────────────────');
    console.log('Admin login:  +254700000000 / admin1234');
    console.log('Admin panel:  http://localhost:3000/admin/dashboard');
    console.log('──────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
