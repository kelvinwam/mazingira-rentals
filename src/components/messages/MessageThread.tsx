'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Send, Loader2, MapPin, Phone, MessageSquare } from 'lucide-react';
import { messagesAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { cn, formatKES, timeAgo } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Message {
  id:          string;
  body:        string;
  is_read:     boolean;
  sent_at:     string;
  sender_id:   string;
  sender_name: string | null;
  sender_role: string;
}

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
}

interface Props { inquiryId: string; }

export default function MessageThread({ inquiryId }: Props) {
  const { user } = useAuthStore();
  const bottomRef  = useRef<HTMLDivElement>(null);
  const [inquiry,  setInquiry]  = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply,    setReply]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    messagesAPI.thread(inquiryId)
      .then(r => {
        setInquiry(r.data.data.inquiry);
        setMessages(r.data.data.messages);
      })
      .catch(() => toast.error('Could not load conversation.'))
      .finally(() => setLoading(false));
  }, [inquiryId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await messagesAPI.reply(inquiryId, reply.trim());
      setMessages(prev => [...prev, {
        ...res.data.data,
        sender_id:   user!.id,
        sender_name: user!.full_name,
        sender_role: user!.role,
      }]);
      setReply('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-amber-500" />
    </div>
  );

  if (!inquiry) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-navy-400">Conversation not found.</p>
    </div>
  );

  const otherPhone = user?.role === 'LANDLORD' ? inquiry.tenant_phone : inquiry.landlord_phone;
  const otherName  = user?.role === 'LANDLORD'
    ? (inquiry.tenant_name   || 'Tenant')
    : (inquiry.landlord_name || 'Landlord');

  return (
    <div className="flex flex-col h-full">

      {/* Thread header */}
      <div className="p-4 border-b border-surface-100 dark:border-navy-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-100 dark:bg-navy-800 flex-shrink-0">
          {inquiry.apartment_image ? (
            <Image src={inquiry.apartment_image} alt="" width={40} height={40} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MessageSquare size={14} className="text-navy-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm text-navy-900 dark:text-white truncate">
            {otherName}
          </p>
          <Link href={`/listings/${inquiry.apartment_id}`}
            className="text-xs text-navy-400 hover:text-amber-500 transition-colors truncate block">
            {inquiry.apartment_title} · {formatKES(inquiry.price_kes)}/mo
          </Link>
        </div>
        {otherPhone && (
          <a href={`tel:${otherPhone}`}
            className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-navy-800 flex items-center justify-center text-navy-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex-shrink-0">
            <Phone size={15} />
          </a>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-navy-400">No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                isMe
                  ? 'bg-amber-500 text-white rounded-br-sm'
                  : 'bg-surface-100 dark:bg-navy-800 text-navy-800 dark:text-navy-200 rounded-bl-sm'
              )}>
                <p>{msg.body}</p>
                <p className={cn('text-xs mt-1', isMe ? 'text-white/60' : 'text-navy-400')}>
                  {timeAgo(msg.sent_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="p-4 border-t border-surface-100 dark:border-navy-800">
        <form onSubmit={sendReply} className="flex gap-2">
          <input
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Type a message…"
            className="input flex-1 h-11 text-sm"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !reply.trim()}
            className="btn-primary px-4 h-11 justify-center disabled:opacity-50">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
