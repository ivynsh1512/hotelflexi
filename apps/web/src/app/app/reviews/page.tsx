'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Star,
  MessageSquare,
  Sparkles,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  Calendar,
  Filter,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  guest_name: string;
  reservation_id: string | null;
  overall_rating: number;
  cleanliness_rating: number | null;
  staff_rating: number | null;
  food_rating: number | null;
  comfort_rating: number | null;
  feedback_text: string | null;
  ai_polished_draft: string | null;
  is_private_feedback: number;
  google_review_clicked: number;
  response_text: string | null;
  responded_at: number | null;
  created_at: number;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: Record<string, number>;
  unrepliedCount: number;
}

export default function GuestReviewsPage() {
  const { currentTenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);

  // Filter
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | 'low'>('all');

  // Response drafting states
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [draftingAi, setDraftingAi] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const propData = await apiClient('/properties');
      const activeProp = propData.properties?.[0];
      if (!activeProp) {
        setLoading(false);
        return;
      }
      setPropertyId(activeProp.id);

      const res = await apiClient(`/reviews/property/${activeProp.id}`);
      setReviews(res.reviews || []);
      setStats(res.stats || null);
    } catch (e) {
      console.error('Failed to load guest reviews:', e);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDraftAiResponse = async (review: ReviewItem) => {
    setActiveReplyId(review.id);
    setDraftingAi(true);
    try {
      const res = await apiClient('/reviews/draft-response', {
        method: 'POST',
        body: JSON.stringify({
          reviewId: review.id,
          guestName: review.guest_name,
          overallRating: review.overall_rating,
          feedbackText: review.feedback_text || review.ai_polished_draft || '',
        }),
      });
      if (res.draftResponse) {
        setReplyText(res.draftResponse);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to draft AI response');
    } finally {
      setDraftingAi(false);
    }
  };

  const handleSendResponse = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await apiClient(`/reviews/${reviewId}/response`, {
        method: 'POST',
        body: JSON.stringify({ responseText: replyText.trim() }),
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, response_text: replyText.trim(), responded_at: Math.floor(Date.now() / 1000) } : r
        )
      );
      setActiveReplyId(null);
      setReplyText('');
    } catch (err: any) {
      alert(err.message || 'Failed to send response');
    } finally {
      setSendingReply(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter === '5') return r.overall_rating === 5;
    if (ratingFilter === '4') return r.overall_rating === 4;
    if (ratingFilter === '3') return r.overall_rating === 3;
    if (ratingFilter === 'low') return r.overall_rating <= 2;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Guest Feedback &amp; Reviews
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Monitor guest satisfaction, respond with AI assistance, and uphold Google Review compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh Reviews"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Average Rating</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.averageRating ? stats.averageRating.toFixed(1) : '5.0'}
            <span className="text-xs font-normal text-slate-400 ml-1">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-500">From {stats?.totalReviews || 0} reviews</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Reviews</span>
            <MessageSquare className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalReviews || 0}</div>
          <p className="text-[11px] text-slate-500">Post-stay guest ratings</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pending Replies</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats?.unrepliedCount || 0}</div>
          <p className="text-[11px] text-slate-500">Awaiting management response</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Google Review Link</span>
            <ExternalLink className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {reviews.filter((r) => r.google_review_clicked === 1).length}
          </div>
          <p className="text-[11px] text-slate-500">Guests routed to Google</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {[
            { id: 'all', label: 'All Reviews' },
            { id: '5', label: '5 Stars' },
            { id: '4', label: '4 Stars' },
            { id: '3', label: '3 Stars' },
            { id: 'low', label: '1-2 Stars' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRatingFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition ${
                ratingFilter === tab.id
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <Star className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-900">No reviews found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Guests will submit reviews via their checkout FlexiLink. All reviews will be recorded here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {rev.guest_name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{rev.guest_name}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.created_at * 1000).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {rev.is_private_feedback === 1 && ' • Confidential Note'}
                      {rev.google_review_clicked === 1 && ' • Visited Google Review'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rev.overall_rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-slate-900 ml-1.5">
                    {rev.overall_rating}.0
                  </span>
                </div>
              </div>

              {/* Category sub-scores if available */}
              {(rev.cleanliness_rating || rev.staff_rating || rev.food_rating || rev.comfort_rating) && (
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
                  {rev.cleanliness_rating && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                      Cleanliness: <strong>{rev.cleanliness_rating}/5</strong>
                    </span>
                  )}
                  {rev.staff_rating && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                      Staff: <strong>{rev.staff_rating}/5</strong>
                    </span>
                  )}
                  {rev.food_rating && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                      Food: <strong>{rev.food_rating}/5</strong>
                    </span>
                  )}
                  {rev.comfort_rating && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                      Comfort: <strong>{rev.comfort_rating}/5</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Feedback text */}
              {rev.feedback_text && (
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  &ldquo;{rev.feedback_text}&rdquo;
                </p>
              )}

              {/* AI Polished Draft if available */}
              {rev.ai_polished_draft && rev.ai_polished_draft !== rev.feedback_text && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" /> Guest Polished Review:
                  </span>
                  <p className="italic">&ldquo;{rev.ai_polished_draft}&rdquo;</p>
                </div>
              )}

              {/* Existing Response */}
              {rev.response_text ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center justify-between font-bold text-[11px] text-emerald-800">
                    <span>Response from Property General Manager</span>
                    {rev.responded_at && (
                      <span className="font-normal text-emerald-700">
                        {new Date(rev.responded_at * 1000).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">{rev.response_text}</p>
                </div>
              ) : (
                /* Response action bar */
                <div>
                  {activeReplyId === rev.id ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          Draft Response to {rev.guest_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDraftAiResponse(rev)}
                          disabled={draftingAi}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          {draftingAi ? 'Drafting...' : 'Redraft with AI'}
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a warm, gracious response thanking the guest or addressing their feedback..."
                        className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReplyId(null);
                            setReplyText('');
                          }}
                          className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-200 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendResponse(rev.id)}
                          disabled={sendingReply || !replyText.trim()}
                          className="px-4 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                        >
                          <Send className="w-3 h-3" />
                          {sendingReply ? 'Sending...' : 'Publish Response'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDraftAiResponse(rev)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        AI Draft Response
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyId(rev.id);
                          setReplyText('');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                      >
                        Reply Manually
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
