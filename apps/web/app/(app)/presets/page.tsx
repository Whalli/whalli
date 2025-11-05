'use client';

/**
 * Presets Page
 * 
 * Manage AI presets (system instructions, colors, names).
 */

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { usePageWidgets } from '@/contexts/page-context';
import { Button, Input, Textarea, Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@whalli/ui';
import { Plus, Palette, Loader2, Trash2, Edit2, HelpCircle, Lightbulb } from 'lucide-react';
import { PRESET_COLORS } from '@whalli/utils';
import type { Preset } from '@whalli/utils';

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PRESET_COLORS[11]); // Default blue
  const [systemInstruction, setSystemInstruction] = useState('');
  const [saving, setSaving] = useState(false);

  // Context sidebar
  usePageWidgets([
    {
      id: 'what-are-presets',
      title: 'What are presets?',
      content: (
        <div className="space-y-2 text-sm text-zinc-400">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <span className="font-medium text-zinc-300">About Presets</span>
          </div>
          <p>
            Presets are pre-configured AI assistant personalities. Each preset contains:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>A name for easy identification</li>
            <li>A color for visual distinction</li>
            <li>System instructions that define the assistant&apos;s behavior and expertise</li>
          </ul>
          <p className="mt-3">
            Use presets to quickly switch between different AI assistant modes - like a code reviewer, a creative writer, or a technical explainer.
          </p>
        </div>
      ),
    },
    {
      id: 'system-instruction-tips',
      title: 'Tips for system instructions',
      content: (
        <div className="space-y-2 text-sm text-zinc-400">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-zinc-400" />
            <span className="font-medium text-zinc-300">Best Practices</span>
          </div>
          <p className="font-medium text-zinc-300">Write effective instructions:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Be specific about the role and expertise</li>
            <li>Define the tone (formal, casual, technical)</li>
            <li>Specify any constraints or guidelines</li>
            <li>Include output format preferences</li>
            <li>Keep it concise but comprehensive</li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Example: &quot;You are an expert TypeScript developer. Provide clear, type-safe code examples with explanations. Focus on modern best practices and performance.&quot;
          </p>
        </div>
      ),
    },
  ]);

  useEffect(() => {
    loadPresets();
  }, []);

  async function loadPresets() {
    try {
      setLoading(true);
      const data = await api.getPresets();
      setPresets(data);
    } catch (error) {
      console.error('Failed to load presets:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingPreset(null);
    setName('');
    setColor(PRESET_COLORS[11]);
    setSystemInstruction('');
    setShowModal(true);
  }

  function openEditModal(preset: Preset) {
    setEditingPreset(preset);
    setName(preset.name);
    setColor(preset.color);
    setSystemInstruction(preset.systemInstruction);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPreset(null);
    setName('');
    setColor(PRESET_COLORS[11]);
    setSystemInstruction('');
  }

  async function handleSave() {
    if (!name.trim() || !systemInstruction.trim()) {
      alert('Name and system instruction are required');
      return;
    }

    try {
      setSaving(true);
      
      if (editingPreset) {
        // Update existing preset
        const updated = await api.updatePreset(editingPreset.id, {
          name: name.trim(),
          color,
          systemInstruction: systemInstruction.trim(),
        });
        setPresets(presets.map(p => p.id === updated.id ? updated : p));
      } else {
        // Create new preset
        const created = await api.createPreset({
          name: name.trim(),
          color,
          systemInstruction: systemInstruction.trim(),
        });
        setPresets([...presets, created]);
      }
      
      closeModal();
    } catch (error) {
      console.error('Failed to save preset:', error);
      alert('Failed to save preset');
    } finally {
      setSaving(false);
    }
  }

  async function deletePreset(id: string) {
    if (!confirm('Are you sure you want to delete this preset?')) return;

    try {
      await api.deletePreset(id);
      setPresets(presets.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete preset:', error);
      alert('Failed to delete preset');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100">Presets</h1>
              <p className="text-zinc-400 mt-1">
                Manage your AI assistant presets
              </p>
            </div>
            <Button
              onClick={openCreateModal}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Preset
            </Button>
          </div>

          {/* Presets grid */}
          {presets.length === 0 ? (
            <div className="text-center py-16">
              <Palette className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
              <p className="text-zinc-500 mb-4">No presets yet</p>
              <Button
                onClick={openCreateModal}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create your first preset
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => openEditModal(preset)}
                  className="p-6 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    {/* Color circle */}
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: preset.color }}
                    />
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-zinc-100">
                          {preset.name}
                        </h3>
                        <Edit2 className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                      </div>
                      <p className="text-sm text-zinc-400 line-clamp-3">
                        {preset.systemInstruction}
                      </p>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(preset.id);
                      }}
                      className="text-zinc-500 hover:text-red-500 transition-colors p-1"
                      title="Delete preset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={closeModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              {editingPreset ? 'Edit Preset' : 'New Preset'}
            </ModalTitle>
          </ModalHeader>

          <div className="space-y-6 py-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Code Reviewer"
                maxLength={100}
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Color
              </label>
              <div className="grid grid-cols-9 gap-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === presetColor
                        ? 'ring-2 ring-zinc-400 ring-offset-2 ring-offset-zinc-950 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
            </div>

            {/* System Instruction */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                System Instruction
              </label>
              <Textarea
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                placeholder="Describe the assistant's role, expertise, tone, and behavior..."
                rows={8}
                maxLength={5000}
              />
              <p className="text-xs text-zinc-500 mt-1">
                {systemInstruction.length} / 5000 characters
              </p>
            </div>
          </div>

          <ModalFooter>
            <Button
              variant="ghost"
              onClick={closeModal}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || !systemInstruction.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingPreset ? 'Save Changes' : 'Create Preset'
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
