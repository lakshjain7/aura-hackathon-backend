import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { CATEGORIES, DEPARTMENTS } from '../../utils/constants'
import { useToast } from '../ui/Toast'

export default function OverrideModal({ isOpen, onClose, complaint, onOverride }) {
  const [category, setCategory] = useState(complaint?.category || '')
  const [department, setDepartment] = useState('')
  const [reason, setReason] = useState('')
  const { addToast } = useToast()

  const filteredDepts = DEPARTMENTS.filter(d => !category || d.category === category)

  const handleSubmit = () => {
    onOverride?.({ complaintId: complaint?.id, category, department, reason })
    addToast('Classification corrected. Model accuracy updating.', 'success')
    onClose()
  }

  if (!complaint) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Override AI Classification">
      <div className="space-y-4">
        {/* Current AI output */}
        <div className="rounded-lg p-3" style={{ background: 'var(--aura-bg-base)', border: '1px solid var(--aura-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Current AI output</p>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Category: {complaint.category} · Department: {complaint.department || 'GHMC Sanitation'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--sev-medium)' }}>
            Confidence: {complaint.confidence || 71}% — AI was uncertain about this one
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full h-10 px-3 rounded-lg text-sm outline-none appearance-none cursor-pointer"
            style={{ background: 'var(--aura-bg-elevated)', border: '1px solid var(--aura-border)', color: 'var(--text-primary)' }}
          >
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Department</label>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="w-full h-10 px-3 rounded-lg text-sm outline-none appearance-none cursor-pointer"
            style={{ background: 'var(--aura-bg-elevated)', border: '1px solid var(--aura-border)', color: 'var(--text-primary)' }}
          >
            <option value="">Select department</option>
            {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Why is the AI wrong here?"
            className="w-full h-10 px-3 rounded-lg text-sm outline-none"
            style={{ background: 'var(--aura-bg-elevated)', border: '1px solid var(--aura-border)', color: 'var(--text-primary)' }}
          />
        </div>

        <Button className="w-full" onClick={handleSubmit}>
          Apply correction & re-route
        </Button>
      </div>
    </Modal>
  )
}
