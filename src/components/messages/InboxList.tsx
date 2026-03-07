'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, MapPin, Circle } from 'lucide-react';
import { formatKES, timeAgo } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

interface Inquiry {
  id:              string;
  apartment_id:    string;
  apartment_title: string;
  price_kes:       number;
  area_name:       string;
  apartment_image: string | null;
  tenant_name:     string | null;
  tenant_phone:    string;
  landlord_name:   string | null;
  landlord_phone:  string;
  last_message:    string | null;
  last_message_at: string | null;
  unread_count:    string;
  created_at:      string;
}

interface Props {
  inquiries: Inquiry[];
  activeId?: string;
}

export default function InboxList({ inquiries, activeId }: Props) {
  const { user } = useAuthStore();

  if (inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <MessageSquare size={36} className="text-surface-300 dark:text-navy-700 mb-3" />
        <p className="font-display font-semibold text-navy-900 dark:text-white mb-1">No messages yet</p>
        <p className="text-sm text-navy-400">
          {user?.role === 'LANDLORD'
            ? 'Tenant inquiries will appear here.'
            : 'Message a landlord from any listing.'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-surface-50 dark:divide-navy-800">
      {inquiries.map(inq => {
        const unread   = parseInt(inq.unread_count) > 0;
        const isActive = inq.id === activeId;
        const otherName = user?.role === 'LANDLORD'
          ? (inq.tenant_name   || 'Tenant')
          : (inq.landlord_name || 'Landlord');

        return (
          <Link key={inq.id} href={`/messages/${inq.id}`}
            className={cn(
              'flex gap-3 p-4 hover:bg-surface-50 dark:hover:bg-navy-900/50 transition-colors',
              isActive && 'bg-amber-50 dark:bg-amber-900/10 border-l-2 border-amber-500'
            )}>

            {/* Apartment thumbnail */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-100 dark:bg-navy-800 flex-shrink-0">
              {inq.apartment_image ? (
                <Image src={inq.apartment_image} alt="" width={48} height={48} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MessageSquare size={16} className="text-navy-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={cn('font-display font-semibold text-sm truncate',
                  unread ? 'text-navy-900 dark:text-white' : 'text-navy-700 dark:text-navy-300')}>
                  {otherName}
                </p>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {unread && <Circle size={8} className="fill-amber-500 text-amber-500" />}
                  <span className="text-xs text-navy-400">
                    {timeAgo(inq.last_message_at || inq.created_at)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-navy-500 dark:text-navy-400 truncate mt-0.5">
                {inq.apartment_title}
              </p>

              {inq.last_message && (
                <p className={cn('text-xs mt-1 truncate',
                  unread ? 'text-navy-700 dark:text-navy-200 font-medium' : 'text-navy-400')}>
                  {inq.last_message}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
