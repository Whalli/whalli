'use client';

/**
 * Presets Page
 * 
 * Manage AI presets (system instructions, colors, names).
 */

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Button } from '@whalli/ui';
import { Plus, Palette, Loader2, Trash2 } from 'lucide-react';
import type { Preset } from '@whalli/utils';

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await api.getPresets();
      setPresets(data);
    } catch (error) {
      console.error('Failed to load presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePreset = async (id: string) => {
    if (!confirm('Delete this preset?')) return;
    
    try {
      await api.deletePreset(id);
      setPresets(presets.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100">Presets</h1>
              <p className="text-zinc-400 mt-1">Customize AI behavior with system instructions</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Preset
            </Button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800">
              <Palette className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-300 mb-2">No presets yet</h3>
              <p className="text-zinc-500 mb-6">Create your first preset to customize AI behavior</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Preset
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: preset.color }}
                      />
                      <h3 className="font-semibold text-zinc-100">{preset.name}</h3>
                    </div>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-3">
                    {preset.systemInstruction}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
