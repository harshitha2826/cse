// src/components/marketplace/PostSkillModal.tsx
import React, { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { X, PlusCircle, Coins, MapPin, Globe, Compass } from 'lucide-react';

interface PostSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillAdded: () => void;
}

export const PostSkillModal: React.FC<PostSkillModalProps> = ({ isOpen, onClose, onSkillAdded }) => {
  const { updateUserCredits } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [type, setType] = useState<'offered' | 'wanted'>('offered');
  const [proficiency, setProficiency] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Intermediate');
  const [mode, setMode] = useState<'Online' | 'Offline' | 'Both'>('Both');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const locationData = (mode === 'Offline' || mode === 'Both')
        ? {
            city: city || undefined,
            address: address || undefined,
            lat: lat ? parseFloat(lat) : undefined,
            lng: lng ? parseFloat(lng) : undefined,
          }
        : undefined;

      const res = await api.post('/skills', {
        title,
        description,
        category,
        type,
        proficiency,
        mode,
        location: locationData,
        tags,
      });
      if (res.data.credits !== undefined && updateUserCredits) {
        updateUserCredits(res.data.credits);
      }
      onSkillAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post skill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-background dark:bg-background-dark border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-2">
          <PlusCircle className="w-5 h-5" /> Post a Skill Listing
        </h2>

        {type === 'offered' && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <Coins className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
            <span>Offer a skill to teach and gain <strong className="text-amber-500">+10 Credits</strong> added directly to your profile!</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-gray-500 mb-1">Listing Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="radio"
                  name="type"
                  checked={type === 'offered'}
                  onChange={() => setType('offered')}
                  className="accent-primary"
                />
                Skill I Want to Offer
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="radio"
                  name="type"
                  checked={type === 'wanted'}
                  onChange={() => setType('wanted')}
                  className="accent-primary"
                />
                Skill I Want to Learn
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-gray-500 mb-1">Skill Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Python for Beginners, Graphic Design, Acoustic Guitar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background dark:bg-background-dark focus:ring-2 focus:ring-primary outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-semibold text-gray-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background dark:bg-background-dark focus:ring-2 focus:ring-primary outline-none text-sm"
              >
                <option value="Technology">Technology</option>
                <option value="Design">Design</option>
                <option value="Languages">Languages</option>
                <option value="Music">Music</option>
                <option value="Business">Business</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-gray-500 mb-1">Proficiency Level</label>
              <select
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md bg-background dark:bg-background-dark focus:ring-2 focus:ring-primary outline-none text-sm"
              >
                <option value="Beginner">Beginner (5 Credits)</option>
                <option value="Intermediate">Intermediate (10 Credits)</option>
                <option value="Expert">Expert (20 Credits)</option>
              </select>
            </div>
          </div>

          {/* Learning Mode */}
          <div>
            <label className="block text-xs uppercase font-semibold text-gray-500 mb-1">Learning Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('Online')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'Online'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-foreground border-border hover:bg-gray-200 dark:hover:bg-zinc-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Online Only
              </button>
              <button
                type="button"
                onClick={() => setMode('Offline')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'Offline'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-surface text-foreground border-border hover:bg-gray-200 dark:hover:bg-zinc-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Offline Only
              </button>
              <button
                type="button"
                onClick={() => setMode('Both')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'Both'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-surface text-foreground border-border hover:bg-gray-200 dark:hover:bg-zinc-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" /> Both / Flexible
              </button>
            </div>
          </div>

          {/* Location details when Offline or Both */}
          {(mode === 'Offline' || mode === 'Both') && (
            <div className="p-4 bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <MapPin className="w-4 h-4" /> Offline Location & Map Details
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, NY"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-md bg-background dark:bg-background-dark focus:ring-2 focus:ring-primary outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Address / Venue Name</label>
                  <input
                    type="text"
                    placeholder="e.g. City Public Library, Room 3B"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-md bg-background dark:bg-background-dark focus:ring-2 focus:ring-primary outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Latitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 40.7128"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-md bg-background dark:bg-background-dark focus:ring-2 focus:ring-primary outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Longitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. -74.0060"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-md bg-background dark:bg-background-dark focus:ring-2 focus:ring-primary outline-none text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase font-semibold text-gray-500 mb-1">Description</label>
            <textarea
              required
              rows={3}
              placeholder="Explain what you can teach or what you'd like to learn in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background dark:bg-background-dark focus:ring-2 focus:ring-primary outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-gray-500 mb-1">Tags (Comma Separated)</label>
            <input
              type="text"
              placeholder="e.g. React, Coding, Web, Frontend"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background dark:bg-background-dark focus:ring-2 focus:ring-primary outline-none text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md bg-primary text-white font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Publish Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
